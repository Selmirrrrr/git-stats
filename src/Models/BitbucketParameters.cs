namespace GitStats.Models
{
    public class BitbucketParameters
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? BitbucketUrl { get; set; }
        public string? BitbucketApiKey { get; set; }
        public string? BitbucketProject { get; set; }
        public string? BitbucketPrJsonPath { get; set; }
    }
}