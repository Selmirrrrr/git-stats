import { useState } from 'react';
import { TopCommittersCard } from '../components/TopCommittersCard';
import { TimeframeChart } from '../components/TimeframeChart';
import { CommitSearch } from '../components/CommitSearch';
import { FileUploader } from '../components/FileUploader';
import { BurnoutRiskCard } from '../components/BurnoutRiskCard';
import { CommitHourHeatmap } from '../components/CommitHourHeatmap';
import { WeekendWarriorsCard } from '../components/WeekendWarriorsCard';
import { CommitSentimentCard } from '../components/CommitSentimentCard';
import { useCommitData } from '../hooks/useCommitData';

export const Dashboard = () => {
  const [jsonPath, setJsonPath] = useState<string | undefined>();
  const { commits, committerStats, loading, error } = useCommitData(jsonPath);

  const handleFileLoad = (path: string) => {
    setJsonPath(path);
  };

  const loadSampleData = () => {
    // Use relative path that works with GitHub Pages and local development
    const sampleDataPath = import.meta.env.BASE_URL + 'sample-data.json';
    setJsonPath(sampleDataPath);
  };

  // Calculate totals
  const totalAdditions = commits.reduce((sum, commit) => sum + commit.Additions, 0);
  const totalDeletions = commits.reduce((sum, commit) => sum + commit.Deletions, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Git Stats Dashboard</h1>
      
      <FileUploader onFileLoad={handleFileLoad} />
      
      {!jsonPath && !loading && (
        <div className="text-center py-6">
          <p className="mb-4 text-gray-500">Upload a GitStats JSON file to view visualizations</p>
          <button 
            onClick={loadSampleData}
            className="btn btn-secondary"
          >
            Or Load Sample Data
          </button>
        </div>
      )}
      
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2">Loading commit data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {!loading && !error && commits.length > 0 && (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Repository Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card text-center">
                <div className="text-4xl font-bold">{commits.length}</div>
                <div className="text-gray-500">Total Commits</div>
              </div>
              <div className="card text-center">
                <div className="text-4xl font-bold">
                  {totalAdditions}
                </div>
                <div className="text-gray-500">Total Additions</div>
              </div>
              <div className="card text-center">
                <div className="text-4xl font-bold">
                  {totalDeletions}
                </div>
                <div className="text-gray-500">Total Deletions</div>
              </div>
              <div className="card text-center">
                <div className="text-4xl font-bold">{committerStats.length}</div>
                <div className="text-gray-500">Contributors</div>
              </div>
            </div>
          </div>

          {/* Search card on its own line */}
          <div className="mb-6">
            <CommitSearch commits={commits} />
          </div>
          
          {/* Sentiment analysis section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Commit Message Sentiment</h2>
            <div className="grid grid-cols-1 gap-6">
              <CommitSentimentCard 
                commits={commits}
                committerStats={committerStats}
              />
            </div>
          </div>
          
          {/* Burnout risk metrics section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Work Pattern Analysis</h2>
            <div className="grid grid-cols-1 gap-6 mb-6">
              <CommitHourHeatmap commits={commits} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BurnoutRiskCard committerStats={committerStats} />
              <WeekendWarriorsCard committerStats={committerStats} />
            </div>
          </div>
          
          {/* Top committers section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Top Contributors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <TopCommittersCard
                committerStats={committerStats}
                sortBy="totalCommits"
                title="Top Committers (by Commits)"
                chartColor="rgba(54, 162, 235, 0.6)"
              />
              
              <TopCommittersCard
                committerStats={committerStats}
                sortBy="totalChanges"
                title="Top Committers (by Total Changes)"
                chartColor="rgba(255, 99, 132, 0.6)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TopCommittersCard
                committerStats={committerStats}
                sortBy="totalAdditions"
                title="Top Committers (by Additions)"
                chartColor="rgba(75, 192, 192, 0.6)"
              />
              
              <TopCommittersCard
                committerStats={committerStats}
                sortBy="totalDeletions"
                title="Top Committers (by Deletions)"
                chartColor="rgba(255, 159, 64, 0.6)"
              />
            </div>
          </div>

          {/* Time-based analysis section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Time-based Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Commits by Day of Week</h3>
                <TimeframeChart
                  commits={commits}
                  timeframeType="weekday"
                  title=""
                  chartColor="rgba(54, 162, 235, 0.6)"
                />
              </div>
              
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Commits by Month</h3>
                <TimeframeChart
                  commits={commits}
                  timeframeType="month"
                  title=""
                  chartColor="rgba(255, 99, 132, 0.6)"
                />
              </div>
            </div>

            {/* Day of month chart on its own line */}
            <div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Commits by Day of Month</h3>
                <TimeframeChart
                  commits={commits}
                  timeframeType="dayOfMonth"
                  title=""
                  chartColor="rgba(255, 205, 86, 0.6)"
                  height={400}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && !error && commits.length === 0 && jsonPath && (
        <div className="text-center py-8">
          <p>No commit data found in the provided file.</p>
        </div>
      )}
    </div>
  );
};