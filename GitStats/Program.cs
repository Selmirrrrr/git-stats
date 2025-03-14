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
            
            var gitService = new GitRepositoryService();
            
            // Process repositories
            var commits = await gitService.GetCommitsFromRepositoriesAsync(
                parser.BaseFolder, 
                parser.StartDate, 
                parser.EndDate);
            
            Console.WriteLine($"Found {commits.Count} commits across all repositories");
            
            // Export to JSON
            await exportService.ExportToJsonAsync(commits, parser.OutputJsonPath);
            Console.WriteLine($"JSON data exported to: {parser.OutputJsonPath}");
            
            // Export to CSV
            await exportService.ExportToCsvAsync(commits, parser.OutputCsvPath);
            Console.WriteLine($"CSV data exported to: {parser.OutputCsvPath}");
        }
        
        private static async Task ProcessBitbucketPRs(CommandLineParser parser, ExportService exportService)
        {
            Console.WriteLine($"Extracting Bitbucket PRs for project: {parser.BitbucketProject}");
            Console.WriteLine($"Date range: {parser.StartDate:yyyy-MM-dd} to {parser.EndDate:yyyy-MM-dd}");
            Console.WriteLine($"Connecting to Bitbucket server: {parser.BitbucketUrl}");
            
            var bitbucketService = new BitbucketService(
                parser.BitbucketUrl,
                parser.BitbucketUsername,
                parser.BitbucketPassword
            );
            
            // Get all PRs for the project
            var pullRequests = await bitbucketService.GetAllPullRequestsForProjectAsync(
                parser.BitbucketProject,
                parser.StartDate,
                parser.EndDate
            );
            
            Console.WriteLine($"Found {pullRequests.Count} pull requests in date range for project {parser.BitbucketProject}");
            
            // Export PRs to JSON
            await exportService.ExportToJsonAsync(pullRequests, parser.BitbucketPrJsonPath);
            Console.WriteLine($"PR data exported to: {parser.BitbucketPrJsonPath}");
        }
    }
}