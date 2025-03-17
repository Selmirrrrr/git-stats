import { useState, useMemo } from 'react';
import { CommitInfo } from '../types';

interface CommitListGridProps {
  commits: CommitInfo[];
}

// Column definitions
type SortKey = 'CommitId' | 'CommitterName' | 'RepositoryName' | 'CommitMessage' | 'Additions' | 'Deletions' | 'total';

export const CommitListGrid = ({ commits }: CommitListGridProps) => {
  const [sortBy, setSortBy] = useState<SortKey>('Additions');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  const ITEMS_PER_PAGE = 15;
  
  // Handle column header click to sort
  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column with default desc direction for numeric columns
      setSortBy(key);
      setSortDirection(
        key === 'CommitId' || key === 'CommitterName' || key === 'RepositoryName' || key === 'CommitMessage' 
          ? 'asc' 
          : 'desc'
      );
    }
    // Reset to first page when sorting changes
    setPage(1);
  };
  
  // Filter and sort the commits
  const filteredAndSortedCommits = useMemo(() => {
    // First, filter by search term if provided
    let filtered = commits;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = commits.filter(commit => 
        commit.CommitId.toLowerCase().includes(term) ||
        commit.CommitterName.toLowerCase().includes(term) ||
        commit.RepositoryName.toLowerCase().includes(term) ||
        commit.CommitMessage.toLowerCase().includes(term)
      );
    }
    
    // Then sort by the selected column
    return [...filtered].sort((a, b) => {
      // Special case for total (which isn't a direct property)
      if (sortBy === 'total') {
        const totalA = a.Additions + a.Deletions;
        const totalB = b.Additions + b.Deletions;
        return sortDirection === 'asc' ? totalA - totalB : totalB - totalA;
      }
      
      // Handle string columns
      if (sortBy === 'CommitId' || sortBy === 'CommitterName' || sortBy === 'RepositoryName' || sortBy === 'CommitMessage') {
        const valueA = a[sortBy];
        const valueB = b[sortBy];
        if (sortDirection === 'asc') {
          return valueA.localeCompare(valueB);
        } else {
          return valueB.localeCompare(valueA);
        }
      }
      
      // Handle numeric columns
      const valueA = a[sortBy];
      const valueB = b[sortBy];
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });
  }, [commits, sortBy, sortDirection, searchTerm]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedCommits.length / ITEMS_PER_PAGE);
  const currentPageCommits = filteredAndSortedCommits.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Generate sort indicator
  const getSortIndicator = (key: SortKey) => {
    if (sortBy !== key) return null;
    return sortDirection === 'asc' ? '▲' : '▼';
  };
  
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Commit Details</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Search commits..."
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // Reset to first page when search changes
            }}
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('CommitId')}
              >
                Commit ID {getSortIndicator('CommitId')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('CommitterName')}
              >
                Author {getSortIndicator('CommitterName')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('RepositoryName')}
              >
                Repository {getSortIndicator('RepositoryName')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('CommitMessage')}
              >
                Message {getSortIndicator('CommitMessage')}
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('Additions')}
              >
                Additions {getSortIndicator('Additions')}
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('Deletions')}
              >
                Deletions {getSortIndicator('Deletions')}
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('total')}
              >
                Total {getSortIndicator('total')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {currentPageCommits.map((commit) => (
              <tr key={commit.CommitId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-300">
                  {commit.CommitId.substring(0, 7)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {commit.CommitterName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {commit.RepositoryName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-md truncate">
                  {commit.CommitMessage}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 text-right">
                  +{commit.Additions.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400 text-right">
                  -{commit.Deletions.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right font-semibold">
                  {(commit.Additions + commit.Deletions).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{Math.min(filteredAndSortedCommits.length, (page - 1) * ITEMS_PER_PAGE + 1)}</span> to{' '}
            <span className="font-medium">{Math.min(filteredAndSortedCommits.length, page * ITEMS_PER_PAGE)}</span> of{' '}
            <span className="font-medium">{filteredAndSortedCommits.length}</span> commits
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded ${
                page === 1
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded ${
                page === totalPages
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};