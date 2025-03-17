using System;
using System.Collections.Generic;

namespace GitStats.Models
{
    public class PullRequestInfo
    {
        public required string Author { get; set; }
        public required string RepositoryName { get; set; }
        public required string ProjectName { get; set; }
        public required string IncomingBranchName { get; set; }
        public required string DestinationBranchName { get; set; }
        public List<string> Validators { get; set; } = new List<string>();
        public List<string> Rejecters { get; set; } = new List<string>();
        public DateTime Date { get; set; }
        public List<PullRequestMessage> Messages { get; set; } = new List<PullRequestMessage>();
    }

    public class PullRequestMessage
    {
        public required string Author { get; set; }
        public required string Message { get; set; }
        public DateTime Date { get; set; }
    }
}