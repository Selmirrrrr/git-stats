using System.Diagnostics;
using GitStats.Models;
using GitStats.Services;

namespace GitStats
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            try
            {
                var exportService = new ExportService();
                var parser = new CommandLineParser();
                
                // Measure performance
                var stopwatch = Stopwatch.StartNew();
                
                if (args.Contains("mode") && args.Contains("bitbucket"))
                {
                    // Bitbucket PR mode
                    await ProcessBitbucketPRs(parser.ParseBitbucketMode(args), exportService);
                }
                else
                {
                    // Standard Git commit mode
                    await ProcessGitCommits(parser.ParseCommitsMode(args), exportService);
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
        
        private static async Task ProcessGitCommits(GitParameters gitParams, ExportService exportService)
        {
            Console.WriteLine($"Processing Git repositories in: {gitParams.BaseFolder}");
            Console.WriteLine($"Date range: {gitParams.StartDate:yyyy-MM-dd} to {gitParams.EndDate:yyyy-MM-dd}");
            
            // Create GitRepositoryService with filtering options
            var gitService = new GitRepositoryService();
            
            // Null check for BaseFolder
            if (gitParams.BaseFolder == null)
            {
                throw new ArgumentNullException(nameof(gitParams.BaseFolder), "Base folder path cannot be null");
            }
            
            // Process repositories
            var commits = await gitService.GetCommitsFromRepositoriesAsync(
                gitParams.BaseFolder, 
                gitParams.StartDate, 
                gitParams.EndDate);
            
            Console.WriteLine($"Found {commits.Count} commits across all repositories");
            
            // Null check for OutputJsonPath
            if (gitParams.OutputJsonPath == null)
            {
                throw new ArgumentNullException(nameof(gitParams.OutputJsonPath), "JSON output path cannot be null");
            }
            
            // Export to JSON
            await exportService.ExportToJsonAsync(commits, gitParams.OutputJsonPath);
            Console.WriteLine($"JSON data exported to: {gitParams.OutputJsonPath}");
            
            // Null check for OutputCsvPath
            if (gitParams.OutputCsvPath == null)
            {
                throw new ArgumentNullException(nameof(gitParams.OutputCsvPath), "CSV output path cannot be null");
            }
            
            // Export to CSV
            await exportService.ExportToCsvAsync(commits, gitParams.OutputCsvPath);
            Console.WriteLine($"CSV data exported to: {gitParams.OutputCsvPath}");
        }
        
        private static async Task ProcessBitbucketPRs(BitbucketParameters bitbucketParams, ExportService exportService)
        {
            var parser = new CommandLineParser();

            Console.WriteLine($"Extracting Bitbucket PRs for project: {bitbucketParams.BitbucketProject}");
            Console.WriteLine($"Date range: {bitbucketParams.StartDate:yyyy-MM-dd} to {bitbucketParams.EndDate:yyyy-MM-dd}");
            Console.WriteLine($"Connecting to Bitbucket server: {bitbucketParams.BitbucketUrl}");
            
            // Null checks for Bitbucket parameters
            if (bitbucketParams.BitbucketUrl == null)
            {
                throw new ArgumentNullException(nameof(bitbucketParams.BitbucketUrl), "Bitbucket URL cannot be null");
            }
            
            BitbucketService bitbucketService;
            
            if (bitbucketParams.BitbucketApiKey == null)
            {
                throw new ArgumentNullException(nameof(bitbucketParams.BitbucketApiKey), "Bitbucket API key cannot be null");
            }
            
            // Use API key authentication (recommended)
            bitbucketService = new BitbucketService(
                bitbucketParams.BitbucketUrl,
                bitbucketParams.BitbucketApiKey
            );
            
            Console.WriteLine("Using API key authentication for Bitbucket");
            
            // Null check for project
            if (bitbucketParams.BitbucketProject == null)
            {
                throw new ArgumentNullException(nameof(bitbucketParams.BitbucketProject), "Bitbucket project key cannot be null");
            }
            
            // Get all PRs for the project
            var pullRequests = await bitbucketService.GetAllPullRequestsForProjectAsync(
                bitbucketParams.BitbucketProject,
                bitbucketParams.StartDate,
                bitbucketParams.EndDate
            );
            
            Console.WriteLine($"Found {pullRequests.Count} pull requests in date range for project {bitbucketParams.BitbucketProject}");
            
            // Null check for BitbucketPrJsonPath
            if (bitbucketParams.BitbucketPrJsonPath == null)
            {
                throw new ArgumentNullException(nameof(bitbucketParams.BitbucketPrJsonPath), "PR JSON output path cannot be null");
            }
            
            // Export PRs to JSON
            await exportService.ExportToJsonAsync(pullRequests, bitbucketParams.BitbucketPrJsonPath);
            Console.WriteLine($"PR data exported to: {bitbucketParams.BitbucketPrJsonPath}");
        }
    }
}