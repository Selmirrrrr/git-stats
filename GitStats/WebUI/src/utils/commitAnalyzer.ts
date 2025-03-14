import { CommitInfo, CommitterStats } from '../types';
import { format, parseISO, getHours, getDay, getMonth, getDate } from 'date-fns';

export function parseCommitData(commits: CommitInfo[]): CommitInfo[] {
  return commits.map(commit => ({
    ...commit,
    CommitTime: commit.CommitTime || new Date().toISOString()
  }));
}

export function getCommitterStats(commits: CommitInfo[]): CommitterStats[] {
  const committerMap = new Map<string, CommitterStats>();

  commits.forEach(commit => {
    // Use only email as the key
    const key = commit.CommitterEmail;
    
    // Get existing stats or create new ones
    const existingStats = committerMap.get(key) || {
      name: commit.CommitterName,
      email: commit.CommitterEmail,
      totalCommits: 0,
      totalAdditions: 0,
      totalDeletions: 0,
      totalChanges: 0,
      earlyMorningCommits: 0
    };

    const commitTime = new Date(commit.CommitTime);
    const hour = getHours(commitTime);
    
    existingStats.totalCommits += 1;
    existingStats.totalAdditions += commit.Additions;
    existingStats.totalDeletions += commit.Deletions;
    existingStats.totalChanges += commit.Additions + commit.Deletions;
    
    if (hour >= 0 && hour < 6) {
      existingStats.earlyMorningCommits += 1;
    }

    committerMap.set(key, existingStats);
  });

  return Array.from(committerMap.values());
}

export function getTopCommitters(committerStats: CommitterStats[], sortBy: keyof CommitterStats, limit: number = 3): CommitterStats[] {
  return [...committerStats]
    .sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number))
    .slice(0, limit);
}

export function getCommitsByTimeframe(commits: CommitInfo[], timeframeType: 'weekday' | 'month' | 'dayOfMonth'): { label: string, count: number }[] {
  const countMap = new Map<number, number>();
  
  commits.forEach(commit => {
    const date = new Date(commit.CommitTime);
    let key: number;
    
    switch (timeframeType) {
      case 'weekday': {
        // Convert from Sunday=0 to Monday=0 format
        const day = getDay(date); // 0 is Sunday, 6 is Saturday
        key = day === 0 ? 6 : day - 1; // Transform to Monday=0, Sunday=6
        break;
      }
      case 'month':
        key = getMonth(date); // 0 is January, 11 is December
        break;
      case 'dayOfMonth':
        key = getDate(date) - 1; // 1-31
        break;
      default:
        key = 0;
    }
    
    countMap.set(key, (countMap.get(key) || 0) + 1);
  });
  
  let labels: string[] = [];
  
  switch (timeframeType) {
    case 'weekday':
      // European format: Monday first, Sunday last
      labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      break;
    case 'month':
      labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      break;
    case 'dayOfMonth':
      labels = Array.from({ length: 31 }, (_, i) => `${i + 1}`);
      break;
  }
  
  return labels.map((label, index) => ({
    label,
    count: countMap.get(index) || 0
  }));
}

export function searchCommitById(commits: CommitInfo[], searchTerm: string): CommitInfo | undefined {
  return commits.find(commit => commit.CommitId.includes(searchTerm));
}

export function searchCommitsByText(commits: CommitInfo[], searchTerm: string): CommitInfo[] {
  const lowerSearchTerm = searchTerm.toLowerCase();
  return commits.filter(commit => 
    commit.CommitMessage.toLowerCase().includes(lowerSearchTerm) ||
    commit.CommitterName.toLowerCase().includes(lowerSearchTerm) ||
    commit.CommitterEmail.toLowerCase().includes(lowerSearchTerm) ||
    commit.RepositoryName.toLowerCase().includes(lowerSearchTerm)
  );
}