import { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { PrDashboard } from './pages/PrDashboard';

function App() {
  const [activeTab, setActiveTab] = useState<'commits' | 'pull-requests'>('commits');
  
  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <nav className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img src="git-icon.svg" alt="Git Stats Logo" className="h-8 w-8" />
              </div>
              <div className="ml-4 font-bold text-xl">Git Stats</div>
            </div>
            
            <div className="flex">
              <button 
                onClick={() => setActiveTab('commits')}
                className={`px-4 py-2 mx-1 font-medium text-sm rounded-md ${
                  activeTab === 'commits' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Commits
              </button>
              <button 
                onClick={() => setActiveTab('pull-requests')}
                className={`px-4 py-2 mx-1 font-medium text-sm rounded-md ${
                  activeTab === 'pull-requests' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Pull Requests
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {activeTab === 'commits' ? <Dashboard /> : <PrDashboard />}
    </main>
  );
}

export default App;