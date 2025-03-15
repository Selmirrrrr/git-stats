using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using GitStats.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace GitStats.Services
{
    public class BitbucketService
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;

        // Constructor for API key authentication
        public BitbucketService(string baseUrl, string apiKey)
        {
            _baseUrl = baseUrl.TrimEnd('/');
            _httpClient = new HttpClient();
            
            // Set up Bearer token authentication with API key
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        }
        
        // Constructor for username/password authentication (kept for backward compatibility)
        public BitbucketService(string baseUrl, string username, string password)
        {
            _baseUrl = baseUrl.TrimEnd('/');
            _httpClient = new HttpClient();
            
            // Set up basic authentication
            var authToken = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{username}:{password}"));
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authToken);
        }

        /// <summary>
        /// Get all repositories for a specific project
        /// </summary>
        public async Task<List<string>> GetRepositoriesForProjectAsync(string projectKey)
        {
            var repositories = new List<string>();
            string apiUrl = $"{_baseUrl}/rest/api/1.0/projects/{projectKey}/repos?limit=1000";
            
            try
            {
                var response = await _httpClient.GetStringAsync(apiUrl);
                var jsonResponse = JObject.Parse(response);
                var values = jsonResponse["values"] as JArray;
                
                if (values != null)
                {
                    foreach (var repo in values)
                    {
                        if (repo["slug"] != null)
                        {
                            repositories.Add(repo["slug"]!.ToString());
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting repositories for project {projectKey}: {ex.Message}");
            }
            
            return repositories;
        }
        
        /// <summary>
        /// Get pull requests for a specific repository within a date range
        /// </summary>
        public async Task<List<PullRequestInfo>> GetPullRequestsAsync(string projectKey, string repositorySlug, DateTime startDate, DateTime endDate)
        {
            var pullRequests = new List<PullRequestInfo>();
            
            // Start with page 0 (Bitbucket API is 0-indexed for pages)
            int start = 0;
            int limit = 100;
            bool hasMore = true;
            
            while (hasMore)
            {
                string apiUrl = $"{_baseUrl}/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests?state=ALL&limit={limit}&start={start}";
                
                try
                {
                    var response = await _httpClient.GetStringAsync(apiUrl);
                    var jsonResponse = JObject.Parse(response);
                    var values = jsonResponse["values"] as JArray;
                    
                    // Check if we have more results using safe conversion
                    if (jsonResponse["isLastPage"] != null)
                    {
                        var isLastPage = jsonResponse["isLastPage"];
                        hasMore = isLastPage != null && !(bool)isLastPage;
                    }
                    else
                    {
                        hasMore = false; // Default to false if isLastPage is null
                    }
                    
                    if (hasMore && jsonResponse["nextPageStart"] != null)
                    {
                        var nextPageStart = jsonResponse["nextPageStart"];
                        if (nextPageStart != null)
                        {
                            start = (int)nextPageStart;
                        }
                    }
                    else if (hasMore)
                    {
                        hasMore = false; // Can't continue without a valid next page
                    }
                    
                    if (values != null)
                    {
                        foreach (var pr in values)
                        {
                            // Parse PR creation date with null check
                            if (pr["createdDate"] == null)
                            {
                                continue; // Skip this PR if createdDate is missing
                            }
                            
                            var createdDateToken = pr["createdDate"];
                            if (createdDateToken == null)
                            {
                                continue; // Skip if null
                            }
                            var createdDate = DateTimeOffset.FromUnixTimeMilliseconds((long)createdDateToken).DateTime;
                            
                            // Skip if outside date range
                            if (createdDate < startDate || createdDate > endDate)
                            {
                                continue;
                            }
                            
                            var prInfo = new PullRequestInfo
                            {
                                Author = pr["author"]?["user"]?["displayName"]?.ToString() ?? "Unknown",
                                RepositoryName = repositorySlug,
                                ProjectName = projectKey,
                                Date = createdDate,
                                IncomingBranchName = pr["fromRef"]?["displayId"]?.ToString() ?? "Unknown",
                                DestinationBranchName = pr["toRef"]?["displayId"]?.ToString() ?? "Unknown"
                            };
                            
                            // Get reviewers info
                            if (pr["reviewers"] is JArray reviewers && reviewers.Count > 0)
                            {
                                foreach (var reviewer in reviewers)
                                {
                                    bool approved = false;
                                    if (reviewer["approved"] != null)
                                    {
                                        var approvedToken = reviewer["approved"];
                                        if (approvedToken != null)
                                        {
                                            approved = (bool)approvedToken;
                                        }
                                    }
                                    var reviewerName = reviewer["user"]?["displayName"]?.ToString() ?? "Unknown Reviewer";
                                    
                                    if (approved)
                                    {
                                        prInfo.Validators.Add(reviewerName);
                                    }
                                    else
                                    {
                                        prInfo.Rejecters.Add(reviewerName);
                                    }
                                }
                            }
                            
                            // Get PR comments/messages
                            var idToken = pr["id"];
                            if (idToken != null)
                            {
                                await GetPullRequestCommentsAsync(projectKey, repositorySlug, (int)idToken, prInfo);
                            }
                            
                            pullRequests.Add(prInfo);
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error getting pull requests for {projectKey}/{repositorySlug}: {ex.Message}");
                    hasMore = false;
                }
            }
            
            return pullRequests;
        }
        
        /// <summary>
        /// Get comments for a specific pull request
        /// </summary>
        private async Task GetPullRequestCommentsAsync(string projectKey, string repositorySlug, int pullRequestId, PullRequestInfo prInfo)
        {
            string apiUrl = $"{_baseUrl}/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/activities";
            
            try
            {
                var response = await _httpClient.GetStringAsync(apiUrl);
                var jsonResponse = JObject.Parse(response);
                var activities = jsonResponse["values"] as JArray;
                
                if (activities != null)
                {
                    foreach (var activity in activities)
                    {
                        if (activity["action"]?.ToString() == "COMMENTED")
                        {
                            var comment = activity["comment"];
                            if (comment != null)
                            {
                                // Check if createdDate exists
                                if (activity["createdDate"] == null)
                                {
                                    continue; // Skip this comment if date is missing
                                }
                                
                                var createdDateToken = activity["createdDate"];
                                if (createdDateToken == null)
                                {
                                    continue; // Skip if null
                                }
                                var messageDate = DateTimeOffset.FromUnixTimeMilliseconds((long)createdDateToken).DateTime;
                                
                                prInfo.Messages.Add(new PullRequestMessage
                                {
                                    Author = activity["user"]?["displayName"]?.ToString() ?? "Unknown",
                                    Message = comment["text"]?.ToString() ?? "No message content",
                                    Date = messageDate
                                });
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting PR comments for PR {pullRequestId}: {ex.Message}");
            }
        }
        
        /// <summary>
        /// Get all pull requests for all repositories in a project
        /// </summary>
        public async Task<List<PullRequestInfo>> GetAllPullRequestsForProjectAsync(string projectKey, DateTime startDate, DateTime endDate)
        {
            var allPullRequests = new List<PullRequestInfo>();
            
            // First, get all repositories in the project
            var repositories = await GetRepositoriesForProjectAsync(projectKey);
            Console.WriteLine($"Found {repositories.Count} repositories in project {projectKey}");
            
            // Process each repository
            foreach (var repo in repositories)
            {
                Console.WriteLine($"Processing repository: {repo}");
                var pullRequests = await GetPullRequestsAsync(projectKey, repo, startDate, endDate);
                allPullRequests.AddRange(pullRequests);
                Console.WriteLine($"Found {pullRequests.Count} PRs in date range for {repo}");
            }
            
            return allPullRequests;
        }
    }
}