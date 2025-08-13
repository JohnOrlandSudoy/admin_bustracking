import React from 'react';
import { useRealTime } from '../context/RealTimeContext';

export const ConnectionStatusIndicator: React.FC = () => {
  const { connectionStatus, connect, disconnect, isConnected } = useRealTime();

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'connecting':
        return (
          <svg className="w-4 h-4 text-white animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'disconnected':
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} flex items-center justify-center`}>
          {getStatusIcon()}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {getStatusText()}
        </span>
      </div>
      
      {connectionStatus.message && connectionStatus.status !== 'connected' && (
        <span className="text-xs text-gray-500 max-w-48 truncate">
          {connectionStatus.message}
        </span>
      )}
      
      {connectionStatus.reconnectAttempts > 0 && (
        <span className="text-xs text-orange-600">
          Retry: {connectionStatus.reconnectAttempts}
        </span>
      )}
      
      <div className="flex space-x-2 ml-auto">
        {!isConnected ? (
          <button
            onClick={connect}
            disabled={connectionStatus.status === 'connecting'}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Connect
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
};
