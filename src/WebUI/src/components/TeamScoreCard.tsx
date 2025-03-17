
interface TeamScoreCardProps {
  collaborationScore: number;
  velocityScore: number;
}

export const TeamScoreCard = ({ collaborationScore, velocityScore }: TeamScoreCardProps) => {
  // Function to determine score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-green-400';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Function to get score description
  const getScoreDescription = (type: 'collaboration' | 'velocity', score: number) => {
    if (type === 'collaboration') {
      if (score >= 80) return 'Excellent collaboration practices';
      if (score >= 60) return 'Good team collaboration';
      if (score >= 40) return 'Moderate collaboration, room for improvement';
      if (score >= 20) return 'Collaboration needs significant improvement';
      return 'Critical collaboration issues detected';
    } else {
      if (score >= 80) return 'Excellent team velocity';
      if (score >= 60) return 'Good development pace';
      if (score >= 40) return 'Moderate velocity, room for improvement';
      if (score >= 20) return 'Development process needs improvement';
      return 'Significant bottlenecks detected';
    }
  };

  // Calculate overall score (weighted average)
  const overallScore = Math.round((collaborationScore * 0.5) + (velocityScore * 0.5));
  
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Team Performance Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Overall Score */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Overall Score</div>
          <div className="flex items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </div>
            <div className="ml-4">
              <div className="font-medium">{getScoreDescription('collaboration', overallScore)}</div>
              <div className="text-xs text-gray-500">Based on collaboration and velocity</div>
            </div>
          </div>
        </div>
        
        {/* Collaboration Score */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Collaboration Score</div>
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold ${getScoreColor(collaborationScore)}`}>
              {collaborationScore}
            </div>
            <div className="ml-4">
              <div className="font-medium">{getScoreDescription('collaboration', collaborationScore)}</div>
              <div className="text-xs text-gray-500">Based on review patterns and response times</div>
            </div>
          </div>
        </div>
        
        {/* Velocity Score */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Velocity Score</div>
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold ${getScoreColor(velocityScore)}`}>
              {velocityScore}
            </div>
            <div className="ml-4">
              <div className="font-medium">{getScoreDescription('velocity', velocityScore)}</div>
              <div className="text-xs text-gray-500">Based on PR throughput and merge times</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-gray-500 mt-4">
        <h4 className="font-semibold mb-2">How These Scores Are Calculated</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Collaboration Score:</strong> Measures team interaction quality based on reviewer diversity, response times, and approval patterns.</li>
          <li><strong>Velocity Score:</strong> Measures development speed based on PR frequency, time to merge, and PR complexity.</li>
          <li><strong>Overall Score:</strong> A weighted combination reflecting overall team effectiveness in the PR workflow.</li>
        </ul>
      </div>
    </div>
  );
};