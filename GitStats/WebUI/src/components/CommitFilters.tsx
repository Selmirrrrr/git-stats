import React from 'react';

interface CommitFiltersProps {
  filterSettings: {
    excludeCodeMoves: boolean;
    extremeThreshold: number;
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
  // Handle checkbox change
  const handleExcludeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterSettings({
      ...filterSettings,
      excludeCodeMoves: e.target.checked
    });
  };

  // Handle threshold slider change
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterSettings({
      ...filterSettings,
      extremeThreshold: parseInt(e.target.value)
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
            onChange={handleExcludeChange}
            className="mr-2"
          />
          <label htmlFor="excludeCodeMoves" className="text-sm font-medium">
            Exclude extreme code-moving commits
          </label>
          <div className="ml-2 text-xs text-gray-500">
            (commits that likely just move code around without adding real value)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label htmlFor="extremeThreshold" className="text-sm font-medium">
                Line Threshold: {filterSettings.extremeThreshold} lines
              </label>
            </div>
            <input
              type="range"
              id="extremeThreshold"
              min="100"
              max="2000"
              step="100"
              value={filterSettings.extremeThreshold}
              onChange={handleThresholdChange}
              disabled={!filterSettings.excludeCodeMoves}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>100</span>
              <span>2000</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label htmlFor="moveRatio" className="text-sm font-medium">
                Move Ratio: {filterSettings.moveRatio.toFixed(1)}
              </label>
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
              <span>0.5</span>
              <span>1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};