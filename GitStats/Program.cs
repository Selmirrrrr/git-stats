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
                
                Console.WriteLine($"Processing Git repositories in: {parser.BaseFolder}");
                Console.WriteLine($"Date range: {parser.StartDate:yyyy-MM-dd} to {parser.EndDate:yyyy-MM-dd}");
                
                var gitService = new GitRepositoryService();
                var exportService = new ExportService();
                
                // Measure performance
                var stopwatch = Stopwatch.StartNew();
                
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
                
                stopwatch.Stop();
                Console.WriteLine($"Total processing time: {stopwatch.Elapsed.TotalSeconds:F2} seconds");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Environment.Exit(1);
            }
        }
    }
}