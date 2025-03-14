import { useState } from 'react';
import { CommitterStats } from '../types';
import { getTopCommitters, getBurnoutRiskLevel } from '../utils/commitAnalyzer';
import { BarChart } from './BarChart';

interface BurnoutRiskCardProps {
  committerStats: CommitterStats[];
  limit?: number;
}

export const BurnoutRiskCard = ({ 
  committerStats,
  limit = 5 
}: BurnoutRiskCardProps) => {
  const [showAll, setShowAll] = useState(false);
  
  // Get the committers with the highest burnout risk
  const highRiskCommitters = getTopCommitters(committerStats, 'burnoutRiskScore', showAll ? committerStats.length : limit);
  
  // Handle empty data case
  if (highRiskCommitters.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Burnout Risk Assessment</h3>
        <p className="text-gray-500">No data available.</p>
      </div>
    );
  }

  // Create chart data for the top committers with burnout risk
  const chartData = {
    labels: highRiskCommitters.map(c => c.email.split('@')[0]), // Use username part of email
    datasets: [
      {
        label: 'Burnout Risk Score',
        data: highRiskCommitters.map(c => c.burnoutRiskScore),
        backgroundColor: highRiskCommitters.map(c => getBurnoutRiskLevel(c.burnoutRiskScore).color)
      }
    ]
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Burnout Risk Assessment</h3>
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
              <th className="pb-2">Risk Level</th>
              <th className="pb-2 text-right">Work Pattern</th>
            </tr>
          </thead>
          <tbody>
            {highRiskCommitters.map((committer) => {
              const riskLevel = getBurnoutRiskLevel(committer.burnoutRiskScore);
              
              return (
                <tr key={committer.email} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">
                    <div>{committer.name}</div>
                    <div className="text-xs text-gray-500">{committer.email}</div>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: riskLevel.color }}></span>
                      <span className="capitalize">{riskLevel.level}</span>
                    </div>
                    <div className="text-xs text-gray-500">{committer.burnoutRiskScore}/100</div>
                  </td>
                  <td className="py-2 text-right">
                    <div>{Math.round((committer.afterHoursCommits / committer.totalCommits) * 100)}% after hours</div>
                    <div className="text-xs text-gray-500">
                      {committer.weekendCommits} weekend, {committer.earlyMorningCommits} early morning
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold mb-2">Understanding Burnout Risk</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full mr-2 bg-green-500"></span>
            <span>Low: Healthy work patterns</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full mr-2 bg-yellow-500"></span>
            <span>Moderate: Some after-hours work</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full mr-2 bg-orange-500"></span>
            <span>High: Significant after-hours</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full mr-2 bg-red-500"></span>
            <span>Severe: Extensive off-hours</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Based on commits made outside standard work hours (9 AM - 5 PM), weekends, and early mornings (midnight - 6 AM).
          This metric helps identify potential burnout risks to promote better work-life balance.
        </p>
      </div>
    </div>
  );
};