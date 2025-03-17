import React from 'react';

interface CommitFiltersProps {
  filterSettings: {
    excludeCodeMoves: boolean;
    excludeMergeCommits: boolean;
    moveRatio: number;
  };
  setFilterSettings: (settings: any) => void;
  totalCommits: number;
  filteredCommits: number;
  excludedCommits: number;
}

export const CommitFilters: React.FC<CommitFiltersProps> = ({
  filterSettings,
  setFilterSettings,
  totalCommits,
  filteredCommits,
  excludedCommits
}) => {
  // Handle checkbox changes
  const handleExcludeCodeMovesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterSettings({
      ...filterSettings,
      excludeCodeMoves: e.target.checked
    });
  };
  
  const handleExcludeMergeCommitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterSettings({
      ...filterSettings,
      excludeMergeCommits: e.target.checked
    });
  };

  // Handle ratio slider change
  const handleRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterSettings({
      ...filterSettings,
      moveRatio: parseFloat(e.target.value)
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Commit Filters</h2>
        
        <div className="text-sm text-gray-600">
          {excludedCommits > 0 ? (
            <span>
              Showing {filteredCommits} of {totalCommits} commits 
              ({excludedCommits} extreme value commits filtered)
            </span>
          ) : (
            <span>Showing all {totalCommits} commits</span>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="excludeCodeMoves"
            checked={filterSettings.excludeCodeMoves}
            onChange={handleExcludeCodeMovesChange}
            className="mr-2"
          />
          <label htmlFor="excludeCodeMoves" className="text-sm font-medium">
            Exclude extreme code-moving commits
          </label>
          <div className="ml-2 text-xs text-gray-500">
            (commits that likely just move code around without adding real value)
          </div>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="excludeMergeCommits"
            checked={filterSettings.excludeMergeCommits}
            onChange={handleExcludeMergeCommitsChange}
            className="mr-2"
          />
          <label htmlFor="excludeMergeCommits" className="text-sm font-medium">
            Exclude merge commits
          </label>
          <div className="ml-2 text-xs text-gray-500">
            (commits with multiple parents, typically created when merging branches)
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <div className="flex justify-between">
            <label htmlFor="moveRatio" className="text-sm font-medium">
              Move Ratio: {filterSettings.moveRatio.toFixed(1)}
            </label>
            <div className="text-xs text-gray-500 italic">
              Higher values mean stricter filtering
            </div>
          </div>
          <input
            type="range"
            id="moveRatio"
            min="0.5"
            max="1.0"
            step="0.1"
            value={filterSettings.moveRatio}
            onChange={handleRatioChange}
            disabled={!filterSettings.excludeCodeMoves}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0.5 (Permissive)</span>
            <span>1.0 (Strict)</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Explanation: A ratio close to 1.0 means the commit has nearly equal additions and deletions,
            suggesting code was mostly moved rather than substantively changed. A ratio of 0.8 means at least
            80% of lines were likely just moved.
          </div>
        </div>
      </div>
    </div>
  );
};