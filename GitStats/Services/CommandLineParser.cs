using System;
using System.Collections.Generic;

namespace GitStats.Services
{
    public class CommandLineParser
    {
        public string? BaseFolder { get; private set; }
        public DateTime StartDate { get; private set; }
        public DateTime EndDate { get; private set; }
        public string? OutputJsonPath { get; private set; }
        public string? OutputCsvPath { get; private set; }
        
        // Bitbucket PR service parameters
        public bool UsesBitbucket { get; private set; }
        public string? BitbucketUrl { get; private set; }
        public string? BitbucketUsername { get; private set; }
        public string? BitbucketPassword { get; private set; }
        public string? BitbucketProject { get; private set; }
        public string? BitbucketPrJsonPath { get; private set; }

        public CommandLineParser(string[] args)
        {
            ParseArguments(args);
        }

        private void ParseArguments(string[] args)
        {
            if (args.Length < 1)
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
                else if (args[i].StartsWith("--") && args[i].Contains("="))
                {
                    // Handle --key=value format
                    string[] parts = args[i].Substring(2).Split('=', 2);
                    if (parts.Length == 2)
                    {
                        string key = parts[0];
                        string value = parts[1];
                        argDict[key] = value;
                    }
                }
            }
            
            // Determine which mode we're operating in: Git commits or Bitbucket PRs
            if (argDict.ContainsKey("mode") && argDict["mode"] == "bitbucket-pr")
            {
                ParseBitbucketMode(argDict);
            }
            else
            {
                ParseCommitsMode(argDict);
            }
        }
        
        private void ParseCommitsMode(Dictionary<string, string> argDict)
        {
            if (!argDict.ContainsKey("folder"))
            {
                Console.WriteLine("Error: Base folder path is required for commits mode.");
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
            ParseCommonDateParams(argDict);
            
            // Set output paths
            OutputJsonPath = argDict.TryGetValue("output-json", out string? jsonPath) 
                ? jsonPath 
                : "git-stats.json";

            OutputCsvPath = argDict.TryGetValue("output-csv", out string? csvPath) 
                ? csvPath 
                : "git-stats.csv";
        }
        
        private void ParseBitbucketMode(Dictionary<string, string> argDict)
        {
            UsesBitbucket = true;
            
            // Validate required parameters for Bitbucket mode
            if (!argDict.ContainsKey("bitbucket-url"))
            {
                Console.WriteLine("Error: Bitbucket URL is required for bitbucket-pr mode.");
                ShowHelp();
                Environment.Exit(1);
            }
            
            if (!argDict.ContainsKey("bitbucket-project"))
            {
                Console.WriteLine("Error: Bitbucket project key is required for bitbucket-pr mode.");
                ShowHelp();
                Environment.Exit(1);
            }
            
            if (!argDict.ContainsKey("bitbucket-username") || !argDict.ContainsKey("bitbucket-password"))
            {
                Console.WriteLine("Error: Bitbucket credentials are required for bitbucket-pr mode.");
                ShowHelp();
                Environment.Exit(1);
            }
            
            // Parse Bitbucket parameters
            BitbucketUrl = argDict["bitbucket-url"];
            BitbucketUsername = argDict["bitbucket-username"];
            BitbucketPassword = argDict["bitbucket-password"];
            BitbucketProject = argDict["bitbucket-project"];
            
            // Parse common date parameters
            ParseCommonDateParams(argDict);
            
            // Set output paths for PR data
            BitbucketPrJsonPath = argDict.TryGetValue("output-pr-json", out string? prJsonPath) 
                ? prJsonPath 
                : "bitbucket-prs.json";
        }
        
        private void ParseCommonDateParams(Dictionary<string, string> argDict)
        {
            // Parse dates
            if (argDict.TryGetValue("start-date", out string? startDateStr))
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

            if (argDict.TryGetValue("end-date", out string? endDateStr))
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
        }

        public void ShowHelp()
        {
            Console.WriteLine("GitStats - Extract statistics from Git repositories and Bitbucket PRs");
            Console.WriteLine("\nUsage for Git Commits Mode:");
            Console.WriteLine("  GitStats --folder <path> [--start-date <yyyy-MM-dd>] [--end-date <yyyy-MM-dd>] [--output-json <file.json>] [--output-csv <file.csv>]");
            Console.WriteLine("\nUsage for Bitbucket PR Mode:");
            Console.WriteLine("  GitStats --mode bitbucket-pr --bitbucket-url <url> --bitbucket-username <username> --bitbucket-password <password> --bitbucket-project <project-key> [--start-date <yyyy-MM-dd>] [--end-date <yyyy-MM-dd>] [--output-pr-json <file.json>]");
            Console.WriteLine("\nCommon Options:");
            Console.WriteLine("  --start-date    Start date for data range (default: 30 days ago)");
            Console.WriteLine("  --end-date      End date for data range (default: today)");
            Console.WriteLine("\nCommit Mode Options:");
            Console.WriteLine("  --folder        Base folder containing Git repositories");
            Console.WriteLine("  --output-json   Output JSON file path for commit data (default: git-stats.json)");
            Console.WriteLine("  --output-csv    Output CSV file path for commit data (default: git-stats.csv)");
            Console.WriteLine("\nBitbucket PR Mode Options:");
            Console.WriteLine("  --bitbucket-url       Bitbucket server URL");
            Console.WriteLine("  --bitbucket-username  Bitbucket username");
            Console.WriteLine("  --bitbucket-password  Bitbucket password");
            Console.WriteLine("  --bitbucket-project   Bitbucket project key");
            Console.WriteLine("  --output-pr-json      Output JSON file path for PR data (default: bitbucket-prs.json)");
        }
    }
}