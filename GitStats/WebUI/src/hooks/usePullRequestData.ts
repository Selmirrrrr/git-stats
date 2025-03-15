import { useState, useEffect } from 'react';
import { 
  PullRequestInfo, 
  PrAuthorStats, 
  ReviewerStats, 
  CommenterStats,
  RepositoryPrStats,
  ReviewActivityTrend 
} from '../utils/pullRequestAnalyzer';
import { 
  getPrAuthorStats, 
  getTopPrAuthors, 
  getReviewerStats, 
  getTopReviewers,
  getCommenterStats,
  getTopCommenters, 
  getRepositoryPrStats,
  getPrActivityTrend,
  getTeamCollaborationScore,
  getTeamVelocityScore,
  getPrsByBranch
} from '../utils/pullRequestAnalyzer';

interface PullRequestDataHook {
  pullRequests: PullRequestInfo[];
  authorStats: PrAuthorStats[];
  topAuthors: PrAuthorStats[];
  reviewerStats: ReviewerStats[];
  topReviewers: ReviewerStats[];
  commenterStats: CommenterStats[];
  topCommenters: CommenterStats[];
  topCommentsByLength: CommenterStats[];
  repositoryStats: RepositoryPrStats[];
  activityTrend: ReviewActivityTrend;
  teamCollaborationScore: number;
  teamVelocityScore: number;
  targetBranchDistribution: Record<string, number>;
  sourceBranchDistribution: Record<string, number>;
  loading: boolean;
  error: string | null;
}

export function usePullRequestData(jsonPath?: string): PullRequestDataHook {
  const [pullRequests, setPullRequests] = useState<PullRequestInfo[]>([]);
  const [authorStats, setAuthorStats] = useState<PrAuthorStats[]>([]);
  const [topAuthors, setTopAuthors] = useState<PrAuthorStats[]>([]);
  const [reviewerStats, setReviewerStats] = useState<ReviewerStats[]>([]);
  const [topReviewers, setTopReviewers] = useState<ReviewerStats[]>([]);
  const [commenterStats, setCommenterStats] = useState<CommenterStats[]>([]);
  const [topCommenters, setTopCommenters] = useState<CommenterStats[]>([]);
  const [topCommentsByLength, setTopCommentsByLength] = useState<CommenterStats[]>([]);
  const [repositoryStats, setRepositoryStats] = useState<RepositoryPrStats[]>([]);
  const [activityTrend, setActivityTrend] = useState<ReviewActivityTrend>({ dates: [], prCreated: [], prApproved: [], prRejected: [] });
  const [teamCollaborationScore, setTeamCollaborationScore] = useState<number>(0);
  const [teamVelocityScore, setTeamVelocityScore] = useState<number>(0);
  const [targetBranchDistribution, setTargetBranchDistribution] = useState<Record<string, number>>({});
  const [sourceBranchDistribution, setSourceBranchDistribution] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jsonPath) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(jsonPath);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle the case when the JSON is not an array
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format. Expected an array of PRs.');
        }
        
        // Store the raw PR data
        setPullRequests(data);
        
        // Calculate derived statistics
        const authorStatsData = getPrAuthorStats(data);
        setAuthorStats(authorStatsData);
        
        // Get all authors sorted by total PRs (no limit)
        setTopAuthors(getTopPrAuthors(data, Number.MAX_SAFE_INTEGER, 'totalPRs', false));
        
        const reviewerStatsData = getReviewerStats(data);
        setReviewerStats(reviewerStatsData);
        
        // Get all reviewers sorted by total reviews (no limit)
        setTopReviewers(getTopReviewers(data, Number.MAX_SAFE_INTEGER, 'totalReviews', false));
        
        // Calculate commenter statistics
        const commenterStatsData = getCommenterStats(data);
        setCommenterStats(commenterStatsData);
        
        // Get all commenters by total number of comments (no limit)
        setTopCommenters(getTopCommenters(data, Number.MAX_SAFE_INTEGER, 'totalComments', false));
        
        // Get all commenters by total length of comments (no limit)
        setTopCommentsByLength(getTopCommenters(data, Number.MAX_SAFE_INTEGER, 'totalCommentLength', false));
        
        setRepositoryStats(getRepositoryPrStats(data));
        
        setActivityTrend(getPrActivityTrend(data));
        
        setTeamCollaborationScore(getTeamCollaborationScore(data));
        
        setTeamVelocityScore(getTeamVelocityScore(data));
        
        setTargetBranchDistribution(getPrsByBranch(data, 'destination'));
        
        setSourceBranchDistribution(getPrsByBranch(data, 'source'));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching or processing PR data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load PR data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [jsonPath]);
  
  return {
    pullRequests,
    authorStats,
    topAuthors,
    reviewerStats,
    topReviewers,
    commenterStats,
    topCommenters,
    topCommentsByLength,
    repositoryStats,
    activityTrend,
    teamCollaborationScore,
    teamVelocityScore,
    targetBranchDistribution,
    sourceBranchDistribution,
    loading,
    error
  };
}