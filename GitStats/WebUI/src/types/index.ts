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
}