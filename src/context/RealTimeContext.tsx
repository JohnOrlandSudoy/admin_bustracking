import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { websocketService, WebSocketMessage, ConnectionStatus } from '../services/websocketService';

interface RealTimeContextType {
  // Connection status
  connectionStatus: ConnectionStatus;
  
  // Employee connection
  employeeEmail: string | null;
  setEmployeeEmail: (email: string) => void;
  connectEmployee: (email: string) => Promise<void>;
  
  // Controls
  showLocationHistory: boolean;
  setShowLocationHistory: (show: boolean) => void;
  clearLocationHistory: () => void;
  
  // Connection management
  connect: (email: string) => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
  
  // Location tracking
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
  isLocationTracking: boolean;
  currentLocation: { lat: number; lng: number; accuracy?: number } | null;
  // Test/dev: simulate user location without geolocation/websocket
  simulateLocation: (loc: { lat: number; lng: number; accuracy?: number }) => void;
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};

interface RealTimeProviderProps {
  children: React.ReactNode;
}

export const RealTimeProvider: React.FC<RealTimeProviderProps> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'disconnected',
    message: 'Not connected',
    reconnectAttempts: 0
  });

  const [showLocationHistory, setShowLocationHistory] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState<string | null>(null);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  
  const locationHistoryRef = useRef<Map<string, Array<{ lat: number; lng: number; timestamp: string }>>>(new Map());
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    console.log('Received WebSocket message:', message);
    
    switch (message.type) {
      case 'connected':
        console.log('Connected to server:', message.data.message);
        if (message.data.features) {
          console.log('Server features:', message.data.features);
        }
        break;
        
      case 'employee_connected_confirmed':
        console.log('Employee connection confirmed:', message.data);
        break;
        
      case 'enhanced_location_update':
        console.log('Enhanced location update:', message.data);
        break;
        
      case 'location_broadcast':
        console.log('Location broadcast from client:', message.data.clientId);
        break;
        
      case 'pong':
        console.log('Server pong:', message.data.message);
        if (message.data.serverStatus) {
          console.log('Server status:', message.data.serverStatus);
        }
        break;
        
      case 'error':
        console.error('Server error:', message.data.message);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }, []);

  // Handle connection status changes
  const handleStatusChange = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
  }, []);

  // Connect employee to WebSocket
  const connectEmployee = useCallback(async (email: string) => {
    try {
      await websocketService.connect(email);
      setEmployeeEmail(email);
    } catch (error) {
      console.error('Failed to connect employee:', error);
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(async (email: string) => {
    try {
      await connectEmployee(email);
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }, [connectEmployee]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    websocketService.disconnect();
    setEmployeeEmail(null);
    setCurrentLocation(null);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLocationTracking(false);
  }, []);

  // Start location tracking
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation || !websocketService.isConnected()) {
      console.error('Geolocation not supported or not connected');
      return;
    }

    setIsLocationTracking(true);
    console.log('Starting location tracking...');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const location = { lat: latitude, lng: longitude, accuracy };
        
        setCurrentLocation(location);
        console.log('Location update:', location);
        
        // Store location history if enabled
        if (showLocationHistory) {
          const history = locationHistoryRef.current.get('current_employee') || [];
          history.push({
            lat: latitude,
            lng: longitude,
            timestamp: new Date().toISOString()
          });
          
          // Keep only last 50 locations
          if (history.length > 50) {
            history.splice(0, history.length - 50);
          }
          
          locationHistoryRef.current.set('current_employee', history);
        }
        
        // Send location to server
        websocketService.sendLocationUpdate({
          lat: latitude,
          lng: longitude,
          accuracy,
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        console.error('Location tracking error:', error);
        setIsLocationTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }, [showLocationHistory]);

  // Stop location tracking
  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    setIsLocationTracking(false);
    console.log('Location tracking stopped');
  }, []);

  // Clear location history
  const clearLocationHistory = useCallback(() => {
    locationHistoryRef.current.clear();
  }, []);

  // Simulate user location (for testing without WebSocket/geolocation)
  const simulateLocation = useCallback((loc: { lat: number; lng: number; accuracy?: number }) => {
    setCurrentLocation(loc);
    if (showLocationHistory) {
      const history = locationHistoryRef.current.get('current_employee') || [];
      history.push({ lat: loc.lat, lng: loc.lng, timestamp: new Date().toISOString() });
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }
      locationHistoryRef.current.set('current_employee', history);
    }
  }, [showLocationHistory]);

  // Setup WebSocket listeners
  useEffect(() => {
    const unsubscribeMessage = websocketService.onMessage(handleWebSocketMessage);
    const unsubscribeStatus = websocketService.onStatusChange(handleStatusChange);

    return () => {
      unsubscribeMessage();
      unsubscribeStatus();
    };
  }, [handleWebSocketMessage, handleStatusChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const value: RealTimeContextType = {
    connectionStatus,
    employeeEmail,
    setEmployeeEmail,
    connectEmployee,
    showLocationHistory,
    setShowLocationHistory,
    clearLocationHistory,
    connect,
    disconnect,
    isConnected: connectionStatus.status === 'connected',
    startLocationTracking,
    stopLocationTracking,
    isLocationTracking,
    currentLocation,
    simulateLocation
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};
