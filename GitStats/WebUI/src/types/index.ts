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

// Pull request related interfaces
export interface PullRequestMessage {
  Author: string;
  Message: string;
  Date: string;
}

export interface PullRequestInfo {
  Author: string;
  RepositoryName: string;
  ProjectName: string;
  IncomingBranchName: string;
  DestinationBranchName: string;
  Validators: string[];
  Rejecters: string[];
  Date: string;
  Messages: PullRequestMessage[];
}

export interface PrAuthorStats {
  name: string;
  totalPRs: number;
  approvalRate: number;
  rejectionRate: number;
  averageReviewers: number;
  responseTimeAvg: number; // Average time to first response in hours
  timeToMergeAvg: number;  // Average time from creation to validation in hours
  repositoryContributions: Record<string, number>; // PRs by repo
}

export interface ReviewerStats {
  name: string;
  totalReviews: number;
  approvalsGiven: number;
  rejectionsGiven: number;
  approvalRate: number;
  responseTimeAvg: number; // Average time to review in hours
  reviewsByRepo: Record<string, number>; // Reviews by repo
}

export interface RepositoryPrStats {
  name: string;
  totalPRs: number;
  averageReviewers: number;
  approvalRate: number;
  averageComments: number;
  timeToMergeAvg: number; // Average time to merge in hours
  mostActiveAuthors: string[]; // Top 5 authors by PR count
  mostActiveReviewers: string[]; // Top 5 reviewers by review count
  mergeTargets: Record<string, number>; // Count of PRs by destination branch
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

export interface ReviewActivityTrend {
  dates: string[];
  prCreated: number[];
  prApproved: number[];
  prRejected: number[];
}