import { useState, useEffect } from 'react';
import { CommitInfo, CommitterStats } from '../types';
import { parseCommitData, getCommitterStats } from '../utils/commitAnalyzer';

export function useCommitData(filePath?: string) {
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [committerStats, setCommitterStats] = useState<CommitterStats[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
      
      setCommits(parsedCommits);
      setCommitterStats(getCommitterStats(parsedCommits));
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
    loadFile
  };
}