using System;

namespace GitStats.Models
{
    public class CommitInfo
    {
        public string CommitId { get; set; }
        public DateTime CommitTime { get; set; }
        public string CommitterEmail { get; set; }
        public string CommitterName { get; set; }
        public string CommitMessage { get; set; }
        public int Additions { get; set; }
        public int Deletions { get; set; }
        public string RepositoryName { get; set; }
    }
}