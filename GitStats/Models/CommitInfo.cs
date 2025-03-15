using System;

namespace GitStats.Models
{
    public class CommitInfo
    {
        public required string CommitId { get; set; }
        public DateTime CommitTime { get; set; }
        public required string CommitterEmail { get; set; }
        public required string CommitterName { get; set; }
        public required string CommitMessage { get; set; }
        public int Additions { get; set; }
        public int Deletions { get; set; }
        public required string RepositoryName { get; set; }
    }
}