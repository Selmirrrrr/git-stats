import { useState } from 'react';
import { ReviewerStats } from '../utils/pullRequestAnalyzer';
import { Bar } from 'react-chartjs-2';
import { PrLeaderboardModal } from './PrLeaderboardModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TopReviewersCardProps {
  reviewers: ReviewerStats[];
  title: string;
  metric: keyof ReviewerStats;
  metricLabel: string;
  chartColor?: string;
}

export const TopReviewersCard = ({ 
  reviewers, 
  title, 
  metric, 
  metricLabel,
  chartColor = 'rgba(75, 192, 192, 0.6)'
}: TopReviewersCardProps) => {
  if (reviewers.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-500">No data available.</p>
      </div>
    );
  }
  
  // Prepare chart data
  const chartData = {
    labels: reviewers.map(reviewer => reviewer.name.split('@')[0]), // Use name or first part of email
    datasets: [
      {
        label: metricLabel,
        data: reviewers.map(reviewer => {
          const value = reviewer[metric];
          // Handle different metric types
          if (typeof value === 'number') {
            return value;
          } else if (typeof value === 'object' && !Array.isArray(value)) {
            // If it's a Record<string, number>, sum the values
            return Object.values(value as Record<string, number>).reduce((sum, val) => sum + val, 0);
          }
          return 0;
        }),
        backgroundColor: chartColor,
        borderColor: chartColor.replace('0.6', '1'),
        borderWidth: 1,
      }
    ]
  };
  
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            if (metric === 'approvalRate') {
              return `${metricLabel}: ${value.toFixed(1)}%`;
            } else if (metric === 'responseTimeAvg') {
              return `${metricLabel}: ${value.toFixed(1)} hours`;
            }
            return `${metricLabel}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: metricLabel
        },
        ticks: {
          callback: function(value: any) {
            if (metric === 'approvalRate') {
              return value + '%';
            } else if (metric === 'responseTimeAvg') {
              return value + 'h';
            }
            return value;
          }
        }
      }
    }
  };
  
  // Add state for the leaderboard modal
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button 
          onClick={() => setShowLeaderboard(true)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          View Full Leaderboard
        </button>
      </div>
      
      <div className="h-64">
        <Bar data={chartData} options={options} id={`reviewers-chart-${title.replace(/\s+/g, '-').toLowerCase()}`} />
      </div>
      
      <div className="mt-4 overflow-y-auto max-h-64">
        <table className="w-full text-sm">
          <thead className="text-left border-b">
            <tr>
              <th className="pb-2">Reviewer</th>
              <th className="pb-2 text-right">{metricLabel}</th>
              <th className="pb-2 text-right">Approval/Rejection Ratio</th>
            </tr>
          </thead>
          <tbody>
            {reviewers.map((reviewer) => {
              const metricValue = reviewer[metric];
              let displayValue = '';
              
              // Format the display value based on metric type
              if (typeof metricValue === 'number') {
                if (metric === 'approvalRate') {
                  displayValue = metricValue.toFixed(1) + '%';
                } else if (metric === 'responseTimeAvg') {
                  displayValue = metricValue.toFixed(1) + ' hours';
                } else {
                  displayValue = metricValue.toString();
                }
              } else if (typeof metricValue === 'object' && !Array.isArray(metricValue)) {
                // If it's a Record<string, number>, count the number of entries
                displayValue = Object.keys(metricValue as Record<string, number>).length.toString() + ' repos';
              }
              
              // Calculate the approval/rejection ratio as a string
              const approvalRatio = reviewer.approvalsGiven > 0 || reviewer.rejectionsGiven > 0 
                ? `${reviewer.approvalsGiven}/${reviewer.rejectionsGiven}`
                : '0/0';
                
              return (
                <tr key={reviewer.name} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">
                    <div className="font-medium">{reviewer.name}</div>
                  </td>
                  <td className="py-2 text-right">
                    {displayValue}
                  </td>
                  <td className="py-2 text-right">
                    <span className={`${
                      reviewer.approvalRate >= 70 ? 'text-green-500' : 
                      reviewer.approvalRate >= 30 ? 'text-yellow-500' : 
                      'text-red-500'
                    }`}>
                      {approvalRatio} ({reviewer.approvalRate.toFixed(0)}%)
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <PrLeaderboardModal
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          data={reviewers}
          sortBy={metric}
          title={title}
          dataType="reviewer"
        />
      )}
    </div>
  );
};