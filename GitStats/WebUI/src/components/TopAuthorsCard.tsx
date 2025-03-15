import { PrAuthorStats } from '../utils/pullRequestAnalyzer';
import { Bar } from 'react-chartjs-2';
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

interface TopAuthorsCardProps {
  authors: PrAuthorStats[];
  title: string;
  metric: keyof PrAuthorStats;
  metricLabel: string;
  chartColor?: string;
}

export const TopAuthorsCard = ({ 
  authors, 
  title, 
  metric, 
  metricLabel,
  chartColor = 'rgba(54, 162, 235, 0.6)'
}: TopAuthorsCardProps) => {
  if (authors.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-500">No data available.</p>
      </div>
    );
  }
  
  // Prepare chart data
  const chartData = {
    labels: authors.map(author => author.name.split('@')[0]), // Use name or first part of email
    datasets: [
      {
        label: metricLabel,
        data: authors.map(author => {
          const value = author[metric];
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
            if (metric === 'approvalRate' || metric === 'rejectionRate') {
              return `${metricLabel}: ${value.toFixed(1)}%`;
            } else if (metric === 'responseTimeAvg' || metric === 'timeToMergeAvg') {
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
            if (metric === 'approvalRate' || metric === 'rejectionRate') {
              return value + '%';
            } else if (metric === 'responseTimeAvg' || metric === 'timeToMergeAvg') {
              return value + 'h';
            }
            return value;
          }
        }
      }
    }
  };
  
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="h-64">
        <Bar data={chartData} options={options} id={`authors-chart-${title.replace(/\s+/g, '-').toLowerCase()}`} />
      </div>
      
      <div className="mt-4 overflow-y-auto max-h-64">
        <table className="w-full text-sm">
          <thead className="text-left border-b">
            <tr>
              <th className="pb-2">Author</th>
              <th className="pb-2 text-right">{metricLabel}</th>
              <th className="pb-2 text-right">Approval Rate</th>
            </tr>
          </thead>
          <tbody>
            {authors.map((author) => {
              const metricValue = author[metric];
              let displayValue = '';
              
              // Format the display value based on metric type
              if (typeof metricValue === 'number') {
                if (metric === 'approvalRate' || metric === 'rejectionRate') {
                  displayValue = metricValue.toFixed(1) + '%';
                } else if (metric === 'responseTimeAvg' || metric === 'timeToMergeAvg') {
                  displayValue = metricValue.toFixed(1) + ' hours';
                } else {
                  displayValue = metricValue.toString();
                }
              } else if (typeof metricValue === 'object' && !Array.isArray(metricValue)) {
                // If it's a Record<string, number>, count the number of entries
                displayValue = Object.keys(metricValue as Record<string, number>).length.toString() + ' repos';
              }
              
              return (
                <tr key={author.name} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">
                    <div className="font-medium">{author.name}</div>
                  </td>
                  <td className="py-2 text-right">
                    {displayValue}
                  </td>
                  <td className="py-2 text-right">
                    <span className={`${author.approvalRate >= 70 ? 'text-green-500' : author.approvalRate >= 30 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {author.approvalRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};