import { useState } from 'react';
import { CommenterStats } from '../utils/pullRequestAnalyzer';
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

interface TopCommentersCardProps {
  commenters: CommenterStats[];
  title: string;
  metric: keyof CommenterStats;
  metricLabel: string;
  chartColor?: string;
}

export const TopCommentersCard = ({ 
  commenters, 
  title, 
  metric, 
  metricLabel,
  chartColor = 'rgba(153, 102, 255, 0.6)'
}: TopCommentersCardProps) => {
  if (commenters.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-500">No data available.</p>
      </div>
    );
  }
  
  // Limit displayed commenters in chart to top 10 for better visibility
  const displayedCommenters = [...commenters].slice(0, 10);
  
  // Prepare chart data
  const chartData = {
    labels: displayedCommenters.map(commenter => commenter.name.split('@')[0]), // Use name or first part of email
    datasets: [
      {
        label: metricLabel,
        data: displayedCommenters.map(commenter => {
          const value = commenter[metric];
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
            if (metric === 'averageCommentLength') {
              return `${metricLabel}: ${value.toFixed(1)} chars`;
            } else if (metric === 'totalCommentLength') {
              return `${metricLabel}: ${value.toLocaleString()} chars`;
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
            if (metric === 'averageCommentLength') {
              return value + ' chars';
            } else if (metric === 'totalCommentLength' && value > 1000) {
              return (value / 1000).toFixed(1) + 'k';
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
        <Bar data={chartData} options={options} id={`commenters-chart-${title.replace(/\s+/g, '-').toLowerCase()}`} />
      </div>
      
      <div className="mt-4 overflow-y-auto max-h-64">
        {commenters.length > 10 && (
          <div className="text-xs text-gray-500 mb-2">
            Showing top 10 of {commenters.length} commenters. View the full leaderboard for complete data.
          </div>
        )}
        <table className="w-full text-sm">
          <thead className="text-left border-b">
            <tr>
              <th className="pb-2">Commenter</th>
              <th className="pb-2 text-right">{metricLabel}</th>
              <th className="pb-2 text-right">Avg. Length</th>
            </tr>
          </thead>
          <tbody>
            {displayedCommenters.map((commenter) => {
              const metricValue = commenter[metric];
              let displayValue = '';
              
              // Format the display value based on metric type
              if (typeof metricValue === 'number') {
                if (metric === 'averageCommentLength') {
                  displayValue = metricValue.toFixed(1) + ' chars';
                } else if (metric === 'totalCommentLength') {
                  // Format large numbers with k/M suffix
                  if (metricValue > 1000000) {
                    displayValue = (metricValue / 1000000).toFixed(1) + 'M chars';
                  } else if (metricValue > 1000) {
                    displayValue = (metricValue / 1000).toFixed(1) + 'k chars';
                  } else {
                    displayValue = metricValue.toLocaleString() + ' chars';
                  }
                } else {
                  displayValue = metricValue.toString();
                }
              } else if (typeof metricValue === 'object' && !Array.isArray(metricValue)) {
                // If it's a Record<string, number>, count the number of entries
                displayValue = Object.keys(metricValue as Record<string, number>).length.toString() + ' repos';
              }
              
              return (
                <tr key={commenter.name} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">
                    <div className="font-medium">{commenter.name}</div>
                  </td>
                  <td className="py-2 text-right">
                    {displayValue}
                  </td>
                  <td className="py-2 text-right">
                    {commenter.averageCommentLength.toFixed(1)} chars
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
          data={commenters}
          sortBy={metric}
          title={title}
          dataType="commenter"
        />
      )}
    </div>
  );
};