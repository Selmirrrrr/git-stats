import { CommitInfo } from '../types';
import { getCommitsByTimeframe } from '../utils/commitAnalyzer';
import { BarChart } from './BarChart';

interface TimeframeChartProps {
  commits: CommitInfo[];
  timeframeType: 'weekday' | 'month' | 'dayOfMonth';
  title: string;
  chartColor?: string;
  height?: number;
}

export const TimeframeChart = ({ 
  commits, 
  timeframeType, 
  title,
  chartColor = 'rgba(153, 102, 255, 0.6)',
  height
}: TimeframeChartProps) => {
  const timeframeData = getCommitsByTimeframe(commits, timeframeType);
  
  // Set a larger height for the dayOfMonth chart when displayed full-width
  const chartHeight = height || (timeframeType === 'dayOfMonth' ? 400 : 300);
  
  return (
    <div className="h-full">
      <BarChart
        title={title}
        labels={timeframeData.map(item => item.label)}
        datasets={[
          {
            label: 'Commits',
            data: timeframeData.map(item => item.count),
            backgroundColor: chartColor
          }
        ]}
        height={chartHeight}
      />
    </div>
  );
};