import { Line } from 'react-chartjs-2';
import { ReviewActivityTrend } from '../types';

interface PrActivityChartProps {
  activityData: ReviewActivityTrend;
  height?: number;
}

export const PrActivityChart = ({ activityData, height = 300 }: PrActivityChartProps) => {
  // Chart data
  const data = {
    labels: activityData.dates,
    datasets: [
      {
        label: 'PRs Created',
        data: activityData.prCreated,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true
      },
      {
        label: 'PRs Approved',
        data: activityData.prApproved,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1,
        fill: true
      },
      {
        label: 'PRs Rejected',
        data: activityData.prRejected,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        fill: true
      }
    ]
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          stepSize: 1
        }
      },
      x: {
        ticks: {
          maxTicksLimit: 10,
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    }
  };

  return (
    <div style={{ height: `${height}px` }} className="card">
      <h3 className="text-lg font-semibold mb-4">Pull Request Activity Over Time</h3>
      <Line data={data} options={options} />
      <div className="mt-3 text-sm text-gray-500">
        This chart shows the trend of pull request activity over time, including creation, approval, and rejection rates.
      </div>
    </div>
  );
};