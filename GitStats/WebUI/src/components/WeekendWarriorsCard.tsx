import { useState } from 'react';
import { CommitterStats } from '../types';
import { getTopCommitters, getWeekendWarriorLevel } from '../utils/commitAnalyzer';
import { BarChart } from './BarChart';

interface WeekendWarriorsCardProps {
  committerStats: CommitterStats[];
  limit?: number;
}

export const WeekendWarriorsCard = ({ 
  committerStats,
  limit = 5 
}: WeekendWarriorsCardProps) => {
  const [showAll, setShowAll] = useState(false);
  
  // Get the committers with highest percentage of weekend commits
  const weekendWarriors = getTopCommitters(committerStats, 'weekendCommitPct', showAll ? committerStats.length : limit);
  
  // Filter out committers with no weekend commits
  const filteredWarriors = weekendWarriors.filter(c => c.weekendCommitPct > 0);
  
  // Handle empty data case
  if (filteredWarriors.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Weekend Warriors</h3>
        <p className="text-gray-500">No weekend activity detected.</p>
      </div>
    );
  }

  // Create chart data
  const chartData = {
    labels: filteredWarriors.map(c => c.email.split('@')[0]), // Use username part of email
    datasets: [
      {
        label: 'Weekend Commits %',
        data: filteredWarriors.map(c => c.weekendCommitPct),
        backgroundColor: filteredWarriors.map(c => getWeekendWarriorLevel(c.weekendCommitPct).color).join(',')
      }
    ]
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Weekend Warriors</h3>
        <button 
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {showAll ? 'Show Top 5' : 'Show All'}
        </button>
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
              <th className="pb-2">Status</th>
              <th className="pb-2 text-right">Weekend Activity</th>
            </tr>
          </thead>
          <tbody>
            {filteredWarriors.map((committer) => {
              const warriorLevel = getWeekendWarriorLevel(committer.weekendCommitPct);
              
              return (
                <tr key={committer.email} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">
                    <div>{committer.name}</div>
                    <div className="text-xs text-gray-500">{committer.email}</div>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: warriorLevel.color }}></span>
                      <span className="capitalize">{warriorLevel.level}</span>
                    </div>
                    <div className="text-xs text-gray-500">{warriorLevel.description}</div>
                  </td>
                  <td className="py-2 text-right">
                    <div>{committer.weekendCommitPct}% on weekends</div>
                    <div className="text-xs text-gray-500">
                      {committer.weekendCommits} of {committer.totalCommits} commits
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold mb-2">Weekend Work Patterns</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full mr-2 bg-slate-400"></span>
            <span>Casual: &lt;10% weekend work</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full mr-2 bg-green-300"></span>
            <span>Moderate: 10-25% weekend work</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full mr-2 bg-yellow-300"></span>
            <span>Dedicated: 25-40% weekend work</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full mr-2 bg-orange-500"></span>
            <span>Warrior: &gt;40% weekend work</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          This metric shows the percentage of each contributor's commits that occur on weekends.
          High weekend activity may indicate dedication but could also contribute to burnout risk.
        </p>
      </div>
    </div>
  );
};