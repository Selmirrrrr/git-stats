using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using GitStats.Models;
using Newtonsoft.Json;

namespace GitStats.Services
{
    public class ExportService
    {
        public async Task ExportToJsonAsync<T>(List<T> data, string outputPath)
        {
            var jsonSettings = new JsonSerializerSettings
            {
                Formatting = Formatting.Indented,
                DateFormatString = "yyyy-MM-dd HH:mm:ss"
            };

            string json = JsonConvert.SerializeObject(data, jsonSettings);
            await File.WriteAllTextAsync(outputPath, json);
        }

        public async Task ExportToCsvAsync(List<CommitInfo> commits, string outputPath)
        {
            var config = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                Delimiter = ",",
                HasHeaderRecord = true
            };

            using var writer = new StreamWriter(outputPath);
            using var csv = new CsvWriter(writer, config);
            
            // Register custom mappings for DateTime formatting
            csv.Context.RegisterClassMap<CommitInfoMap>();
            
            await csv.WriteRecordsAsync(commits);
        }
        
        public async Task ExportPullRequestsToCsvAsync(List<PullRequestInfo> pullRequests, string outputPath)
        {
            var config = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                Delimiter = ",",
                HasHeaderRecord = true
            };

            using var writer = new StreamWriter(outputPath);
            using var csv = new CsvWriter(writer, config);
            
            // Register custom mappings for PullRequestInfo
            csv.Context.RegisterClassMap<PullRequestInfoMap>();
            
            await csv.WriteRecordsAsync(pullRequests);
        }
    }

    public class CommitInfoMap : ClassMap<CommitInfo>
    {
        public CommitInfoMap()
        {
            Map(m => m.CommitId).Name("Commit ID");
            Map(m => m.CommitTime).Name("Commit Time").TypeConverterOption.Format("yyyy-MM-dd HH:mm:ss");
            Map(m => m.CommitterEmail).Name("Committer Email");
            Map(m => m.CommitterName).Name("Committer Name");
            Map(m => m.CommitMessage).Name("Commit Message");
            Map(m => m.Additions).Name("Additions");
            Map(m => m.Deletions).Name("Deletions");
            Map(m => m.RepositoryName).Name("Repository Name");
        }
    }
    
    public class PullRequestInfoMap : ClassMap<PullRequestInfo>
    {
        public PullRequestInfoMap()
        {
            Map(m => m.Author).Name("Author");
            Map(m => m.RepositoryName).Name("Repository Name");
            Map(m => m.ProjectName).Name("Project Name");
            Map(m => m.IncomingBranchName).Name("Source Branch");
            Map(m => m.DestinationBranchName).Name("Target Branch");
            Map(m => m.Date).Name("Created Date").TypeConverterOption.Format("yyyy-MM-dd HH:mm:ss");
            // Note: The list properties (Validators, Rejecters, Messages) will be serialized as JSON in the CSV
            // For complex objects in a CSV, you typically need a custom type converter
            Map(m => JsonConvert.SerializeObject(m.Validators)).Name("Validators");
            Map(m => JsonConvert.SerializeObject(m.Rejecters)).Name("Rejecters");
            Map(m => JsonConvert.SerializeObject(m.Messages)).Name("Messages");
        }
    }
}