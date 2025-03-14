export interface CommitInfo {
  CommitId: string;
  CommitTime: string;
  CommitterEmail: string;
  CommitterName: string;
  CommitMessage: string;
  Additions: number;
  Deletions: number;
  RepositoryName: string;
  SentimentScore?: number;  // Added sentiment score for each commit
}

export interface CommitterStats {
  name: string;
  email: string;
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
  totalChanges: number;
  earlyMorningCommits: number; // Commits between midnight and 6AM
  afterHoursCommits: number;   // Commits outside of standard work hours
  weekendCommits: number;      // Commits on weekends
  burnoutRiskScore: number;    // Calculated burnout risk score
  commitsByHour: number[];     // Distribution of commits by hour of day
  
  // Sentiment analysis stats
  averageSentiment: number;    // Average sentiment score (-1 to 1)
  positivePct: number;         // Percentage of positive commits
  negativePct: number;         // Percentage of negative commits
  
  // Weekend warrior stats
  weekendCommitPct: number;    // Percentage of commits made on weekends
  weekdayCommits: number;      // Number of commits made on weekdays
}

export interface BurnoutRiskLevel {
  level: 'low' | 'moderate' | 'high' | 'severe';
  color: string;
  description: string;
}

export interface SentimentCategory {
  category: string;
  color: string;
}

export interface CommitSentimentTrend {
  dates: string[];
  scores: number[];
}