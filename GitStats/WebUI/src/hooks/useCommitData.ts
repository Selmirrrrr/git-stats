import { useState, useEffect, useMemo } from 'react';
import { CommitInfo, CommitterStats } from '../types';
import { parseCommitData, getCommitterStats, filterExtremeCommits } from '../utils/commitAnalyzer';

// Default filter settings
const DEFAULT_FILTER_SETTINGS = {
  excludeCodeMoves: true,
  extremeThreshold: 500,
  moveRatio: 0.8
};

export function useCommitData(filePath?: string) {
  // Raw commit data from JSON
  const [rawCommits, setRawCommits] = useState<CommitInfo[]>([]);
  
  // Filtering settings
  const [filterSettings, setFilterSettings] = useState(DEFAULT_FILTER_SETTINGS);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtered commits based on current settings
  const commits = useMemo(() => {
    return filterExtremeCommits(rawCommits, filterSettings);
  }, [rawCommits, filterSettings]);
  
  // Committer stats based on filtered commits
  const committerStats = useMemo(() => {
    return getCommitterStats(commits);
  }, [commits]);

  const loadFile = async (path: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would be an API call
      // For now, we'll just fetch the file directly
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
      }
      
      const data = await response.json();
      const parsedCommits = parseCommitData(data);
      
      setRawCommits(parsedCommits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error loading commit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filePath) {
      loadFile(filePath);
    }
  }, [filePath]);

  return {
    commits,
    committerStats,
    loading,
    error,
    loadFile,
    // Filtering controls
    filterSettings,
    setFilterSettings,
    // Stats for filtered vs unfiltered
    totalCommits: rawCommits.length,
    filteredCommits: commits.length,
    excludedCommits: rawCommits.length - commits.length
  };
}