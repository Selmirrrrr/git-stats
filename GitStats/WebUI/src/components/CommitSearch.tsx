import { useState } from 'react';
import { CommitInfo } from '../types';
import { searchCommitById, searchCommitsByText } from '../utils/commitAnalyzer';
import { format, parseISO } from 'date-fns';

interface CommitSearchProps {
  commits: CommitInfo[];
}

export const CommitSearch = ({ commits }: CommitSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CommitInfo[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchPerformed(false);
      return;
    }

    // First, try to find an exact commit ID match
    const exactMatch = searchCommitById(commits, searchTerm);
    
    if (exactMatch) {
      setSearchResults([exactMatch]);
    } else {
      // Otherwise, search in commit messages, committer names, etc.
      const results = searchCommitsByText(commits, searchTerm);
      setSearchResults(results);
    }
    
    setSearchPerformed(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Search Commits</h2>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search by commit ID, message, author, etc."
          className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={handleSearch}
          className="btn btn-primary"
        >
          Search
        </button>
      </div>

      {searchPerformed && (
        <div>
          <h3 className="font-semibold mb-2">
            {searchResults.length === 0 
              ? 'No results found' 
              : `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
          </h3>
          
          <div className="overflow-auto max-h-96">
            {searchResults.map(commit => (
              <div key={commit.CommitId} className="p-3 border rounded-md mb-2 bg-gray-50 dark:bg-gray-700">
                <div className="flex justify-between mb-1">
                  <span className="font-mono text-sm text-gray-500">{commit.CommitId.substring(0, 8)}</span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(commit.CommitTime), 'yyyy-MM-dd HH:mm')}
                  </span>
                </div>
                <div className="mb-1 font-semibold">{commit.CommitMessage}</div>
                <div className="flex justify-between text-sm">
                  <span>{commit.CommitterName} &lt;{commit.CommitterEmail}&gt;</span>
                  <span className="text-green-600">+{commit.Additions}</span>
                  <span className="text-red-600">-{commit.Deletions}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Repository: {commit.RepositoryName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};