import { useState } from 'react';
import { CommitterStats } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  committerStats: CommitterStats[];
  sortBy: keyof CommitterStats;
  title: string;
}

export const LeaderboardModal = ({
  isOpen,
  onClose,
  committerStats,
  sortBy,
  title
}: LeaderboardModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  if (!isOpen) return null;
  
  // Sort committers by the selected stat
  const sortedCommitters = [...committerStats].sort((a, b) => 
    (b[sortBy] as number) - (a[sortBy] as number)
  );
  
  // Filter by search term if any
  const filteredCommitters = searchTerm.trim() 
    ? sortedCommitters.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : sortedCommitters;
  
  // Get the human-readable label for the sort criteria
  const statLabel = getSortByLabel(sortBy);
  
  // Calculate total for the selected stat across all committers
  const totalValue = committerStats.reduce((sum, c) => sum + (c[sortBy] as number), 0);
  
  // Calculate some basic statistics
  const totalCommitters = committerStats.length;
  const activeCommitters = committerStats.filter(c => (c[sortBy] as number) > 0).length;
  const topContributor = sortedCommitters.length > 0 ? sortedCommitters[0] : null;
  const topContribution = topContributor ? (topContributor[sortBy] as number) : 0;
  const topPercentage = totalValue > 0 && topContributor 
    ? ((topContribution / totalValue) * 100).toFixed(1) 
    : '0';
    
  // Calculate some distribution metrics
  let top20Percent = 0;
  const contributorsCount = Math.ceil(committerStats.length * 0.2); // Top 20% of contributors
  for (let i = 0; i < Math.min(contributorsCount, sortedCommitters.length); i++) {
    top20Percent += sortedCommitters[i][sortBy] as number;
  }
  const top20PercentageOfTotal = totalValue > 0 
    ? ((top20Percent / totalValue) * 100).toFixed(1) 
    : '0';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">{title} - Full Leaderboard</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total {statLabel}</div>
            <div className="text-xl font-bold">{totalValue.toLocaleString()}</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-500 dark:text-gray-400">Contributors</div>
            <div className="text-xl font-bold">{activeCommitters} active / {totalCommitters} total</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-500 dark:text-gray-400">Top 20% Contribution</div>
            <div className="text-xl font-bold">{top20PercentageOfTotal}% of total</div>
          </div>
        </div>
        
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="overflow-y-auto flex-grow">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {statLabel}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCommitters.map((committer, index) => {
                const value = committer[sortBy] as number;
                const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0';
                
                return (
                  <tr key={committer.email} 
                      className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/30' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {committer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {committer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                      {value.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                      {percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredCommitters.length} of {committerStats.length} contributors shown
          </span>
          <button 
            onClick={onClose}
            className="btn btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
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