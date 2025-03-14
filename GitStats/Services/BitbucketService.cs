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
        private readonly string _username;
        private readonly string _password;

        public BitbucketService(string baseUrl, string username, string password)
        {
            _baseUrl = baseUrl.TrimEnd('/');
            _username = username;
            _password = password;
            _httpClient = new HttpClient();
            
            // Set up basic authentication
            var authToken = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_username}:{_password}"));
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
                        repositories.Add(repo["slug"].ToString());
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
                    
                    // Check if we have more results
                    hasMore = jsonResponse["isLastPage"] != null && !(bool)jsonResponse["isLastPage"];
                    if (hasMore)
                    {
                        start = (int)jsonResponse["nextPageStart"];
                    }
                    
                    if (values != null)
                    {
                        foreach (var pr in values)
                        {
                            // Parse PR creation date
                            var createdDate = DateTimeOffset.FromUnixTimeMilliseconds((long)pr["createdDate"]).DateTime;
                            
                            // Skip if outside date range
                            if (createdDate < startDate || createdDate > endDate)
                            {
                                continue;
                            }
                            
                            var prInfo = new PullRequestInfo
                            {
                                Author = pr["author"]["user"]["displayName"].ToString(),
                                RepositoryName = repositorySlug,
                                ProjectName = projectKey,
                                Date = createdDate,
                                IncomingBranchName = pr["fromRef"]["displayId"].ToString(),
                                DestinationBranchName = pr["toRef"]["displayId"].ToString()
                            };
                            
                            // Get reviewers info
                            if (pr["reviewers"] is JArray reviewers && reviewers.Count > 0)
                            {
                                foreach (var reviewer in reviewers)
                                {
                                    var approved = reviewer["approved"] != null && (bool)reviewer["approved"];
                                    var reviewerName = reviewer["user"]["displayName"].ToString();
                                    
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
                            await GetPullRequestCommentsAsync(projectKey, repositorySlug, (int)pr["id"], prInfo);
                            
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
                                var messageDate = DateTimeOffset.FromUnixTimeMilliseconds((long)activity["createdDate"]).DateTime;
                                
                                prInfo.Messages.Add(new PullRequestMessage
                                {
                                    Author = activity["user"]["displayName"].ToString(),
                                    Message = comment["text"].ToString(),
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