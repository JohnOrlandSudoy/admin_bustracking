import React from 'react';

export const RealTimeBusStats: React.FC = () => {
  // Since we removed websocket functionality, we'll show a simplified stats view
  // In a real implementation, you would fetch this data from your API endpoints
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Bus Statistics</h3>
      
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-lg font-medium">Statistics Dashboard</p>
        <p className="text-sm text-gray-400 mt-1">
          Bus statistics are now displayed on the map with real-time locations
        </p>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>Tip:</strong> Use the map to view real-time bus locations, routes, and terminal information.
          </p>
        </div>
      </div>
    </div>
  );
};
