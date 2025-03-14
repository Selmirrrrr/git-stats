import { CommitInfo, CommitterStats, BurnoutRiskLevel } from '../types';
import { format, parseISO, getHours, getDay, getMonth, getDate, isWeekend } from 'date-fns';

// Define standard work hours (9 AM to 5 PM)
const WORK_HOURS_START = 9;
const WORK_HOURS_END = 17;

// Define burnout risk thresholds
const BURNOUT_THRESHOLDS = {
  LOW: 20,      // 0-20%: Low risk
  MODERATE: 35, // 21-35%: Moderate risk
  HIGH: 50,     // 36-50%: High risk
  // Above 50%: Severe risk
};

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
      earlyMorningCommits: 0,
      afterHoursCommits: 0,
      weekendCommits: 0,
      burnoutRiskScore: 0,
      commitsByHour: Array(24).fill(0) // Initialize 24 hours with zeros
    };

    const commitTime = new Date(commit.CommitTime);
    const hour = getHours(commitTime);
    const isWeekendDay = isWeekend(commitTime);
    
    // Update basic stats
    existingStats.totalCommits += 1;
    existingStats.totalAdditions += commit.Additions;
    existingStats.totalDeletions += commit.Deletions;
    existingStats.totalChanges += commit.Additions + commit.Deletions;
    
    // Update hour distribution
    existingStats.commitsByHour[hour] += 1;
    
    // Update burnout risk indicators
    if (hour >= 0 && hour < 6) {
      existingStats.earlyMorningCommits += 1;
    }
    
    // After hours: before work hours or after work hours
    if (hour < WORK_HOURS_START || hour >= WORK_HOURS_END) {
      existingStats.afterHoursCommits += 1;
    }
    
    // Weekend commits
    if (isWeekendDay) {
      existingStats.weekendCommits += 1;
    }

    committerMap.set(key, existingStats);
  });

  // Calculate burnout risk scores
  const committerStats = Array.from(committerMap.values());
  committerStats.forEach(stats => {
    // Calculate percentages
    const afterHoursPercent = (stats.afterHoursCommits / stats.totalCommits) * 100;
    const earlyMorningPercent = (stats.earlyMorningCommits / stats.totalCommits) * 100;
    const weekendPercent = (stats.weekendCommits / stats.totalCommits) * 100;
    
    // Weighted burnout risk score (scale of 0-100)
    // Early morning commits are weighted more heavily as they indicate extreme hours
    stats.burnoutRiskScore = Math.min(100, Math.round(
      (afterHoursPercent * 0.4) + 
      (earlyMorningPercent * 0.4) + 
      (weekendPercent * 0.2)
    ));
  });

  return committerStats;
}

export function getBurnoutRiskLevel(score: number): BurnoutRiskLevel {
  if (score <= BURNOUT_THRESHOLDS.LOW) {
    return {
      level: 'low',
      color: 'rgb(34, 197, 94)', // green-500
      description: 'Healthy work pattern with occasional after-hours work'
    };
  } else if (score <= BURNOUT_THRESHOLDS.MODERATE) {
    return {
      level: 'moderate',
      color: 'rgb(234, 179, 8)', // yellow-500
      description: 'Some after-hours work that may need attention'
    };
  } else if (score <= BURNOUT_THRESHOLDS.HIGH) {
    return {
      level: 'high',
      color: 'rgb(249, 115, 22)', // orange-500
      description: 'Significant after-hours work that indicates potential burnout risk'
    };
  } else {
    return {
      level: 'severe',
      color: 'rgb(239, 68, 68)', // red-500
      description: 'Extensive after-hours work suggesting high burnout risk'
    };
  }
}

export function getCommitsByHour(commits: CommitInfo[]): { label: string, count: number }[] {
  const hourCounts = Array(24).fill(0);
  
  commits.forEach(commit => {
    const date = new Date(commit.CommitTime);
    const hour = getHours(date);
    hourCounts[hour]++;
  });
  
  return hourCounts.map((count, hour) => ({
    label: hour.toString().padStart(2, '0') + ':00',
    count
  }));
}

export function getTopCommitters(committerStats: CommitterStats[], sortBy: keyof CommitterStats, limit: number = 3): CommitterStats[] {
  return [...committerStats]
    .sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number))
    .slice(0, limit);
}

export function getCommitsByTimeframe(commits: CommitInfo[], timeframeType: 'weekday' | 'month' | 'dayOfMonth' | 'hour'): { label: string, count: number }[] {
  if (timeframeType === 'hour') {
    return getCommitsByHour(commits);
  }
  
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