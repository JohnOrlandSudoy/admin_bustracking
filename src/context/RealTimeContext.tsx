import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

interface RealTimeContextType {
  // Controls
  showLocationHistory: boolean;
  setShowLocationHistory: (show: boolean) => void;
  clearLocationHistory: () => void;
  
  // Location tracking
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
  isLocationTracking: boolean;
  currentLocation: { lat: number; lng: number; accuracy?: number } | null;
  // Test/dev: simulate user location without geolocation
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
  const [showLocationHistory, setShowLocationHistory] = useState(false);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  
  const locationHistoryRef = useRef<Map<string, Array<{ lat: number; lng: number; timestamp: string }>>>(new Map());
  const watchIdRef = useRef<number | null>(null);

  // Start location tracking
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
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

  // Simulate user location (for testing without geolocation)
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const value: RealTimeContextType = {
    showLocationHistory,
    setShowLocationHistory,
    clearLocationHistory,
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
