import { PullRequestInfo, PrAuthorStats, ReviewerStats, RepositoryPrStats, ReviewActivityTrend } from '../types';
import { format, parseISO, differenceInHours, differenceInDays, isSameDay, addDays, startOfDay } from 'date-fns';

/**
 * Group PRs by author and calculate statistics for each
 */
export function getPrAuthorStats(pullRequests: PullRequestInfo[]): PrAuthorStats[] {
  const authorMap = new Map<string, PrAuthorStats>();
  
  // Process each PR to build stats
  for (const pr of pullRequests) {
    const author = pr.Author;
    
    if (!authorMap.has(author)) {
      authorMap.set(author, {
        name: author,
        totalPRs: 0,
        approvalRate: 0,
        rejectionRate: 0,
        averageReviewers: 0,
        responseTimeAvg: 0,
        timeToMergeAvg: 0,
        repositoryContributions: {}
      });
    }
    
    const stats = authorMap.get(author)!;
    stats.totalPRs += 1;
    
    // Track repositories contributed to
    if (!stats.repositoryContributions[pr.RepositoryName]) {
      stats.repositoryContributions[pr.RepositoryName] = 0;
    }
    stats.repositoryContributions[pr.RepositoryName] += 1;
    
    // Calculate number of reviewers
    const reviewerCount = pr.Validators.length + pr.Rejecters.length;
    stats.averageReviewers = 
      (stats.averageReviewers * (stats.totalPRs - 1) + reviewerCount) / stats.totalPRs;
    
    // Check if PR has messages and calculate response time
    if (pr.Messages.length > 0) {
      const creationDate = parseISO(pr.Date);
      const firstResponse = parseISO(pr.Messages[0].Date);
      const responseTime = differenceInHours(firstResponse, creationDate);
      
      stats.responseTimeAvg = 
        (stats.responseTimeAvg * (stats.totalPRs - 1) + responseTime) / stats.totalPRs;
    }
    
    // Calculate if PR was approved
    const isApproved = pr.Validators.length > 0;
    const isRejected = pr.Rejecters.length > 0;
    
    // Update approval/rejection rates
    if (isApproved) {
      stats.approvalRate = 
        (stats.approvalRate * (stats.totalPRs - 1) + 100) / stats.totalPRs;
    } else {
      stats.approvalRate = 
        (stats.approvalRate * (stats.totalPRs - 1)) / stats.totalPRs;
    }
    
    if (isRejected) {
      stats.rejectionRate = 
        (stats.rejectionRate * (stats.totalPRs - 1) + 100) / stats.totalPRs;
    } else {
      stats.rejectionRate = 
        (stats.rejectionRate * (stats.totalPRs - 1)) / stats.totalPRs;
    }
  }
  
  return Array.from(authorMap.values());
}

/**
 * Get top authors by number of PRs
 */
export function getTopPrAuthors(pullRequests: PullRequestInfo[], limit = 5): PrAuthorStats[] {
  const stats = getPrAuthorStats(pullRequests);
  return stats
    .sort((a, b) => b.totalPRs - a.totalPRs)
    .slice(0, limit);
}

/**
 * Group PRs by reviewer (validator or rejecter) and calculate statistics
 */
export function getReviewerStats(pullRequests: PullRequestInfo[]): ReviewerStats[] {
  const reviewerMap = new Map<string, ReviewerStats>();
  
  // Process each PR
  for (const pr of pullRequests) {
    // Track all validators (approvers)
    for (const validator of pr.Validators) {
      if (!reviewerMap.has(validator)) {
        reviewerMap.set(validator, {
          name: validator,
          totalReviews: 0,
          approvalsGiven: 0,
          rejectionsGiven: 0,
          approvalRate: 0,
          responseTimeAvg: 0,
          reviewsByRepo: {}
        });
      }
      
      const stats = reviewerMap.get(validator)!;
      stats.totalReviews += 1;
      stats.approvalsGiven += 1;
      
      // Track reviews by repository
      if (!stats.reviewsByRepo[pr.RepositoryName]) {
        stats.reviewsByRepo[pr.RepositoryName] = 0;
      }
      stats.reviewsByRepo[pr.RepositoryName] += 1;
      
      stats.approvalRate = (stats.approvalsGiven / stats.totalReviews) * 100;
    }
    
    // Track all rejecters
    for (const rejecter of pr.Rejecters) {
      if (!reviewerMap.has(rejecter)) {
        reviewerMap.set(rejecter, {
          name: rejecter,
          totalReviews: 0,
          approvalsGiven: 0,
          rejectionsGiven: 0,
          approvalRate: 0,
          responseTimeAvg: 0,
          reviewsByRepo: {}
        });
      }
      
      const stats = reviewerMap.get(rejecter)!;
      stats.totalReviews += 1;
      stats.rejectionsGiven += 1;
      
      // Track reviews by repository
      if (!stats.reviewsByRepo[pr.RepositoryName]) {
        stats.reviewsByRepo[pr.RepositoryName] = 0;
      }
      stats.reviewsByRepo[pr.RepositoryName] += 1;
      
      stats.approvalRate = (stats.approvalsGiven / stats.totalReviews) * 100;
    }
    
    // Calculate response times for reviewers from messages
    for (const message of pr.Messages) {
      if (reviewerMap.has(message.Author)) {
        const stats = reviewerMap.get(message.Author)!;
        const prCreationDate = parseISO(pr.Date);
        const messageDate = parseISO(message.Date);
        const responseTime = differenceInHours(messageDate, prCreationDate);
        
        stats.responseTimeAvg = 
          (stats.responseTimeAvg * (stats.totalReviews - 1) + responseTime) / stats.totalReviews;
      }
    }
  }
  
  return Array.from(reviewerMap.values());
}

/**
 * Get top reviewers by number of reviews
 */
export function getTopReviewers(pullRequests: PullRequestInfo[], limit = 5): ReviewerStats[] {
  const stats = getReviewerStats(pullRequests);
  return stats
    .sort((a, b) => b.totalReviews - a.totalReviews)
    .slice(0, limit);
}

/**
 * Group PRs by repository and calculate statistics
 */
export function getRepositoryPrStats(pullRequests: PullRequestInfo[]): RepositoryPrStats[] {
  const repoMap = new Map<string, RepositoryPrStats>();
  
  // Track authors and reviewers by repo
  const authorsByRepo = new Map<string, Map<string, number>>();
  const reviewersByRepo = new Map<string, Map<string, number>>();
  
  // Process each PR
  for (const pr of pullRequests) {
    const repoName = pr.RepositoryName;
    
    if (!repoMap.has(repoName)) {
      repoMap.set(repoName, {
        name: repoName,
        totalPRs: 0,
        averageReviewers: 0,
        approvalRate: 0,
        averageComments: 0,
        timeToMergeAvg: 0,
        mostActiveAuthors: [],
        mostActiveReviewers: [],
        mergeTargets: {}
      });
      
      // Initialize author and reviewer tracking for this repo
      authorsByRepo.set(repoName, new Map<string, number>());
      reviewersByRepo.set(repoName, new Map<string, number>());
    }
    
    const stats = repoMap.get(repoName)!;
    stats.totalPRs += 1;
    
    // Track merge target branches
    if (!stats.mergeTargets[pr.DestinationBranchName]) {
      stats.mergeTargets[pr.DestinationBranchName] = 0;
    }
    stats.mergeTargets[pr.DestinationBranchName] += 1;
    
    // Track reviewer count
    const reviewerCount = pr.Validators.length + pr.Rejecters.length;
    stats.averageReviewers = 
      (stats.averageReviewers * (stats.totalPRs - 1) + reviewerCount) / stats.totalPRs;
    
    // Track comment count
    stats.averageComments = 
      (stats.averageComments * (stats.totalPRs - 1) + pr.Messages.length) / stats.totalPRs;
    
    // Track approval status
    const isApproved = pr.Validators.length > 0;
    if (isApproved) {
      stats.approvalRate = (stats.approvalRate * (stats.totalPRs - 1) + 100) / stats.totalPRs;
    } else {
      stats.approvalRate = (stats.approvalRate * (stats.totalPRs - 1)) / stats.totalPRs;
    }
    
    // Track authors for this repo
    const authorsMap = authorsByRepo.get(repoName)!;
    const author = pr.Author;
    authorsMap.set(author, (authorsMap.get(author) || 0) + 1);
    
    // Track reviewers for this repo
    const reviewersMap = reviewersByRepo.get(repoName)!;
    
    // Add all validators to reviewers map
    for (const validator of pr.Validators) {
      reviewersMap.set(validator, (reviewersMap.get(validator) || 0) + 1);
    }
    
    // Add all rejecters to reviewers map
    for (const rejecter of pr.Rejecters) {
      reviewersMap.set(rejecter, (reviewersMap.get(rejecter) || 0) + 1);
    }
  }
  
  // Calculate most active authors and reviewers for each repo
  for (const repoName of repoMap.keys()) {
    const stats = repoMap.get(repoName)!;
    const authorsMap = authorsByRepo.get(repoName)!;
    const reviewersMap = reviewersByRepo.get(repoName)!;
    
    // Get most active authors
    stats.mostActiveAuthors = Array.from(authorsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
    
    // Get most active reviewers
    stats.mostActiveReviewers = Array.from(reviewersMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }
  
  return Array.from(repoMap.values());
}

/**
 * Get PR activity trend over time
 */
export function getPrActivityTrend(pullRequests: PullRequestInfo[]): ReviewActivityTrend {
  if (pullRequests.length === 0) {
    return { dates: [], prCreated: [], prApproved: [], prRejected: [] };
  }
  
  // Sort PRs by date
  const sortedPRs = [...pullRequests].sort((a, b) => 
    parseISO(a.Date).getTime() - parseISO(b.Date).getTime()
  );
  
  // Find date range
  const startDate = parseISO(sortedPRs[0].Date);
  const endDate = parseISO(sortedPRs[sortedPRs.length - 1].Date);
  
  // Create array of dates from start to end
  const dates: string[] = [];
  const prCreated: number[] = [];
  const prApproved: number[] = [];
  const prRejected: number[] = [];
  
  let currentDate = startOfDay(startDate);
  const lastDate = startOfDay(endDate);
  
  while (currentDate <= lastDate) {
    dates.push(format(currentDate, 'yyyy-MM-dd'));
    
    // Count PRs created on this date
    const createdCount = pullRequests.filter(pr => 
      isSameDay(parseISO(pr.Date), currentDate)
    ).length;
    prCreated.push(createdCount);
    
    // Count PRs approved on this date
    const approvedCount = pullRequests.filter(pr => 
      pr.Validators.length > 0 && pr.Messages.some(msg => 
        isSameDay(parseISO(msg.Date), currentDate)
      )
    ).length;
    prApproved.push(approvedCount);
    
    // Count PRs rejected on this date
    const rejectedCount = pullRequests.filter(pr => 
      pr.Rejecters.length > 0 && pr.Messages.some(msg => 
        isSameDay(parseISO(msg.Date), currentDate)
      )
    ).length;
    prRejected.push(rejectedCount);
    
    // Move to next day
    currentDate = addDays(currentDate, 1);
  }
  
  return { dates, prCreated, prApproved, prRejected };
}

/**
 * Calculate average time to merge (from PR creation to validation)
 */
export function getAverageTimeToMerge(pullRequests: PullRequestInfo[]): number {
  const approvedPRs = pullRequests.filter(pr => pr.Validators.length > 0);
  if (approvedPRs.length === 0) return 0;
  
  let totalTimeInHours = 0;
  
  for (const pr of approvedPRs) {
    // For simplicity, assume validation is indicated by the last message
    if (pr.Messages.length > 0) {
      const creationDate = parseISO(pr.Date);
      const lastMessage = pr.Messages[pr.Messages.length - 1];
      const validationDate = parseISO(lastMessage.Date);
      
      totalTimeInHours += differenceInHours(validationDate, creationDate);
    }
  }
  
  return totalTimeInHours / approvedPRs.length;
}

/**
 * Get PR distribution by branch (source or destination)
 */
export function getPrsByBranch(pullRequests: PullRequestInfo[], branchType: 'source' | 'destination'): Record<string, number> {
  const result: Record<string, number> = {};
  
  for (const pr of pullRequests) {
    const branchName = branchType === 'source' 
      ? pr.IncomingBranchName 
      : pr.DestinationBranchName;
    
    if (!result[branchName]) {
      result[branchName] = 0;
    }
    
    result[branchName] += 1;
  }
  
  return result;
}

/**
 * Calculate team collaboration score (0-100)
 * Based on:
 * - Average number of reviewers per PR
 * - Distribution of reviews across team members
 * - Response time
 * - Approval/rejection ratio
 */
export function getTeamCollaborationScore(pullRequests: PullRequestInfo[]): number {
  if (pullRequests.length === 0) return 0;
  
  // Calculate average reviewers per PR (25 points max)
  const avgReviewers = pullRequests.reduce((sum, pr) => 
    sum + pr.Validators.length + pr.Rejecters.length, 0) / pullRequests.length;
  const reviewerScore = Math.min(avgReviewers / 3 * 25, 25);
  
  // Calculate reviewer diversity (25 points max)
  const allReviewers = new Set<string>();
  pullRequests.forEach(pr => {
    pr.Validators.forEach(v => allReviewers.add(v));
    pr.Rejecters.forEach(r => allReviewers.add(r));
  });
  
  const uniqueAuthors = new Set(pullRequests.map(pr => pr.Author));
  const reviewerDiversity = allReviewers.size / Math.max(uniqueAuthors.size, 1);
  const diversityScore = Math.min(reviewerDiversity * 25, 25);
  
  // Calculate response time score (25 points max)
  // Lower is better, aim for <24 hours
  let avgResponseHours = 0;
  let prsWithResponses = 0;
  
  for (const pr of pullRequests) {
    if (pr.Messages.length > 0) {
      const creationDate = parseISO(pr.Date);
      const firstResponseDate = parseISO(pr.Messages[0].Date);
      avgResponseHours += differenceInHours(firstResponseDate, creationDate);
      prsWithResponses++;
    }
  }
  
  if (prsWithResponses > 0) {
    avgResponseHours /= prsWithResponses;
  }
  
  // Score: 25 points for response < 24 hours, scaling down to 0 points for >72 hours
  const responseScore = Math.max(0, Math.min(25, 25 * (1 - (avgResponseHours - 24) / 48)));
  
  // Calculate approval ratio score (25 points max)
  const approvedPRs = pullRequests.filter(pr => pr.Validators.length > 0).length;
  const approvalRatio = approvedPRs / pullRequests.length;
  const approvalScore = approvalRatio * 25;
  
  // Calculate final score
  return Math.round(reviewerScore + diversityScore + responseScore + approvalScore);
}

/**
 * Calculate team velocity score (0-100)
 * Based on:
 * - PR throughput
 * - Time to merge
 * - PR size (comments as proxy)
 */
export function getTeamVelocityScore(pullRequests: PullRequestInfo[]): number {
  if (pullRequests.length === 0) return 0;
  
  // Sort PRs by date
  const sortedPRs = [...pullRequests].sort((a, b) => 
    parseISO(a.Date).getTime() - parseISO(b.Date).getTime()
  );
  
  // Calculate date range in days
  const startDate = parseISO(sortedPRs[0].Date);
  const endDate = parseISO(sortedPRs[sortedPRs.length - 1].Date);
  const dayRange = Math.max(1, differenceInDays(endDate, startDate));
  
  // Calculate PRs per day (40 points max)
  const prsPerDay = pullRequests.length / dayRange;
  const throughputScore = Math.min(prsPerDay * 20, 40);
  
  // Calculate average time to merge (40 points max)
  // Lower is better, aim for <48 hours
  const avgTimeToMerge = getAverageTimeToMerge(pullRequests);
  // Score: 40 points for merge time < 48 hours, scaling down to 0 points for >120 hours
  const mergeTimeScore = Math.max(0, Math.min(40, 40 * (1 - (avgTimeToMerge - 48) / 72)));
  
  // Calculate average PR size score (20 points max)
  // Using number of comments as proxy for PR complexity
  const avgComments = pullRequests.reduce((sum, pr) => sum + pr.Messages.length, 0) / pullRequests.length;
  // Score: 20 points for 1-5 comments, scaling down for more
  const sizeScore = Math.max(0, 20 - Math.max(0, avgComments - 5));
  
  // Calculate final score
  return Math.round(throughputScore + mergeTimeScore + sizeScore);
}