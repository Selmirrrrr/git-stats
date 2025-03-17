import { CommitInfo } from '../types';
import { getCommitsByTimeframe } from '../utils/commitAnalyzer';

// Define work hours for highlighting
const WORK_HOURS_START = 9;
const WORK_HOURS_END = 17;

interface CommitHourHeatmapProps {
  commits: CommitInfo[];
}

export const CommitHourHeatmap = ({ commits }: CommitHourHeatmapProps) => {
  const hourData = getCommitsByTimeframe(commits, 'hour');
  
  // Find max value for scaling the intensity
  const maxCommits = Math.max(...hourData.map(h => h.count));
  
  // Helper to determine cell background color intensity
  const getCellColor = (hour: number, count: number) => {
    // Determine if this is during work hours or after hours
    const isWorkHours = hour >= WORK_HOURS_START && hour < WORK_HOURS_END;
    const isEarlyMorning = hour >= 0 && hour < 6;
    const isEvening = hour >= 18 && hour < 22;
    const isLateNight = hour >= 22 || hour < 0;
    
    // Base intensity on count relative to max
    const intensity = count > 0 ? 0.2 + (count / maxCommits) * 0.8 : 0;
    
    if (isWorkHours) {
      // Green for work hours
      return `rgba(34, 197, 94, ${intensity})`;
    } else if (isEarlyMorning) {
      // Red for early morning (high burnout risk)
      return `rgba(239, 68, 68, ${intensity})`;
    } else if (isLateNight) {
      // Orange for late night (moderate-high burnout risk)
      return `rgba(249, 115, 22, ${intensity})`;
    } else if (isEvening) {
      // Yellow for evening (moderate burnout risk)
      return `rgba(234, 179, 8, ${intensity})`;
    } else {
      // Blue for other hours
      return `rgba(59, 130, 246, ${intensity})`;
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Commit Activity by Hour of Day</h3>
      
      <div className="relative overflow-x-auto">
        <div className="flex flex-col">
          <div className="grid grid-cols-24 gap-1 mb-2">
            {hourData.map((hour, index) => (
              <div 
                key={index} 
                className="text-xs text-center"
              >
                {index % 3 === 0 ? hour.label : ''}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-24 gap-1">
            {hourData.map((hour, index) => {
              const hourNum = parseInt(hour.label.split(':')[0]);
              return (
                <div
                  key={index}
                  className="h-10 rounded flex items-center justify-center relative group"
                  style={{ 
                    backgroundColor: getCellColor(hourNum, hour.count),
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span className="text-xs font-medium text-white drop-shadow-sm">
                    {hour.count > 0 ? hour.count : ''}
                  </span>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity whitespace-nowrap z-10">
                    {hour.label}: {hour.count} commits
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-sm">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded mr-2 bg-green-500"></span>
                <span>Work Hours (9AM-5PM)</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded mr-2 bg-yellow-500"></span>
                <span>Evening (6PM-10PM)</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded mr-2 bg-orange-500"></span>
                <span>Late Night (10PM-12AM)</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded mr-2 bg-red-500"></span>
                <span>Early Morning (12AM-6AM)</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              This visualization shows when commits are made throughout the day. Frequent commits during 
              non-work hours may indicate an unhealthy work-life balance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add CSS for the 24-column grid
const style = document.createElement('style');
style.textContent = `
  .grid-cols-24 {
    grid-template-columns: repeat(24, minmax(0, 1fr));
  }
`;
document.head.appendChild(style);