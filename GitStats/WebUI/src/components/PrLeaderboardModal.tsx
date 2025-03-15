import { useState } from 'react';
import { PrAuthorStats, ReviewerStats, CommenterStats } from '../utils/pullRequestAnalyzer';

interface PrLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PrAuthorStats[] | ReviewerStats[] | CommenterStats[];
  sortBy: string;
  title: string;
  dataType: 'author' | 'reviewer' | 'commenter';
}

export const PrLeaderboardModal = ({
  isOpen,
  onClose,
  data,
  sortBy,
  title,
  dataType
}: PrLeaderboardModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  if (!isOpen) return null;
  
  // Sort data by the selected stat
  const sortedData = [...data].sort((a, b) => {
    if (typeof a[sortBy] === 'number' && typeof b[sortBy] === 'number') {
      return (b[sortBy] as number) - (a[sortBy] as number);
    }
    return 0; // Default no sorting
  });
  
  // Filter by search term if any
  const filteredData = searchTerm.trim() 
    ? sortedData.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : sortedData;
  
  // Get the human-readable label for the sort criteria
  const statLabel = getSortByLabel(sortBy, dataType);
  
  // Calculate total for the selected stat across all items
  let totalValue = 0;
  for (const item of data) {
    if (typeof item[sortBy] === 'number') {
      totalValue += item[sortBy] as number;
    }
  }
  
  // Calculate some basic statistics
  const totalItems = data.length;
  const activeItems = data.filter(item => {
    if (typeof item[sortBy] === 'number') {
      return (item[sortBy] as number) > 0;
    }
    return false;
  }).length;
    
  // Calculate some distribution metrics
  let top20Percent = 0;
  const topContributorsCount = Math.ceil(data.length * 0.2); // Top 20% of contributors
  for (let i = 0; i < Math.min(topContributorsCount, sortedData.length); i++) {
    if (typeof sortedData[i][sortBy] === 'number') {
      top20Percent += sortedData[i][sortBy] as number;
    }
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
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {dataType === 'author' ? 'Contributors' : 'Reviewers'}
            </div>
            <div className="text-xl font-bold">{activeItems} active / {totalItems} total</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-500 dark:text-gray-400">Top 20% Contribution</div>
            <div className="text-xl font-bold">{top20PercentageOfTotal}% of total</div>
          </div>
        </div>
        
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search by name..."
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
                {dataType === 'author' && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Approval Rate
                  </th>
                )}
                {dataType === 'reviewer' && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Approval/Rejection
                  </th>
                )}
                {dataType === 'commenter' && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Avg. Comment Length
                  </th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {statLabel}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.map((item, index) => {
                const value = typeof item[sortBy] === 'number' ? item[sortBy] as number : 0;
                const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0';
                
                // Special handling for reviewer's approval ratio
                const approvalRatio = dataType === 'reviewer' && 'approvalsGiven' in item && 'rejectionsGiven' in item
                  ? `${(item as ReviewerStats).approvalsGiven}/${(item as ReviewerStats).rejectionsGiven}`
                  : '';
                
                // Get approval rate (exists in both author and reviewer stats)
                const approvalRate = typeof item['approvalRate'] === 'number' 
                  ? (item['approvalRate'] as number).toFixed(1) + '%'
                  : 'N/A';
                
                return (
                  <tr key={item.name + index} 
                      className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/30' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </td>
                    {dataType === 'author' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                        {approvalRate}
                      </td>
                    )}
                    {dataType === 'reviewer' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                        {approvalRatio} ({approvalRate})
                      </td>
                    )}
                    {dataType === 'commenter' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                        {(item as CommenterStats).averageCommentLength.toFixed(1)} chars
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                      {formatValue(value, sortBy)}
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
            {filteredData.length} of {data.length} {dataType === 'author' ? 'contributors' : 'reviewers'} shown
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
function getSortByLabel(sortBy: string, dataType: 'author' | 'reviewer' | 'commenter'): string {
  if (dataType === 'author') {
    switch (sortBy) {
      case 'totalPRs':
        return 'Pull Requests';
      case 'approvalRate':
        return 'Approval Rate';
      case 'rejectionRate':
        return 'Rejection Rate';
      case 'averageReviewers':
        return 'Avg Reviewers';
      case 'responseTimeAvg':
        return 'Avg Response Time';
      case 'timeToMergeAvg':
        return 'Avg Time to Merge';
      default:
        return String(sortBy);
    }
  } else if (dataType === 'reviewer') {
    switch (sortBy) {
      case 'totalReviews':
        return 'Reviews';
      case 'approvalsGiven':
        return 'Approvals';
      case 'rejectionsGiven':
        return 'Rejections';
      case 'approvalRate':
        return 'Approval Rate';
      case 'responseTimeAvg':
        return 'Response Time';
      default:
        return String(sortBy);
    }
  } else { // commenter
    switch (sortBy) {
      case 'totalComments':
        return 'Comments';
      case 'totalCommentLength':
        return 'Total Characters';
      case 'averageCommentLength':
        return 'Avg Comment Length';
      default:
        return String(sortBy);
    }
  }
}

// Format value based on its type
function formatValue(value: number, sortBy: string): string {
  if (sortBy.includes('Rate')) {
    return value.toFixed(1) + '%';
  } else if (sortBy.includes('Time') || sortBy.includes('Avg')) {
    return value.toFixed(1) + (sortBy.includes('Time') ? ' hours' : '');
  } else if (sortBy === 'totalCommentLength') {
    // Format character counts nicely with suffixes
    if (value > 1000000) {
      return (value / 1000000).toFixed(1) + 'M chars';
    } else if (value > 1000) {
      return (value / 1000).toFixed(1) + 'k chars';
    }
    return value.toLocaleString() + ' chars';
  } else if (sortBy === 'averageCommentLength') {
    return value.toFixed(1) + ' chars';
  }
  return value.toLocaleString();
}