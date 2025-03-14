import { useState } from 'react';
import { CommitterStats } from '../types';
import { getTopCommitters } from '../utils/commitAnalyzer';
import { BarChart } from './BarChart';
import { LeaderboardModal } from './LeaderboardModal';

interface TopCommittersCardProps {
  committerStats: CommitterStats[];
  sortBy: keyof CommitterStats;
  title: string;
  limit?: number;
  chartColor?: string;
}

export const TopCommittersCard = ({ 
  committerStats, 
  sortBy, 
  title, 
  limit = 3,
  chartColor = 'rgba(75, 192, 192, 0.6)'
}: TopCommittersCardProps) => {
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  
  const topCommitters = getTopCommitters(committerStats, sortBy, limit);
  
  // Create labels that include both name and email
  const chartLabels = topCommitters.map(c => {
    // Extract username part from email (before the @ symbol)
    const username = c.email.split('@')[0];
    return username;
  });

  const openLeaderboard = () => {
    setIsLeaderboardOpen(true);
  };

  const closeLeaderboard = () => {
    setIsLeaderboardOpen(false);
  };
  
  return (
    <>
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button 
            onClick={openLeaderboard}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View Full Leaderboard
          </button>
        </div>
        
        <BarChart
          title=""
          labels={chartLabels}
          datasets={[
            {
              label: getSortByLabel(sortBy),
              data: topCommitters.map(c => c[sortBy] as number),
              backgroundColor: chartColor
            }
          ]}
        />

        {/* Display full details table below the chart */}
        <div className="mt-4 max-h-32 overflow-y-auto text-sm">
          <table className="w-full">
            <thead className="text-left border-b">
              <tr>
                <th className="pb-2">Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2 text-right">{getSortByLabel(sortBy)}</th>
              </tr>
            </thead>
            <tbody>
              {topCommitters.map((committer, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-1">{committer.name}</td>
                  <td className="py-1 text-gray-600 dark:text-gray-400">{committer.email}</td>
                  <td className="py-1 text-right">{committer[sortBy] as number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={closeLeaderboard}
        committerStats={committerStats}
        sortBy={sortBy}
        title={title}
      />
    </>
  );
};

// Helper function to get a human-readable label for the sort criteria
function getSortByLabel(sortBy: keyof CommitterStats): string {
  switch (sortBy) {
    case 'totalCommits':
      return 'Commits';
    case 'totalAdditions':
      return 'Additions';
    case 'totalDeletions':
      return 'Deletions';
    case 'totalChanges':
      return 'Changes';
    case 'earlyMorningCommits':
      return 'Early Commits';
    default:
      return String(sortBy);
  }
}