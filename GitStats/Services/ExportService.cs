using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Threading.Tasks;
using CsvHelper;
using CsvHelper.Configuration;
using GitStats.Models;
using Newtonsoft.Json;

namespace GitStats.Services
{
    public class ExportService
    {
        public async Task ExportToJsonAsync(List<CommitInfo> commits, string outputPath)
        {
            var jsonSettings = new JsonSerializerSettings
            {
                Formatting = Formatting.Indented,
                DateFormatString = "yyyy-MM-dd HH:mm:ss"
            };

            string json = JsonConvert.SerializeObject(commits, jsonSettings);
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
}