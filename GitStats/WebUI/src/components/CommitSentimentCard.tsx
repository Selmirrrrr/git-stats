import { useState } from 'react';
import { CommitInfo, CommitterStats } from '../types';
import { getTopCommitters } from '../utils/commitAnalyzer';
import { categorizeSentiment } from '../utils/sentimentAnalyzer';
import { BarChart } from './BarChart';

interface CommitSentimentCardProps {
  commits: CommitInfo[];
  committerStats: CommitterStats[];
  limit?: number;
}

export const CommitSentimentCard = ({ 
  commits,
  committerStats,
  limit = 5 
}: CommitSentimentCardProps) => {
  const [showAll, setShowAll] = useState(false);
  const [mode, setMode] = useState<'positive' | 'negative' | 'average'>('average');
  
  // Use different sorting criteria based on mode
  const sortKey = mode === 'positive' 
    ? 'positivePct' 
    : (mode === 'negative' ? 'negativePct' : 'averageSentiment');
  
  // Get top committers based on selected sentiment metric
  let topCommitters = getTopCommitters(
    committerStats, 
    sortKey as keyof CommitterStats, 
    showAll ? committerStats.length : limit
  );
  
  // For negative sentiment, we need to reverse the order (most negative first)
  if (mode === 'negative') {
    topCommitters = [...topCommitters].reverse();
  }
  
  // Filter out committers with no sentiment data
  const filteredCommitters = topCommitters.filter(c => c.totalCommits > 0);
  
  // Find most positive and negative commit messages for examples
  const sentimentSortedCommits = [...commits]
    .filter(c => c.SentimentScore !== undefined)
    .sort((a, b) => ((b.SentimentScore || 0) - (a.SentimentScore || 0)));
  
  const mostPositiveCommit = sentimentSortedCommits.length > 0 ? sentimentSortedCommits[0] : null;
  const mostNegativeCommit = sentimentSortedCommits.length > 0 
    ? sentimentSortedCommits[sentimentSortedCommits.length - 1] 
    : null;
  
  // Handle empty data case
  if (filteredCommitters.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Commit Message Sentiment</h3>
        <p className="text-gray-500">No sentiment data available.</p>
      </div>
    );
  }

  // Create chart data
  const chartData = {
    labels: filteredCommitters.map(c => c.email.split('@')[0]), // Use username part of email
    datasets: [
      {
        label: mode === 'positive' 
          ? '% Positive Commits' 
          : (mode === 'negative' ? '% Negative Commits' : 'Sentiment Score'),
        data: filteredCommitters.map(c => 
          mode === 'positive' 
            ? c.positivePct 
            : (mode === 'negative' ? c.negativePct : (c.averageSentiment * 100))
        ),
        backgroundColor: filteredCommitters.map(c => {
          const sentiment = categorizeSentiment(c.averageSentiment);
          return sentiment.color;
        }).join(',')
      }
    ]
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Commit Message Sentiment</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setMode('average')}
            className={`text-xs px-2 py-1 rounded ${
              mode === 'average' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            Average
          </button>
          <button 
            onClick={() => setMode('positive')}
            className={`text-xs px-2 py-1 rounded ${
              mode === 'positive' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            Positive
          </button>
          <button 
            onClick={() => setMode('negative')}
            className={`text-xs px-2 py-1 rounded ${
              mode === 'negative' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            Negative
          </button>
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {showAll ? 'Show Top 5' : 'Show All'}
          </button>
        </div>
      </div>
      
      <div className="h-64">
        <BarChart
          title=""
          labels={chartData.labels}
          datasets={chartData.datasets}
          height={240}
        />
      </div>
      
      <div className="mt-4 overflow-y-auto max-h-64">
        <table className="w-full text-sm">
          <thead className="text-left border-b">
            <tr>
              <th className="pb-2">Contributor</th>
              <th className="pb-2">Sentiment</th>
              <th className="pb-2 text-right">Stats</th>
            </tr>
          </thead>
          <tbody>
            {filteredCommitters.map((committer) => {
              const sentiment = categorizeSentiment(committer.averageSentiment);
              
              return (
                <tr key={committer.email} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">
                    <div>{committer.name}</div>
                    <div className="text-xs text-gray-500">{committer.email}</div>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: sentiment.color }}></span>
                      <span>{sentiment.category}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Score: {committer.averageSentiment.toFixed(2)}
                    </div>
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <span className="text-green-500">{committer.positivePct}% positive</span>
                      <span>|</span>
                      <span className="text-red-500">{committer.negativePct}% negative</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Based on {committer.totalCommits} commits
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Example positive/negative commit messages */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold mb-2">Example Commit Messages</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {mostPositiveCommit && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                <span className="font-medium">Most Positive Commit</span>
                <span className="text-xs text-gray-500 ml-auto">
                  Score: {(mostPositiveCommit.SentimentScore || 0).toFixed(2)}
                </span>
              </div>
              <p className="text-sm italic">"{mostPositiveCommit.CommitMessage}"</p>
              <p className="text-xs text-gray-500 mt-1">By {mostPositiveCommit.CommitterName}</p>
            </div>
          )}
          
          {mostNegativeCommit && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                <span className="font-medium">Most Negative Commit</span>
                <span className="text-xs text-gray-500 ml-auto">
                  Score: {(mostNegativeCommit.SentimentScore || 0).toFixed(2)}
                </span>
              </div>
              <p className="text-sm italic">"{mostNegativeCommit.CommitMessage}"</p>
              <p className="text-xs text-gray-500 mt-1">By {mostNegativeCommit.CommitterName}</p>
            </div>
          )}
        </div>
        
        <p className="mt-4 text-xs text-gray-500">
          This analysis examines the sentiment in commit messages, which can reflect team mood and project health.
          Positive language often correlates with feature development and improvements, while negative language
          may indicate bug fixes and urgent issues. Both are natural parts of development.
        </p>
      </div>
    </div>
  );
};