import { useEffect, useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface BranchDistributionCardProps {
  distributionData: Record<string, number>;
  title: string;
  description?: string;
  height?: number;
}

export const BranchDistributionCard = ({ 
  distributionData, 
  title, 
  description = '',
  height = 300 
}: BranchDistributionCardProps) => {
  const chartId = `branch-chart-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const chartRef = useRef<ChartJS | null>(null);
  
  // Cleanup function to destroy chart instance when component unmounts or updates
  useEffect(() => {
    return () => {
      // Destroy the chart when component unmounts
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [distributionData, title]);
  if (Object.keys(distributionData).length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-500">No data available.</p>
      </div>
    );
  }
  
  // Sort branches by usage count (descending)
  const sortedBranches = Object.entries(distributionData)
    .sort((a, b) => b[1] - a[1]);
  
  // Take top 10 branches for chart clarity, combine the rest into "Others"
  const topBranches = sortedBranches.slice(0, 8);
  
  let otherBranchesCount = 0;
  if (sortedBranches.length > 8) {
    sortedBranches.slice(8).forEach(([_, count]) => {
      otherBranchesCount += count;
    });
  }
  
  // Prepare chart data
  const labels = topBranches.map(([branch]) => branch);
  const data = topBranches.map(([_, count]) => count);
  
  if (otherBranchesCount > 0) {
    labels.push('Others');
    data.push(otherBranchesCount);
  }
  
  // Generate colors based on the number of branches
  const backgroundColors = [
    'rgba(54, 162, 235, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(199, 199, 199, 0.8)',
    'rgba(83, 102, 255, 0.8)',
    'rgba(170, 170, 170, 0.8)', // For "Others"
  ];
  
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };
  
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          // Simplified approach that doesn't cause recursion
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                return {
                  text: `${label} (${value})`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  lineWidth: 1,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw;
            const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };
  
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      
      <div style={{ height: `${height}px` }}>
        <Doughnut 
          data={chartData} 
          options={options} 
          id={chartId}
          ref={(ref: any) => {
            // In react-chartjs-2 v4+, the chart instance is directly on the ref
            chartRef.current = ref;
          }}
        />
      </div>
      
      {description && (
        <div className="mt-3 text-sm text-gray-500">
          {description}
        </div>
      )}
    </div>
  );
};