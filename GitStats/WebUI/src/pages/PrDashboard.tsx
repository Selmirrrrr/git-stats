import { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { TeamScoreCard } from '../components/TeamScoreCard';
import { PrActivityChart } from '../components/PrActivityChart';
import { TopAuthorsCard } from '../components/TopAuthorsCard';
import { TopReviewersCard } from '../components/TopReviewersCard';
import { TopCommentersCard } from '../components/TopCommentersCard';
import { BranchDistributionCard } from '../components/BranchDistributionCard';
import { usePullRequestData } from '../hooks/usePullRequestData';

export const PrDashboard = () => {
  const [jsonPath, setJsonPath] = useState<string | undefined>();
  const { 
    pullRequests, 
    topAuthors,
    topReviewers,
    topCommenters,
    topCommentsByLength,
    activityTrend,
    teamCollaborationScore,
    teamVelocityScore,
    targetBranchDistribution,
    sourceBranchDistribution,
    loading, 
    error 
  } = usePullRequestData(jsonPath);

  const handleFileLoad = (path: string) => {
    setJsonPath(path);
  };

  const loadSampleData = () => {
    // Use relative path that works with GitHub Pages and local development
    const basePath = '/git-stats/';
    const sampleDataPath = basePath + 'sample-bitbucket-prs.json';
    setJsonPath(sampleDataPath);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Pull Request Analysis Dashboard</h1>
      
      <FileUploader onFileLoad={handleFileLoad} />
      
      {!jsonPath && !loading && (
        <div className="text-center py-6">
          <p className="mb-4 text-gray-500">Upload a Bitbucket PR JSON file to view visualizations</p>
          <button 
            onClick={loadSampleData}
            className="btn btn-secondary"
          >
            Or Load Sample PR Data
          </button>
        </div>
      )}
      
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2">Loading pull request data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {!loading && !error && pullRequests.length > 0 && (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Pull Request Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card text-center">
                <div className="text-4xl font-bold">{pullRequests.length}</div>
                <div className="text-gray-500">Total Pull Requests</div>
              </div>
              <div className="card text-center">
                <div className="text-4xl font-bold">
                  {topAuthors.length}
                </div>
                <div className="text-gray-500">Active Contributors</div>
              </div>
              <div className="card text-center">
                <div className="text-4xl font-bold">
                  {topReviewers.length}
                </div>
                <div className="text-gray-500">Active Reviewers</div>
              </div>
              <div className="card text-center">
                <div className="text-4xl font-bold">
                  {pullRequests.reduce((sum, pr) => sum + (pr.Validators.length > 0 ? 1 : 0), 0)}
                </div>
                <div className="text-gray-500">Approved PRs</div>
              </div>
            </div>
          </div>
          
          {/* Team Performance Metrics */}
          <div className="mb-6">
            <TeamScoreCard 
              collaborationScore={teamCollaborationScore}
              velocityScore={teamVelocityScore}
            />
          </div>
          
          {/* Activity Trend */}
          <div className="mb-6">
            <PrActivityChart activityData={activityTrend} height={350} />
          </div>
          
          {/* Branch Distribution */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Branch Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BranchDistributionCard 
                distributionData={targetBranchDistribution}
                title="Target Branch Distribution"
                description="Shows which branches are most frequently targeted for merges. This indicates the main integration points in your workflow."
                height={350}
              />
              <BranchDistributionCard 
                distributionData={sourceBranchDistribution}
                title="Source Branch Distribution"
                description="Shows which branches are most frequently used for development. This reveals branch naming patterns and feature development strategies."
                height={350}
              />
            </div>
          </div>
          
          {/* Author Analysis */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Contributor Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <TopAuthorsCard
                authors={topAuthors}
                title="Top PR Contributors"
                metric="totalPRs"
                metricLabel="Total PRs"
                chartColor="rgba(54, 162, 235, 0.6)"
              />
              
              <TopAuthorsCard
                authors={topAuthors}
                title="Contributors by Approval Rate"
                metric="approvalRate"
                metricLabel="Approval Rate %"
                chartColor="rgba(75, 192, 192, 0.6)"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TopAuthorsCard
                authors={topAuthors}
                title="Response Time Analysis"
                metric="responseTimeAvg"
                metricLabel="Avg. Response Time (hours)"
                chartColor="rgba(255, 206, 86, 0.6)"
              />
              
              <TopAuthorsCard
                authors={topAuthors.filter(a => a.timeToMergeAvg > 0)}
                title="Time to Merge Analysis"
                metric="timeToMergeAvg"
                metricLabel="Avg. Time to Merge (hours)"
                chartColor="rgba(153, 102, 255, 0.6)"
              />
            </div>
          </div>
          
          {/* Reviewer Analysis */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Reviewer Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <TopReviewersCard
                reviewers={topReviewers}
                title="Top Reviewers"
                metric="totalReviews"
                metricLabel="Total Reviews"
                chartColor="rgba(255, 99, 132, 0.6)"
              />
              
              <TopReviewersCard
                reviewers={topReviewers}
                title="Approvals Given"
                metric="approvalsGiven"
                metricLabel="Approvals"
                chartColor="rgba(75, 192, 192, 0.6)"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TopReviewersCard
                reviewers={topReviewers}
                title="Reviewers by Approval Rate"
                metric="approvalRate"
                metricLabel="Approval Rate %"
                chartColor="rgba(54, 162, 235, 0.6)"
              />
              
              <TopReviewersCard
                reviewers={topReviewers.filter(r => r.responseTimeAvg > 0)}
                title="Review Response Time"
                metric="responseTimeAvg"
                metricLabel="Avg. Response Time (hours)"
                chartColor="rgba(255, 159, 64, 0.6)"
              />
            </div>
          </div>
          
          {/* Commenter Analysis */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Comment Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TopCommentersCard
                commenters={topCommenters}
                title="Top Commenters"
                metric="totalComments"
                metricLabel="Total Comments"
                chartColor="rgba(153, 102, 255, 0.6)"
              />
              
              <TopCommentersCard
                commenters={topCommentsByLength}
                title="Top Commenters by Content Length"
                metric="totalCommentLength"
                metricLabel="Total Characters"
                chartColor="rgba(255, 205, 86, 0.6)"
              />
            </div>
          </div>
        </>
      )}

      {!loading && !error && pullRequests.length === 0 && jsonPath && (
        <div className="text-center py-8">
          <p>No pull request data found in the provided file.</p>
        </div>
      )}
    </div>
  );
};