using System;
using System.Collections.Generic;

namespace GitStats.Services
{
    public class CommandLineParser
    {
        public string BaseFolder { get; private set; }
        public DateTime StartDate { get; private set; }
        public DateTime EndDate { get; private set; }
        public string OutputJsonPath { get; private set; }
        public string OutputCsvPath { get; private set; }

        public CommandLineParser(string[] args)
        {
            ParseArguments(args);
        }

        private void ParseArguments(string[] args)
        {
            if (args.Length < 3)
            {
                ShowHelp();
                Environment.Exit(1);
            }

            var argDict = new Dictionary<string, string>();
            
            for (int i = 0; i < args.Length; i++)
            {
                if (args[i].StartsWith("--") && i + 1 < args.Length && !args[i + 1].StartsWith("--"))
                {
                    string key = args[i].Substring(2);
                    string value = args[i + 1];
                    argDict[key] = value;
                    i++;
                }
            }

            if (!argDict.ContainsKey("folder"))
            {
                Console.WriteLine("Error: Base folder path is required.");
                ShowHelp();
                Environment.Exit(1);
            }

            BaseFolder = argDict["folder"];

            if (!System.IO.Directory.Exists(BaseFolder))
            {
                Console.WriteLine($"Error: Folder does not exist: {BaseFolder}");
                Environment.Exit(1);
            }
            
            // Parse dates
            if (argDict.TryGetValue("start-date", out string startDateStr))
            {
                if (!DateTime.TryParse(startDateStr, out DateTime parsedStartDate))
                {
                    Console.WriteLine($"Error: Invalid start date format: {startDateStr}. Use yyyy-MM-dd format.");
                    Environment.Exit(1);
                }
                StartDate = parsedStartDate;
            }
            else
            {
                // Default to 30 days ago if not specified
                StartDate = DateTime.Now.AddDays(-30);
            }

            if (argDict.TryGetValue("end-date", out string endDateStr))
            {
                if (!DateTime.TryParse(endDateStr, out DateTime parsedEndDate))
                {
                    Console.WriteLine($"Error: Invalid end date format: {endDateStr}. Use yyyy-MM-dd format.");
                    Environment.Exit(1);
                }
                EndDate = parsedEndDate;
            }
            else
            {
                // Default to current date if not specified
                EndDate = DateTime.Now;
            }

            // Set output paths
            OutputJsonPath = argDict.TryGetValue("output-json", out string jsonPath) 
                ? jsonPath 
                : "git-stats.json";

            OutputCsvPath = argDict.TryGetValue("output-csv", out string csvPath) 
                ? csvPath 
                : "git-stats.csv";
        }

        public void ShowHelp()
        {
            Console.WriteLine("GitStats - Extract commit statistics from multiple Git repositories");
            Console.WriteLine("\nUsage:");
            Console.WriteLine("  GitStats --folder <path> [--start-date <yyyy-MM-dd>] [--end-date <yyyy-MM-dd>] [--output-json <file.json>] [--output-csv <file.csv>]");
            Console.WriteLine("\nOptions:");
            Console.WriteLine("  --folder        Base folder containing Git repositories");
            Console.WriteLine("  --start-date    Start date for commit history (default: 30 days ago)");
            Console.WriteLine("  --end-date      End date for commit history (default: today)");
            Console.WriteLine("  --output-json   Output JSON file path (default: git-stats.json)");
            Console.WriteLine("  --output-csv    Output CSV file path (default: git-stats.csv)");
        }
    }
}