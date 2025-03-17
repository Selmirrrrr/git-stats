using GitStats.Models;

namespace GitStats.Services
{
    public class CommandLineParser
    {
        private Dictionary<string, string> ArgsToDict(string[] args)
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

            return argDict;
        }
        
        public GitParameters ParseCommitsMode(string[] args)
        {
            var argDict = ArgsToDict(args);

            var gitParams = new GitParameters();

            if (!argDict.ContainsKey("folder"))
            {
                Console.WriteLine("Error: Base folder path is required for commits mode.");
                ShowHelp();
                Environment.Exit(1);
            }

            gitParams.BaseFolder = argDict["folder"];

            if (!Directory.Exists(gitParams.BaseFolder))
            {
                Console.WriteLine($"Error: Folder does not exist: {gitParams.BaseFolder}");
                Environment.Exit(1);
            }
            
            // Parse common date parameters
            var (startDate, endDate) = ParseCommonDateParams(argDict);
            gitParams.StartDate = startDate;
            gitParams.EndDate = endDate;
            
            // Set output paths
            gitParams.OutputJsonPath = argDict.TryGetValue("output-json", out string? jsonPath) 
                ? jsonPath 
                : "git-stats.json";

            gitParams.OutputCsvPath = argDict.TryGetValue("output-csv", out string? csvPath) 
                ? csvPath 
                : "git-stats.csv";

            return gitParams;
        }
        
        public BitbucketParameters ParseBitbucketMode(string[] args)
        {
            var argDict = ArgsToDict(args);

            var bitbucketParams = new BitbucketParameters();

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
            
            // Check for either username/password OR API key authentication
            bool hasApiKey = argDict.ContainsKey("bitbucket-api-key");
            
            if (!hasApiKey)
            {
                Console.WriteLine("Error: Either Bitbucket API key or username/password credentials are required.");
                Console.WriteLine("Use --bitbucket-api-key for API key authentication (recommended)");
                Console.WriteLine("Or use both --bitbucket-username and --bitbucket-password for basic authentication");
                ShowHelp();
                Environment.Exit(1);
            }
            
            // Parse Bitbucket parameters
            bitbucketParams.BitbucketUrl = argDict["bitbucket-url"];
            bitbucketParams.BitbucketApiKey = argDict["bitbucket-api-key"];
            bitbucketParams.BitbucketProject = argDict["bitbucket-project"];
            
            // Parse common date parameters
            var (startDate, endDate) = ParseCommonDateParams(argDict);
            bitbucketParams.StartDate = startDate;
            bitbucketParams.EndDate = endDate;
            
            // Set output paths for PR data
            bitbucketParams.BitbucketPrJsonPath = argDict.TryGetValue("output-pr-json", out string? prJsonPath) 
                ? prJsonPath 
                : "bitbucket-prs.json";

            return bitbucketParams;
        }
        
        private (DateTime StartDate, DateTime EndDate) ParseCommonDateParams(Dictionary<string, string> argDict)
        {
            var startDate = DateTime.Now.AddDays(-30);
            var endDate = DateTime.Now;

            // Parse dates
            if (argDict.TryGetValue("start-date", out string? startDateStr))
            {
                if (!DateTime.TryParse(startDateStr, out DateTime parsedStartDate))
                {
                    Console.WriteLine($"Error: Invalid start date format: {startDateStr}. Use yyyy-MM-dd format.");
                    Environment.Exit(1);
                }
                startDate = parsedStartDate;
            }

            if (argDict.TryGetValue("end-date", out string? endDateStr))
            {
                if (!DateTime.TryParse(endDateStr, out DateTime parsedEndDate))
                {
                    Console.WriteLine($"Error: Invalid end date format: {endDateStr}. Use yyyy-MM-dd format.");
                    Environment.Exit(1);
                }
                endDate = parsedEndDate;
            }

            return (startDate, endDate);
        }

        public void ShowHelp()
        {
            Console.WriteLine("GitStats - Extract statistics from Git repositories and Bitbucket PRs");
            Console.WriteLine("\nUsage for Git Commits Mode:");
            Console.WriteLine("  GitStats --folder <path> [--start-date <yyyy-MM-dd>] [--end-date <yyyy-MM-dd>] [--output-json <file.json>] [--output-csv <file.csv>]");
            Console.WriteLine("\nUsage for Bitbucket PR Mode (API Key authentication - recommended):");
            Console.WriteLine("  GitStats --mode bitbucket-pr --bitbucket-url <url> --bitbucket-api-key <api-key> --bitbucket-project <project-key> [--start-date <yyyy-MM-dd>] [--end-date <yyyy-MM-dd>] [--output-pr-json <file.json>]");
            
            Console.WriteLine("\nUsage for Bitbucket PR Mode (Username/Password authentication - legacy):");
            Console.WriteLine("  GitStats --mode bitbucket-pr --bitbucket-url <url> --bitbucket-username <username> --bitbucket-password <password> --bitbucket-project <project-key> [--start-date <yyyy-MM-dd>] [--end-date <yyyy-MM-dd>] [--output-pr-json <file.json>]");
            
            Console.WriteLine("\nCommon Options:");
            Console.WriteLine("  --start-date    Start date for data range (default: 30 days ago)");
            Console.WriteLine("  --end-date      End date for data range (default: today)");
            
            Console.WriteLine("\nCommit Mode Options:");
            Console.WriteLine("  --folder             Base folder containing Git repositories");
            Console.WriteLine("  --output-json        Output JSON file path for commit data (default: git-stats.json)");
            Console.WriteLine("  --output-csv         Output CSV file path for commit data (default: git-stats.csv)");
            
            Console.WriteLine("\nBitbucket PR Mode Options:");
            Console.WriteLine("  --bitbucket-url       Bitbucket server URL");
            Console.WriteLine("  --bitbucket-api-key   Bitbucket API key for Bearer token authentication (recommended)");
            Console.WriteLine("  --bitbucket-project   Bitbucket project key");
            Console.WriteLine("  --output-pr-json      Output JSON file path for PR data (default: bitbucket-prs.json)");
        }
    }
}