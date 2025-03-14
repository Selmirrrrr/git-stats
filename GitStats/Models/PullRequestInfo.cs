using System;
using System.Collections.Generic;

namespace GitStats.Models
{
    public class PullRequestInfo
    {
        public string Author { get; set; }
        public string RepositoryName { get; set; }
        public string ProjectName { get; set; }
        public string IncomingBranchName { get; set; }
        public string DestinationBranchName { get; set; }
        public List<string> Validators { get; set; } = new List<string>();
        public List<string> Rejecters { get; set; } = new List<string>();
        public DateTime Date { get; set; }
        public List<PullRequestMessage> Messages { get; set; } = new List<PullRequestMessage>();
    }

    public class PullRequestMessage
    {
        public string Author { get; set; }
        public string Message { get; set; }
        public DateTime Date { get; set; }
    }
}