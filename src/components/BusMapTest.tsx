import React, { useEffect, useMemo, useState } from 'react';
import { Bus } from '../types';
import { BusMap } from './BusMap';
import { useRealTime } from '../context/RealTimeContext';

type Terminal = { id: string; name: string; lat: number; lng: number; address?: string };
type Route = { id: string; name: string; start_terminal_id: string; end_terminal_id: string; path: number[][] };

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

  // 10 mock buses seeded at each start terminal
  const [buses, setBuses] = useState<Bus[]>(() => {
    return Array.from({ length: 10 }).map((_, i) => {
      const start = terminals[i];
      return {
        id: `b-${i + 1}`,
        bus_number: `PINK-${(i + 1).toString().padStart(3, '0')}`,
        route_id: `r-${i + 1}`,
        current_location: { lat: start.lat, lng: start.lng },
        status: 'active',
        available_seats: 30,
        total_seats: 50,
        driver_id: null,
        conductor_id: null,
        terminal_id: terminals[i].id,
      };
    });
  });

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

  // Animate buses along their routes
  useEffect(() => {
    const timers = routes.map((route, i) => {
      let step = 0;
      return setInterval(() => {
        setBuses(prev => prev.map((b) => {
          if (b.id !== `b-${i + 1}`) return b;
          const p = route.path[step % route.path.length];
          return { ...b, current_location: { lat: p[0], lng: p[1] } };
        }));
        step += 1;
      }, 1200 + i * 80);
    });
    return () => { timers.forEach(clearInterval); };
  }, [routes]);

  // Convert minimal terminals to shape expected by BusMap lookups
  const terminalsForMap = terminals.map(t => ({ id: t.id, name: t.name, lat: t.lat, lng: t.lng }));
  const routesForMap = routes.map(r => ({ id: r.id, name: r.name, start_terminal_id: r.start_terminal_id, end_terminal_id: r.end_terminal_id, path: r.path }));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-800">BusMap Test Harness</h2>
        <p className="text-sm text-gray-600">Showing 10 mock buses, 10 routes, start/end terminals, user location, and connected polylines. Icons use /bus-icon.png and /user-pin.png.</p>
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


