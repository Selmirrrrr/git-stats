import { useState } from 'react';
import { CommitterStats } from '../types';
import { getTopCommitters } from '../utils/commitAnalyzer';
import { BarChart } from './BarChart';
import { LeaderboardModal } from './LeaderboardModal';

interface AvgChangesLeaderboardCardProps {
  committerStats: CommitterStats[];
  title: string;
  sortDirection: 'asc' | 'desc';
  limit?: number;
  chartColor?: string;
}

export const AvgChangesLeaderboardCard = ({ 
  committerStats, 
  title, 
  sortDirection,
  limit = 3,
  chartColor = 'rgba(75, 192, 192, 0.6)'
}: AvgChangesLeaderboardCardProps) => {
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  
  // Filter out committers with no commits
  const validCommitters = committerStats.filter(c => c.totalCommits > 0);
  
  // Get top/bottom committers by average changes per commit
  const sortedCommitters = getTopCommitters(validCommitters, 'avgChangesPerCommit', limit, sortDirection);
  
  // Create labels that include both name and email
  const chartLabels = sortedCommitters.map(c => {
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
              label: 'Avg Changes/Commit',
              data: sortedCommitters.map(c => c.avgChangesPerCommit),
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
                <th className="pb-2 text-right">Avg Changes/Commit</th>
                <th className="pb-2 text-right">Total Commits</th>
              </tr>
            </thead>
            <tbody>
              {sortedCommitters.map((committer, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-1">{committer.name}</td>
                  <td className="py-1 text-gray-600 dark:text-gray-400">{committer.email}</td>
                  <td className="py-1 text-right">{committer.avgChangesPerCommit}</td>
                  <td className="py-1 text-right">{committer.totalCommits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={closeLeaderboard}
        committerStats={validCommitters}
        sortBy="avgChangesPerCommit"
        title={title}
      />
    </>
  );
};