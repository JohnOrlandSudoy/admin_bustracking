import React, { useState } from 'react';
import { useRealTime } from '../context/RealTimeContext';

export const EmployeeConnectionPanel: React.FC = () => {
  const { 
    employeeEmail, 
    setEmployeeEmail, 
    connectEmployee, 
    disconnect, 
    isConnected, 
    startLocationTracking, 
    stopLocationTracking, 
    isLocationTracking,
    currentLocation 
  } = useRealTime();

  const [inputEmail, setInputEmail] = useState(employeeEmail || 'test0101yourdev@gmail.com');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!inputEmail.trim()) {
      alert('Please enter an employee email');
      return;
    }

    setIsConnecting(true);
    try {
      await connectEmployee(inputEmail.trim());
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setInputEmail('');
  };

  const handleLocationTracking = () => {
    if (isLocationTracking) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Employee Connection</h3>
      
      {/* Connection Form */}
      {!isConnected ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Email</label>
            <input
              type="email"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="employee@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isConnecting ? 'Connecting...' : 'Connect as Employee'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Connected Status */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">Connected as Employee</span>
            </div>
            <div className="text-xs text-green-600 mt-1">{employeeEmail}</div>
          </div>

          {/* Location Tracking Controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Location Tracking</span>
              <button
                onClick={handleLocationTracking}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  isLocationTracking
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {isLocationTracking ? 'Stop' : 'Start'}
              </button>
            </div>
            
            {isLocationTracking && (
              <div className="text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Tracking active</span>
                </div>
              </div>
            )}
          </div>

          {/* Current Location Display */}
          {currentLocation && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              <div className="font-medium text-blue-800 mb-1">Current Location</div>
              <div className="space-y-1 text-blue-700">
                <div className="flex justify-between">
                  <span>Latitude:</span>
                  <span className="font-mono">{currentLocation.lat.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Longitude:</span>
                  <span className="font-mono">{currentLocation.lng.toFixed(6)}</span>
                </div>
                {currentLocation.accuracy && (
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <span>{currentLocation.accuracy.toFixed(1)}m</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm font-medium"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
        <div className="font-medium mb-1">How it works:</div>
        <div className="space-y-1">
          <div>1. Enter your employee email</div>
          <div>2. Connect to get bus assignment</div>
          <div>3. Start location tracking to send updates</div>
          <div>4. View real-time bus locations on map</div>
        </div>
      </div>
    </div>
  );
};
