using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using GitStats.Models;
using LibGit2Sharp;

namespace GitStats.Services
{
    public class GitRepositoryService
    {
        // Configuration for commit filtering
        private readonly double _moveCodeRatio = 0.8; // If deleted lines are X% of added lines, it's likely just moving code
        
        // Constructor with default values
        public GitRepositoryService(double? moveCodeRatio = null)
        {
            if (moveCodeRatio.HasValue)
                _moveCodeRatio = moveCodeRatio.Value;
        }
        
        public async Task<List<CommitInfo>> GetCommitsFromRepositoriesAsync(string baseFolder, DateTime startDate, DateTime endDate)
        {
            var commitsList = new List<CommitInfo>();
            var repoFolders = Directory.GetDirectories(baseFolder)
                .Where(dir => Directory.Exists(Path.Combine(dir, ".git")))
                .ToList();

            var tasks = repoFolders.Select(repoPath => Task.Run(() => 
            {
                try
                {
                    Console.WriteLine($"Processing repository: {Path.GetFileName(repoPath)}");
                    using var repo = new Repository(repoPath);
                    var repoCommits = GetCommitsFromRepository(repo, startDate, endDate, Path.GetFileName(repoPath));
                    return repoCommits;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error processing repository {Path.GetFileName(repoPath)}: {ex.Message}");
                    return new List<CommitInfo>();
                }
            })).ToArray();

            var results = await Task.WhenAll(tasks);
            foreach (var result in results)
            {
                commitsList.AddRange(result);
            }

            return commitsList;
        }

        private List<CommitInfo> GetCommitsFromRepository(Repository repo, DateTime startDate, DateTime endDate, string repoName)
        {
            var commitInfos = new List<CommitInfo>();
            var filter = new CommitFilter
            {
                IncludeReachableFrom = repo.Head.CanonicalName,
                SortBy = CommitSortStrategies.Time
            };

            var commits = repo.Commits.QueryBy(filter);

            foreach (var commit in commits)
            {
                // Skip if commit date is outside the specified range
                if (commit.Author.When.DateTime < startDate || commit.Author.When.DateTime > endDate)
                    continue;

                // Calculate additions and deletions
                var stats = CalculateCommitStats(repo, commit);
                int additions = stats.Item1;
                int deletions = stats.Item2;

                // Calculate code move metrics
                double codeMoveRatio = CalculateCodeMoveRatio(additions, deletions);
                bool isPotentialCodeMove = IsCodeMoveCommit(additions, deletions, codeMoveRatio);

                commitInfos.Add(new CommitInfo
                {
                    CommitId = commit.Id.ToString(),
                    CommitTime = commit.Author.When.DateTime,
                    CommitterEmail = commit.Committer.Email,
                    CommitterName = commit.Committer.Name,
                    CommitMessage = commit.Message,
                    Additions = additions,
                    Deletions = deletions,
                    RepositoryName = repoName,
                    IsPotentialCodeMove = isPotentialCodeMove,
                    CodeMoveRatio = codeMoveRatio
                });
            }

            return commitInfos;
        }
        
        /// <summary>
        /// Calculates the ratio of potential code movement (0-1)
        /// </summary>
        private double CalculateCodeMoveRatio(int additions, int deletions)
        {
            // If either additions or deletions are 0, there's no code move
            if (additions == 0 || deletions == 0)
                return 0;
                
            // Calculate the ratio of smaller to larger (to get a value between 0 and 1)
            return (double)Math.Min(additions, deletions) / Math.Max(additions, deletions);
        }
        
        /// <summary>
        /// Determines if a commit is likely just moving code around without adding real value
        /// </summary>
        private bool IsCodeMoveCommit(int additions, int deletions, double ratio)
        {
            // Must have both additions and deletions to be a move
            if (additions == 0 || deletions == 0)
                return false;
                
            // If the ratio is above our threshold, it's likely a code move
            return ratio >= _moveCodeRatio;
        }

        private (int, int) CalculateCommitStats(Repository repo, Commit commit)
        {
            try
            {
                if (commit.Parents.Count() == 0)
                {
                    // For first commit, count all lines as additions
                    var tree = commit.Tree;
                    int additions = 0;

                    foreach (var entry in tree)
                    {
                        if (entry.TargetType == TreeEntryTargetType.Blob)
                        {
                            var blob = (Blob)entry.Target;
                            if (!blob.IsBinary)
                            {
                                using var contentStream = new StreamReader(blob.GetContentStream());
                                string content = contentStream.ReadToEnd();
                                additions += content.Split('\n').Length;
                            }
                        }
                    }

                    return (additions, 0);
                }
                else
                {
                    var parent = commit.Parents.First();
                    var patch = repo.Diff.Compare<Patch>(parent.Tree, commit.Tree);
                    return (patch.LinesAdded, patch.LinesDeleted);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error calculating stats for commit {commit.Id}: {ex.Message}");
                return (0, 0);
            }
        }
    }
}