namespace GitStats.Models
{
    public class GitParameters
    {
        public string? BaseFolder { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? OutputJsonPath { get; set; }
        public string? OutputCsvPath { get; set; }
    }
}