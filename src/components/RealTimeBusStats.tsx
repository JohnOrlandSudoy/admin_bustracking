import React from 'react';
import { useRealTime } from '../context/RealTimeContext';

export const RealTimeBusStats: React.FC = () => {
  const { totalBuses, totalPassengers, totalAvailableSeats, activeBuses } = useRealTime();

  const getOccupancyRate = () => {
    if (totalBuses === 0) return 0;
    const totalSeats = activeBuses.reduce((sum, bus) => sum + bus.busData.totalSeats, 0);
    if (totalSeats === 0) return 0;
    return Math.round(((totalSeats - totalAvailableSeats) / totalSeats) * 100);
  };

  const getStatusDistribution = () => {
    const statusCounts = activeBuses.reduce((acc, bus) => {
      acc[bus.busData.status] = (acc[bus.busData.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return statusCounts;
  };

  const statusDistribution = getStatusDistribution();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Real-Time Bus Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalBuses}</div>
          <div className="text-sm text-gray-600">Active Buses</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{totalPassengers}</div>
          <div className="text-sm text-gray-600">Total Passengers</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{totalAvailableSeats}</div>
          <div className="text-sm text-gray-600">Available Seats</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{getOccupancyRate()}%</div>
          <div className="text-sm text-gray-600">Occupancy Rate</div>
        </div>
      </div>

      {Object.keys(statusDistribution).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Status Distribution</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusDistribution).map(([status, count]) => (
              <div key={status} className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                <span className="text-xs font-medium text-gray-700 capitalize">{status}</span>
                <span className="text-xs text-gray-500">({count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeBuses.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Active Buses</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {activeBuses.map((bus) => (
              <div key={bus.employeeEmail} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-800">Bus {bus.busData.busNumber}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">{bus.busData.route}</span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span>{bus.busData.passengers}/{bus.busData.totalSeats}</span>
                  <span>•</span>
                  <span className="capitalize">{bus.busData.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeBuses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No active buses</p>
          <p className="text-xs">Connect as an employee to see real-time data</p>
        </div>
      )}
    </div>
  );
};
