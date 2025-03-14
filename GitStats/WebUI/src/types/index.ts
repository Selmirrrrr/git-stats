export interface CommitInfo {
  CommitId: string;
  CommitTime: string;
  CommitterEmail: string;
  CommitterName: string;
  CommitMessage: string;
  Additions: number;
  Deletions: number;
  RepositoryName: string;
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
}

export interface BurnoutRiskLevel {
  level: 'low' | 'moderate' | 'high' | 'severe';
  color: string;
  description: string;
}