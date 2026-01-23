import React, { useEffect, useMemo, useState } from 'react';
import { Bus } from '../types';
import { BusMap } from './BusMap';
import { useRealTime } from '../context/RealTimeContext';

type Terminal = { id: string; name: string; lat: number; lng: number; address?: string };
type Route = { id: string; name: string; start_terminal_id: string; end_terminal_id: string; path: number[][] };

// API response type for bus locations
type BusLocationResponse = {
  busId: string;
  latest: {
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    employeeId?: string;
    timestamp: string;
  };
};

// Generate a simple polyline path between two points
const generatePath = (start: { lat: number; lng: number }, end: { lat: number; lng: number }, steps: number = 20): number[][] => {
  const path: number[][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    path.push([
      start.lat + (end.lat - start.lat) * t,
      start.lng + (end.lng - start.lng) * t
    ]);
  }
  return path;
};

export const BusMapTest: React.FC = () => {
  const { simulateLocation, setShowLocationHistory } = useRealTime();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Base area: around Quezon City coordinates (same as default center)
  const base = { lat: 14.703002, lng: 121.064653 };

  // Create 10 terminals around the base location
  const terminals: Terminal[] = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => {
      const angle = (i / 10) * 2 * Math.PI;
      const dLat = 0.01 * Math.sin(angle);
      const dLng = 0.01 * Math.cos(angle);
      return {
        id: `t-${i + 1}`,
        name: `Terminal ${i + 1}`,
        lat: base.lat + dLat,
        lng: base.lng + dLng,
        address: `Address ${i + 1}`,
      };
    });
  }, []);

  // Create 10 routes connecting consecutive terminals with a path
  const routes: Route[] = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => {
      const start = terminals[i];
      const end = terminals[(i + 1) % terminals.length];
      return {
        id: `r-${i + 1}`,
        name: `Route ${i + 1}`,
        start_terminal_id: start.id,
        end_terminal_id: end.id,
        path: generatePath({ lat: start.lat, lng: start.lng }, { lat: end.lat, lng: end.lng }, 25),
      };
    });
  }, [terminals]);

  // Fetch bus locations from API
  useEffect(() => {
    const fetchBusLocations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const employeeBase = (import.meta.env.VITE_EMPLOYEE_SERVER_URL as string) || 'https://employee-server-89en.onrender.com';
        const response = await fetch(`${employeeBase}/api/admin/locations`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: BusLocationResponse[] = await response.json();
        
        // Transform API data to Bus type
        const transformedBuses: Bus[] = data.map((busLocation, index) => ({
          id: busLocation.busId,
          bus_number: `BUS-${(index + 1).toString().padStart(3, '0')}`,
          route_id: `r-${(index % 10) + 1}`, // Assign to one of the 10 routes
          current_location: { 
            lat: busLocation.latest.lat, 
            lng: busLocation.latest.lng 
          },
          status: 'active',
          available_seats: 30,
          total_seats: 50,
          driver_id: busLocation.latest.employeeId || null,
          conductor_id: null,
          terminal_id: terminals[index % terminals.length]?.id || terminals[0].id,
        }));
        
        setBuses(transformedBuses);
      } catch (err) {
        console.error('Error fetching bus locations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch bus locations');
      } finally {
        setLoading(false);
      }
    };

    fetchBusLocations();
    
    // Set up polling every 30 seconds to refresh bus locations
    const interval = setInterval(fetchBusLocations, 30000);
    
    return () => clearInterval(interval);
  }, [terminals]);

  // Simulate user location moving along first route
  useEffect(() => {
    setShowLocationHistory(true);
    const route0 = routes[0];
    let idx = 0;
    const interval = setInterval(() => {
      const [lat, lng] = route0.path[idx % route0.path.length];
      simulateLocation({ lat, lng, accuracy: 5 });
      idx += 1;
    }, 1000);
    return () => clearInterval(interval);
  }, [routes, simulateLocation, setShowLocationHistory]);

  // Convert minimal terminals to shape expected by BusMap lookups
  const terminalsForMap = terminals.map(t => ({ id: t.id, name: t.name, lat: t.lat, lng: t.lng }));
  const routesForMap = routes.map(r => ({ id: r.id, name: r.name, start_terminal_id: r.start_terminal_id, end_terminal_id: r.end_terminal_id, path: r.path }));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-800">BusMap Test Harness</h2>
          <p className="text-sm text-gray-600">Loading bus locations from API...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-800">BusMap Test Harness</h2>
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">Error: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-800">BusMap Test Harness</h2>
        <p className="text-sm text-gray-600">
          Showing {buses.length} real buses from API, 10 routes, start/end terminals, user location, and connected polylines. 
          Icons use /bus-icon.png and /user-pin.png. Data refreshes every 30 seconds.
        </p>
        <div className="mt-2 text-xs text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
      <BusMap
        buses={buses}
        routes={routesForMap as any}
        terminals={terminalsForMap as any}
        assignedEmployees={{}}
      />
    </div>
  );
};


