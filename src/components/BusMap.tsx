import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
import { Bus } from '../types';
import { useRealTime } from '../context/RealTimeContext';
import { LocationTrail } from './LocationTrail';
import 'leaflet/dist/leaflet.css';

interface BusMapProps {
  buses: Bus[];
  routes: any[];
  terminals: any[];
  assignedEmployees: Record<string, any>;
}

// API response type for real-time bus locations
interface BusLocationResponse {
  busId: string;
  latest: {
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    employeeId?: string;
    timestamp: string;
  };
}

// Custom bus icon (local asset in public folder)
const busIcon = new Icon({
  iconUrl: '/bus-icon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Special icon for current employee (user location)
const currentEmployeeBusIcon = new Icon({
  iconUrl: '/user-pin.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -20],
});

const startTerminalIcon = new Icon({
  iconUrl: '/start-terminal.png',
  iconSize: [40, 40],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const endTerminalIcon = new Icon({
  iconUrl: '/end-terminal.png',
  iconSize: [40, 40],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const MapContent: React.FC<BusMapProps> = ({ buses, routes, terminals, assignedEmployees }) => {
  const map = useMap();
  const { showLocationHistory, currentLocation } = useRealTime();
  const locationHistoryRef = useRef<Map<string, Array<{ lat: number; lng: number; timestamp: string }>>>(new Map());
  const [realTimeBusLocations, setRealTimeBusLocations] = useState<Record<string, { lat: number; lng: number }>>({});
  const [terminalCoordinates, setTerminalCoordinates] = useState<Record<string, { lat: number; lng: number }>>({});

  // Helper functions
  const getTerminal = (id: string) => terminals.find((t: any) => t.id === id);
  const getRoute = (id: string) => routes.find((r: any) => r.id === id);

  // Function to search for terminal coordinates using Google Geocoding API
  const searchTerminalCoordinates = async (terminalName: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // For now, we'll use a simple mapping of known terminals
      // In a real implementation, you would use Google Geocoding API or similar
      const knownTerminals: Record<string, { lat: number; lng: number }> = {
        'Cabanatuan Central Transport Terminal': { lat: 15.4865, lng: 120.9675 },
        'Baler Central Terminal': { lat: 15.7583, lng: 121.5608 },
        'Manila Central Terminal': { lat: 14.5995, lng: 120.9842 },
        'Quezon City Central Terminal': { lat: 14.6760, lng: 121.0437 },
        'Makati Central Terminal': { lat: 14.5547, lng: 121.0244 },
        'Pasig Central Terminal': { lat: 14.5764, lng: 121.0851 },
        'Marikina Central Terminal': { lat: 14.6507, lng: 121.1029 },
        'Antipolo Central Terminal': { lat: 14.6255, lng: 121.1245 },
        'Cainta Central Terminal': { lat: 14.5786, lng: 121.1221 },
        'Taytay Central Terminal': { lat: 14.5692, lng: 121.1325 }
      };

      // Check if we have known coordinates for this terminal
      if (knownTerminals[terminalName]) {
        return knownTerminals[terminalName];
      }

      // If not found, try to find a partial match
      for (const [knownName, coords] of Object.entries(knownTerminals)) {
        if (terminalName.toLowerCase().includes(knownName.toLowerCase().split(' ')[0]) ||
            knownName.toLowerCase().includes(terminalName.toLowerCase().split(' ')[0])) {
          return coords;
        }
      }

      // Default fallback coordinates (center of Philippines)
      return { lat: 12.8797, lng: 121.7740 };
    } catch (error) {
      console.error('Error searching for terminal coordinates:', error);
      return null;
    }
  };

  // Fetch real-time bus locations from API
  useEffect(() => {
    const fetchRealTimeLocations = async () => {
      try {
        const employeeBase = (import.meta.env.VITE_EMPLOYEE_SERVER_URL as string) || 'https://employee-server-89en.onrender.com';
        const response = await fetch(`${employeeBase}/api/admin/locations`);
        if (response.ok) {
          const data: BusLocationResponse[] = await response.json();
          const locations: Record<string, { lat: number; lng: number }> = {};
          
          data.forEach(item => {
            locations[item.busId] = {
              lat: item.latest.lat,
              lng: item.latest.lng
            };
          });
          
          setRealTimeBusLocations(locations);
        }
      } catch (error) {
        console.error('Error fetching real-time bus locations:', error);
      }
    };

    fetchRealTimeLocations();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchRealTimeLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  // Search for terminal coordinates when terminals change
  useEffect(() => {
    const searchTerminals = async () => {
      const coords: Record<string, { lat: number; lng: number }> = {};
      
      for (const terminal of terminals) {
        if (terminal.name) {
          const terminalCoords = await searchTerminalCoordinates(terminal.name);
          if (terminalCoords) {
            coords[terminal.id] = terminalCoords;
          }
        }
      }
      
      setTerminalCoordinates(coords);
    };

    if (terminals.length > 0) {
      searchTerminals();
    }
  }, [terminals]);

  // Update location history for current employee
  useEffect(() => {
    if (showLocationHistory && currentLocation) {
      const history = locationHistoryRef.current.get('current_employee') || [];
      history.push({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 50 locations
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }
      
      locationHistoryRef.current.set('current_employee', history);
    }
  }, [showLocationHistory, currentLocation]);

  // Auto-fit map to show all buses and current location
  useEffect(() => {
    const latLngs: Array<[number, number]> = [];

    // Add bus positions (use real-time locations if available)
    for (const bus of buses) {
      const realTimeLoc = realTimeBusLocations[bus.id];
      if (realTimeLoc) {
        latLngs.push([realTimeLoc.lat, realTimeLoc.lng]);
      } else if (bus.current_location && typeof bus.current_location.lat === 'number' && typeof bus.current_location.lng === 'number' && bus.current_location.lat !== 0 && bus.current_location.lng !== 0) {
        latLngs.push([bus.current_location.lat, bus.current_location.lng]);
      }
    }

    // Add current user location
    if (currentLocation && currentLocation.lat !== 0 && currentLocation.lng !== 0) {
      latLngs.push([currentLocation.lat, currentLocation.lng]);
    }

    if (latLngs.length === 1) {
      map.setView(latLngs[0] as LatLngExpression, 15);
    } else if (latLngs.length > 1) {
      map.fitBounds(latLngs);
    }
  }, [buses, realTimeBusLocations, currentLocation, map]);

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Draw routes as polylines between start and end terminals */}
      {buses.map(bus => {
        const route = getRoute(bus.route_id);
        if (!route) return null;
        
        // Get start and end terminal coordinates
        const startTerminal = route.start_terminal_id ? getTerminal(route.start_terminal_id) : null;
        const endTerminal = route.end_terminal_id ? getTerminal(route.end_terminal_id) : null;
        
        if (!startTerminal || !endTerminal) return null;
        
        const startCoords = terminalCoordinates[startTerminal.id];
        const endCoords = terminalCoordinates[endTerminal.id];
        
        if (!startCoords || !endCoords) return null;
        
        // Create a simple path between terminals
        const positions: [number, number][] = [
          [startCoords.lat, startCoords.lng],
          [endCoords.lat, endCoords.lng]
        ];
        
        return (
          <Polyline
            key={bus.id + '-route'}
            positions={positions}
            color="blue"
            weight={4}
            opacity={0.7}
          />
        );
      })}

      {/* Markers for start and end terminals */}
      {buses.map(bus => {
        const route = getRoute(bus.route_id);
        if (!route) return null;
        
        const startTerminal = route.start_terminal_id ? getTerminal(route.start_terminal_id) : null;
        const endTerminal = route.end_terminal_id ? getTerminal(route.end_terminal_id) : null;
        
        if (!startTerminal || !endTerminal) return null;
        
        const startCoords = terminalCoordinates[startTerminal.id];
        const endCoords = terminalCoordinates[endTerminal.id];
        
        if (!startCoords || !endCoords) return null;
        
        return (
          <React.Fragment key={bus.id + '-terminals'}>
            <Marker position={[startCoords.lat, startCoords.lng]} icon={startTerminalIcon}>
              <Popup>
                <b>Start Terminal:</b> {startTerminal.name}
              </Popup>
            </Marker>
            <Marker position={[endCoords.lat, endCoords.lng]} icon={endTerminalIcon}>
              <Popup>
                <b>End Terminal:</b> {endTerminal.name}
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}

      {/* Bus markers with real-time locations */}
      {buses.map((bus, idx) => {
        // Use real-time location if available, otherwise fallback to current_location or terminal
        let lat: number | undefined = undefined;
        let lng: number | undefined = undefined;
        
        const realTimeLoc = realTimeBusLocations[bus.id];
        if (realTimeLoc) {
          lat = realTimeLoc.lat;
          lng = realTimeLoc.lng;
        } else if (bus.current_location && typeof bus.current_location.lat === 'number' && typeof bus.current_location.lng === 'number') {
          lat = bus.current_location.lat;
          lng = bus.current_location.lng;
        } else if (bus.terminal_id) {
          const terminal = getTerminal(bus.terminal_id);
          if (terminal && terminalCoordinates[terminal.id]) {
            lat = terminalCoordinates[terminal.id].lat;
            lng = terminalCoordinates[terminal.id].lng;
          }
        }
        
        // Final fallback: place near map center
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          const center = map.getCenter();
          const jitterRadius = 0.001;
          const angle = (idx * 2 * Math.PI) / Math.max(buses.length, 1);
          lat = center.lat + jitterRadius * Math.cos(angle);
          lng = center.lng + jitterRadius * Math.sin(angle);
        }
        
        const driver = bus.driver_id ? assignedEmployees[bus.driver_id] : null;
        const conductor = bus.conductor_id ? assignedEmployees[bus.conductor_id] : null;
        const route = getRoute(bus.route_id);
        const terminal = bus.terminal_id ? getTerminal(bus.terminal_id) : null;
        const startTerminal = route?.start_terminal_id ? getTerminal(route.start_terminal_id) : null;
        const endTerminal = route?.end_terminal_id ? getTerminal(route.end_terminal_id) : null;
        
        return (
          <Marker
            key={bus.id}
            position={[lat, lng] as LatLngExpression}
            icon={busIcon}
          >
            <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false} className="leaflet-tooltip-custom">
              <div className="text-xs font-semibold text-pink-700">Bus {bus.bus_number}</div>
              <div className="text-xs text-gray-700">Seats: {bus.available_seats}/{bus.total_seats}</div>
              {realTimeLoc && (
                <div className="text-xs text-green-600">📍 Real-time</div>
              )}
            </Tooltip>
            <Popup>
              <div style={{ minWidth: 220 }} className="text-sm font-sans">
                <div className="flex items-center mb-2">
                  <img src="/bus-icon.png" alt="Bus" className="w-6 h-6 mr-2" />
                  <span className="font-bold text-pink-700 text-base">Bus {bus.bus_number}</span>
                  {realTimeLoc && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">📍 Real-time</span>
                  )}
                </div>
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2h5"/><circle cx="12" cy="7" r="4"/></svg>
                  <span className="text-gray-700">Driver:</span>
                  <span className="ml-1 font-medium text-gray-900">{driver ? driver.profile?.fullName || driver.name || 'Not assigned' : 'Not assigned'}</span>
                </div>
                {driver && (
                  <div className="ml-5 mb-1 text-xs text-gray-600 space-y-0.5">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4z" fill="none"/><path d="M22 6l-10 7L2 6"/></svg>
                      <span>{driver.email}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92V21a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2 3.18 2 2 0 0 1 4 1h4.09a2 2 0 0 1 2 1.72c.12.81.3 1.6.54 2.36a2 2 0 0 1-.45 2.11L9.1 8.9a16 16 0 0 0 6 6l1.71-1.08a2 2 0 0 1 2.11-.45c.76.24 1.55.42 2.36.54A2 2 0 0 1 22 16.92z"/></svg>
                      <span>{driver.profile?.phone || driver.phone}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 mr-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg>
                  <span className="text-gray-700">Status:</span>
                  <span className="ml-1 font-medium text-gray-900">{bus.status}</span>
                </div>
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4"/></svg>
                  <span className="text-gray-700">Seats:</span>
                  <span className="ml-1 font-medium text-gray-900">{bus.available_seats}/{bus.total_seats}</span>
                </div>
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 mr-1 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2h5"/><circle cx="12" cy="7" r="4"/></svg>
                  <span className="text-gray-700">Conductor:</span>
                  <span className="ml-1 font-medium text-gray-900">{conductor ? conductor.profile?.fullName || conductor.name || 'Not assigned' : 'Not assigned'}</span>
                </div>
                {conductor && (
                  <div className="ml-5 mb-1 text-xs text-gray-600 space-y-0.5">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4z" fill="none"/><path d="M22 6l-10 7L2 6"/></svg>
                      <span>{conductor.email}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92V21a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2 3.18 2 2 0 0 1 4 1h4.09a2 2 0 0 1 2 1.72c.12.81.3 1.6.54 2.36a2 2 0 0 1-.45 2.11L9.1 8.9a16 16 0 0 0 6 6l1.71-1.08a2 2 0 0 1 2.11-.45c.76.24 1.55.42 2.36.54A2 2 0 0 1 22 16.92z"/></svg>
                      <span>{conductor.profile?.phone || conductor.phone}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 12.414a2 2 0 0 0-2.828 0l-4.243 4.243"/><path d="M7 7h.01"/><path d="M17 7h.01"/></svg>
                  <span className="text-gray-700">Terminal:</span>
                  <span className="ml-1 font-medium text-gray-900">{terminal ? terminal.name : 'Not assigned'}</span>
                </div>
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 mr-1 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19V6M5 12l7-7 7 7"/></svg>
                  <span className="text-gray-700">Route:</span>
                  <span className="ml-1 font-medium text-gray-900">{route ? route.name : 'Not assigned'}</span>
                </div>
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l7 7-7 7-7-7 7-7z"/></svg>
                  <span className="text-gray-700">Start Terminal:</span>
                  <span className="ml-1 font-medium text-gray-900">{startTerminal ? startTerminal.name : 'Not assigned'}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l7 7-7 7-7-7 7-7z"/></svg>
                  <span className="text-gray-700">End Terminal:</span>
                  <span className="ml-1 font-medium text-gray-900">{endTerminal ? endTerminal.name : 'Not assigned'}</span>
                </div>
                {realTimeLoc && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <div className="text-xs text-green-600 font-medium">
                      📍 Real-time location: {realTimeLoc.lat.toFixed(6)}, {realTimeLoc.lng.toFixed(6)}
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Current Employee Bus Marker (highlighted) - Using actual GPS coordinates */}
      {currentLocation && (
        <Marker
          key="current-employee-bus"
          position={[currentLocation.lat, currentLocation.lng] as LatLngExpression}
          icon={currentEmployeeBusIcon}
        >
          <Tooltip 
            direction="top" 
            offset={[0, -25]} 
            opacity={1} 
            permanent={false} 
            className="leaflet-tooltip-custom"
          >
            <div className="text-xs font-semibold text-green-700">🚌 LIVE TRACKING</div>
            <div className="text-xs text-gray-700">
              Your Current Location
            </div>
            <div className="text-xs text-gray-500">
              {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </div>
          </Tooltip>
          <Popup>
            <div style={{ minWidth: 280 }} className="text-sm font-sans">
              <div className="flex items-center mb-3 pb-2 border-b border-green-200">
                <img 
                  src="/user-pin.png" 
                  alt="You" 
                  className="w-8 h-8 mr-3" 
                />
                <div>
                  <div className="font-bold text-green-700 text-lg">🚌 LIVE TRACKING</div>
                  <div className="text-sm text-gray-600">Your Current Location</div>
                  <div className="text-xs text-green-600 font-medium">Real-time GPS Updates</div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.657 16.657L13.414 12.414a2 2 0 0 0-2.828 0l-4.243 4.243"/>
                  </svg>
                  <span className="font-medium text-gray-700">GPS Coordinates</span>
                </div>
                <div className="ml-6 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Latitude:</span>
                    <span className="font-mono text-gray-800">{currentLocation.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Longitude:</span>
                    <span className="font-mono text-gray-800">{currentLocation.lng.toFixed(6)}</span>
                  </div>
                  {currentLocation.accuracy && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Accuracy:</span>
                      <span className="font-medium text-gray-800">{currentLocation.accuracy.toFixed(1)}m</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Update:</span>
                    <span className="font-medium text-gray-800">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-green-200">
                <div className="text-xs text-green-600 font-medium">
                  ✅ Live tracking active - Your position updates in real-time
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Location trail for current employee bus */}
      {showLocationHistory && currentLocation && (() => {
        const history = locationHistoryRef.current.get('current_employee') || [];
        if (history.length < 2) return null;
        
        return (
          <LocationTrail
            key="trail-current-employee"
            busNumber="LIVE TRACKING"
            locations={history}
            color="#10B981"
            weight={4}
            opacity={0.8}
          />
        );
      })()}
    </>
  );
};

export const BusMap: React.FC<BusMapProps> = ({ buses, routes, terminals, assignedEmployees }) => {
  const [showControls, setShowControls] = useState(false);
  const { currentLocation } = useRealTime();

  return (
    <div className="relative">
      {/* Map Container */}
      <div className="h-96 rounded-lg overflow-hidden shadow-md relative z-0">
        <MapContainer
          center={[14.703002, 121.064653] as LatLngExpression} // Center on your actual GPS coordinates
          zoom={15}
          className="w-full h-full"
          zoomControl={true}
          attributionControl={true}
        >
          <MapContent
            buses={buses}
            routes={routes}
            terminals={terminals}
            assignedEmployees={assignedEmployees}
          />
        </MapContainer>
      </div>

      {/* Control Panel Toggle */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="absolute top-4 right-4 z-10 bg-white p-2 rounded-lg shadow-md border hover:bg-gray-50 transition-colors"
        title="Toggle Control Panel"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Live Tracking Status */}
      {currentLocation && (
        <div className="absolute top-4 left-4 z-10 bg-white border border-green-300 text-green-700 px-3 py-2 rounded-lg text-sm shadow-md">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>🚌 Live Tracking</span>
          </div>
        </div>
      )}
    </div>
  );
};