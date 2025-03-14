import { CommitInfo, CommitterStats, BurnoutRiskLevel } from '../types';
import { format, parseISO, getHours, getDay, getMonth, getDate, isWeekend } from 'date-fns';
import { analyzeSentiment } from './sentimentAnalyzer';

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

// Define weekend warrior thresholds (percentage of commits on weekends)
const WEEKEND_WARRIOR_THRESHOLDS = {
  CASUAL: 10,      // 0-10%: Casual weekend worker
  MODERATE: 25,    // 11-25%: Moderate weekend worker
  DEDICATED: 40,   // 26-40%: Dedicated weekend worker
  // Above 40%: Weekend warrior
};

export function parseCommitData(commits: CommitInfo[]): CommitInfo[] {
  return commits.map(commit => {
    // Add sentiment score to each commit
    const sentimentScore = analyzeSentiment(commit.CommitMessage);
    
    return {
      ...commit,
      CommitTime: commit.CommitTime || new Date().toISOString(),
      SentimentScore: sentimentScore
    };
  });
}

export function getCommitterStats(commits: CommitInfo[]): CommitterStats[] {
  const committerMap = new Map<string, any>();
  
  // Track per-committer sentiment
  const sentimentMap = new Map<string, number[]>();

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
      weekdayCommits: 0,
      burnoutRiskScore: 0,
      commitsByHour: Array(24).fill(0), // Initialize 24 hours with zeros
      
      // New sentiment and weekend stats
      averageSentiment: 0,
      positivePct: 0,
      negativePct: 0,
      weekendCommitPct: 0
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
    
    // Update weekend vs weekday metrics
    if (isWeekendDay) {
      existingStats.weekendCommits += 1;
    } else {
      existingStats.weekdayCommits += 1;
    }
    
    // Track sentiment scores for this committer
    if (!sentimentMap.has(key)) {
      sentimentMap.set(key, []);
    }
    if (commit.SentimentScore !== undefined) {
      sentimentMap.get(key)?.push(commit.SentimentScore);
    }

    committerMap.set(key, existingStats);
  });

  // Calculate derived statistics
  const committerStats = Array.from(committerMap.values());
  committerStats.forEach(stats => {
    // Calculate burnout risk percentages
    const afterHoursPercent = (stats.afterHoursCommits / stats.totalCommits) * 100;
    const earlyMorningPercent = (stats.earlyMorningCommits / stats.totalCommits) * 100;
    const weekendPercent = (stats.weekendCommits / stats.totalCommits) * 100;
    
    // Weekend warrior percentage
    stats.weekendCommitPct = Math.round(weekendPercent);
    
    // Weighted burnout risk score (scale of 0-100)
    // Early morning commits are weighted more heavily as they indicate extreme hours
    stats.burnoutRiskScore = Math.min(100, Math.round(
      (afterHoursPercent * 0.4) + 
      (earlyMorningPercent * 0.4) + 
      (weekendPercent * 0.2)
    ));
    
    // Calculate sentiment stats
    const sentimentScores = sentimentMap.get(stats.email) || [];
    if (sentimentScores.length > 0) {
      // Average sentiment
      stats.averageSentiment = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
      
      // Percentage of positive and negative commits
      const positiveCommits = sentimentScores.filter(score => score > 0.1).length;
      const negativeCommits = sentimentScores.filter(score => score < -0.1).length;
      
      stats.positivePct = Math.round((positiveCommits / sentimentScores.length) * 100);
      stats.negativePct = Math.round((negativeCommits / sentimentScores.length) * 100);
    } else {
      stats.averageSentiment = 0;
      stats.positivePct = 0;
      stats.negativePct = 0;
    }
  });

  return committerStats;
}

export function getWeekendWarriorLevel(weekendPct: number): {level: string; color: string; description: string} {
  if (weekendPct <= WEEKEND_WARRIOR_THRESHOLDS.CASUAL) {
    return {
      level: 'casual',
      color: 'rgb(148, 163, 184)', // slate-400
      description: 'Rarely works on weekends'
    };
  } else if (weekendPct <= WEEKEND_WARRIOR_THRESHOLDS.MODERATE) {
    return {
      level: 'moderate',
      color: 'rgb(110, 231, 183)', // green-300
      description: 'Occasionally works on weekends'
    };
  } else if (weekendPct <= WEEKEND_WARRIOR_THRESHOLDS.DEDICATED) {
    return {
      level: 'dedicated',
      color: 'rgb(253, 224, 71)', // yellow-300
      description: 'Frequently works on weekends'
    };
  } else {
    return {
      level: 'warrior',
      color: 'rgb(249, 115, 22)', // orange-500
      description: 'True weekend warrior'
    };
  }
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

// Get average sentiment score for each day in the range
export function getSentimentTrend(commits: CommitInfo[]): { date: string; score: number }[] {
  if (!commits.length) return [];
  
  // Group commits by day
  const commitsByDay = new Map<string, number[]>();
  
  commits.forEach(commit => {
    if (commit.SentimentScore === undefined) return;
    
    const date = new Date(commit.CommitTime);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (!commitsByDay.has(dateStr)) {
      commitsByDay.set(dateStr, []);
    }
    
    commitsByDay.get(dateStr)?.push(commit.SentimentScore);
  });
  
  // Calculate average sentiment for each day
  const result: { date: string; score: number }[] = [];
  
  for (const [date, scores] of commitsByDay.entries()) {
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    result.push({ date, score: avgScore });
  }
  
  // Sort by date
  return result.sort((a, b) => a.date.localeCompare(b.date));
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