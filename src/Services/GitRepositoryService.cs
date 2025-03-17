using GitStats.Models;
using LibGit2Sharp;

namespace GitStats.Services
{
    public class GitRepositoryService
    {
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
                    CodeMoveRatio = codeMoveRatio,
                    IsMergeCommit = commit.Parents.Count() > 1
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

        private static (int, int) CalculateCommitStats(Repository repo, Commit commit)
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