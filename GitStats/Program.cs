using System;
using System.Diagnostics;
using System.Threading.Tasks;
using GitStats.Services;

namespace GitStats
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            try
            {
                var parser = new CommandLineParser(args);
                var exportService = new ExportService();
                
                // Measure performance
                var stopwatch = Stopwatch.StartNew();
                
                if (parser.UsesBitbucket)
                {
                    // Bitbucket PR mode
                    await ProcessBitbucketPRs(parser, exportService);
                }
                else
                {
                    // Standard Git commit mode
                    await ProcessGitCommits(parser, exportService);
                }
                
                stopwatch.Stop();
                Console.WriteLine($"Total processing time: {stopwatch.Elapsed.TotalSeconds:F2} seconds");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                Environment.Exit(1);
            }
        }
        
        private static async Task ProcessGitCommits(CommandLineParser parser, ExportService exportService)
        {
            Console.WriteLine($"Processing Git repositories in: {parser.BaseFolder}");
            Console.WriteLine($"Date range: {parser.StartDate:yyyy-MM-dd} to {parser.EndDate:yyyy-MM-dd}");
            
            // Create GitRepositoryService with filtering options
            var gitService = new GitRepositoryService(
                extremeCommitLineThreshold: parser.ExtremeCommitLineThreshold,
                moveCodeRatio: parser.MoveCodeRatio,
                excludeExtremeMoves: parser.ExcludeExtremeMoves
            );
            
            if (parser.ExcludeExtremeMoves)
            {
                Console.WriteLine($"Excluding extreme code-moving commits (threshold: {parser.ExtremeCommitLineThreshold ?? 500} lines, ratio: {parser.MoveCodeRatio ?? 0.8:F1})");
            }
            
            // Null check for BaseFolder
            if (parser.BaseFolder == null)
            {
                throw new ArgumentNullException(nameof(parser.BaseFolder), "Base folder path cannot be null");
            }
            
            // Process repositories
            var commits = await gitService.GetCommitsFromRepositoriesAsync(
                parser.BaseFolder, 
                parser.StartDate, 
                parser.EndDate);
            
            Console.WriteLine($"Found {commits.Count} commits across all repositories");
            
            // Null check for OutputJsonPath
            if (parser.OutputJsonPath == null)
            {
                throw new ArgumentNullException(nameof(parser.OutputJsonPath), "JSON output path cannot be null");
            }
            
            // Export to JSON
            await exportService.ExportToJsonAsync(commits, parser.OutputJsonPath);
            Console.WriteLine($"JSON data exported to: {parser.OutputJsonPath}");
            
            // Null check for OutputCsvPath
            if (parser.OutputCsvPath == null)
            {
                throw new ArgumentNullException(nameof(parser.OutputCsvPath), "CSV output path cannot be null");
            }
            
            // Export to CSV
            await exportService.ExportToCsvAsync(commits, parser.OutputCsvPath);
            Console.WriteLine($"CSV data exported to: {parser.OutputCsvPath}");
        }
        
        private static async Task ProcessBitbucketPRs(CommandLineParser parser, ExportService exportService)
        {
            Console.WriteLine($"Extracting Bitbucket PRs for project: {parser.BitbucketProject}");
            Console.WriteLine($"Date range: {parser.StartDate:yyyy-MM-dd} to {parser.EndDate:yyyy-MM-dd}");
            Console.WriteLine($"Connecting to Bitbucket server: {parser.BitbucketUrl}");
            
            // Null checks for Bitbucket parameters
            if (parser.BitbucketUrl == null)
            {
                throw new ArgumentNullException(nameof(parser.BitbucketUrl), "Bitbucket URL cannot be null");
            }
            
            BitbucketService bitbucketService;
            
            // Determine which authentication method to use
            if (parser.UsesBitbucketApiKey)
            {
                if (parser.BitbucketApiKey == null)
                {
                    throw new ArgumentNullException(nameof(parser.BitbucketApiKey), "Bitbucket API key cannot be null");
                }
                
                // Use API key authentication (recommended)
                bitbucketService = new BitbucketService(
                    parser.BitbucketUrl,
                    parser.BitbucketApiKey
                );
                
                Console.WriteLine("Using API key authentication for Bitbucket");
            }
            else
            {
                // Use username/password authentication (legacy)
                if (parser.BitbucketUsername == null)
                {
                    throw new ArgumentNullException(nameof(parser.BitbucketUsername), "Bitbucket username cannot be null");
                }
                
                if (parser.BitbucketPassword == null)
                {
                    throw new ArgumentNullException(nameof(parser.BitbucketPassword), "Bitbucket password cannot be null");
                }
                
                bitbucketService = new BitbucketService(
                    parser.BitbucketUrl,
                    parser.BitbucketUsername,
                    parser.BitbucketPassword
                );
                
                Console.WriteLine("Using username/password authentication for Bitbucket (legacy method)");
            }
            
            // Null check for project
            if (parser.BitbucketProject == null)
            {
                throw new ArgumentNullException(nameof(parser.BitbucketProject), "Bitbucket project key cannot be null");
            }
            
            // Get all PRs for the project
            var pullRequests = await bitbucketService.GetAllPullRequestsForProjectAsync(
                parser.BitbucketProject,
                parser.StartDate,
                parser.EndDate
            );
            
            Console.WriteLine($"Found {pullRequests.Count} pull requests in date range for project {parser.BitbucketProject}");
            
            // Null check for BitbucketPrJsonPath
            if (parser.BitbucketPrJsonPath == null)
            {
                throw new ArgumentNullException(nameof(parser.BitbucketPrJsonPath), "PR JSON output path cannot be null");
            }
            
            // Export PRs to JSON
            await exportService.ExportToJsonAsync(pullRequests, parser.BitbucketPrJsonPath);
            Console.WriteLine($"PR data exported to: {parser.BitbucketPrJsonPath}");
        }
    }
}