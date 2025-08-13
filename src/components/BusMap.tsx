import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
import { Bus } from '../types';
import { useRealTime } from '../context/RealTimeContext';
import { LocationTrail } from './LocationTrail';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import { LocationHistoryControls } from './LocationHistoryControls';
import { EmployeeConnectionPanel } from './EmployeeConnectionPanel';
// @ts-ignore: If Employee is not exported, define a fallback type
type Employee = any;
import 'leaflet/dist/leaflet.css';

interface BusMapProps {
  buses: Bus[];
  routes: any[];
  terminals: any[];
  assignedEmployees: Record<string, Employee>;
}

// Custom bus icon
const busIcon = new Icon({
  iconUrl: 'https://maps.google.com/mapfiles/kml/shapes/bus.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Special icon for current employee's bus
const currentEmployeeBusIcon = new Icon({
  iconUrl: 'https://maps.google.com/mapfiles/kml/shapes/bus.png',
  iconSize: [40, 40], // Larger icon for current employee
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const terminalIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const MapContent: React.FC<BusMapProps> = ({ buses, routes, terminals, assignedEmployees }) => {
  const map = useMap();
  const { showLocationHistory, currentLocation } = useRealTime();
  const locationHistoryRef = useRef<Map<string, Array<{ lat: number; lng: number; timestamp: string }>>>(new Map());

  // Helper functions
  const getTerminal = (id: string) => terminals.find((t: any) => t.id === id);
  const getRoute = (id: string) => routes.find((r: any) => r.id === id);

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
    const allBuses = [...buses];
    if (currentLocation) {
      allBuses.push({ current_location: currentLocation } as any);
    }
    
    if (allBuses.length > 0) {
      const validBuses = allBuses.filter(bus => {
        if ('current_location' in bus) {
          // Current location
          return bus.current_location && 
                 bus.current_location.lat !== 0 && 
                 bus.current_location.lng !== 0;
        } else {
          // Static bus
          return bus.current_location && 
                 bus.current_location.lat !== 0 && 
                 bus.current_location.lng !== 0;
        }
      });

      if (validBuses.length === 1) {
        const bus = validBuses[0];
        if (bus.current_location) {
          const lat = bus.current_location.lat;
          const lng = bus.current_location.lng;
          map.setView([lat, lng] as LatLngExpression, 15);
        }
      } else if (validBuses.length > 1) {
        const latLngs = validBuses.map(bus => {
          if (bus.current_location) {
            return [bus.current_location.lat, bus.current_location.lng] as [number, number];
          }
          return [0, 0] as [number, number];
        }).filter(([lat, lng]) => lat !== 0 && lng !== 0);
        
        if (latLngs.length > 0) {
          map.fitBounds(latLngs);
        }
      }
    }
  }, [buses, currentLocation, map]);

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Draw routes as polylines */}
      {buses.map(bus => {
        const route = getRoute(bus.route_id);
        if (!route || !Array.isArray(route.path) || route.path.length === 0) return null;
        // Only use points with valid lat/lng
        const validPath = route.path.filter((pt: any) => Array.isArray(pt) && pt.length === 2 && typeof pt[0] === 'number' && typeof pt[1] === 'number');
        if (validPath.length < 2) return null;
        return (
          <Polyline
            key={bus.id + '-route'}
            positions={validPath}
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
        const startTerminal = getTerminal(route.start_terminal_id);
        const endTerminal = getTerminal(route.end_terminal_id);
        return (
          <React.Fragment key={bus.id + '-terminals'}>
            {startTerminal && typeof startTerminal.lat === 'number' && typeof startTerminal.lng === 'number' && (
              <Marker position={[startTerminal.lat, startTerminal.lng]} icon={terminalIcon}>
                <Popup>
                  <b>Start Terminal:</b> {startTerminal.name}
                </Popup>
              </Marker>
            )}
            {endTerminal && typeof endTerminal.lat === 'number' && typeof endTerminal.lng === 'number' && (
              <Marker position={[endTerminal.lat, endTerminal.lng]} icon={terminalIcon}>
                <Popup>
                  <b>End Terminal:</b> {endTerminal.name}
                </Popup>
              </Marker>
            )}
          </React.Fragment>
        );
      })}

      {/* Static bus markers with detailed popups */}
      {buses.map(bus => {
        // Use bus current_location if available, else fallback to terminal location
        let lat: number | undefined = undefined;
        let lng: number | undefined = undefined;
        if (bus.current_location && typeof bus.current_location.lat === 'number' && typeof bus.current_location.lng === 'number') {
          lat = bus.current_location.lat;
          lng = bus.current_location.lng;
        } else if (bus.terminal_id) {
          const terminal = getTerminal(bus.terminal_id);
          if (terminal && typeof terminal.lat === 'number' && typeof terminal.lng === 'number') {
            lat = terminal.lat;
            lng = terminal.lng;
          }
        }
        if (typeof lat !== 'number' || typeof lng !== 'number') return null;
        const driver = bus.driver_id ? assignedEmployees[bus.driver_id] : null;
        const route = getRoute(bus.route_id);
        const terminal = bus.terminal_id ? getTerminal(bus.terminal_id) : null;
        return (
          <Marker
            key={bus.id}
            position={[lat, lng] as LatLngExpression}
            icon={busIcon}
          >
            <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false} className="leaflet-tooltip-custom">
              <div className="text-xs font-semibold text-pink-700">Bus {bus.bus_number}</div>
              <div className="text-xs text-gray-700">Seats: {bus.available_seats}/{bus.total_seats}</div>
            </Tooltip>
            <Popup>
              <div style={{ minWidth: 220 }} className="text-sm font-sans">
                <div className="flex items-center mb-2">
                  <img src="https://maps.google.com/mapfiles/kml/shapes/bus.png" alt="Bus" className="w-6 h-6 mr-2" />
                  <span className="font-bold text-pink-700 text-base">Bus {bus.bus_number}</span>
                </div>
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2h5"/><circle cx="12" cy="7" r="4"/></svg>
                  <span className="text-gray-700">Driver:</span>
                  <span className="ml-1 font-medium text-gray-900">{driver ? driver.profile.fullName : 'Not assigned'}</span>
                </div>
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4"/></svg>
                  <span className="text-gray-700">Seats:</span>
                  <span className="ml-1 font-medium text-gray-900">{bus.available_seats}/{bus.total_seats}</span>
                </div>
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 12.414a2 2 0 0 0-2.828 0l-4.243 4.243"/><path d="M7 7h.01"/><path d="M17 7h.01"/></svg>
                  <span className="text-gray-700">Terminal:</span>
                  <span className="ml-1 font-medium text-gray-900">{terminal ? terminal.name : 'Not assigned'}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19V6M5 12l7-7 7 7"/></svg>
                  <span className="text-gray-700">Route:</span>
                  <span className="ml-1 font-medium text-gray-900">{route ? route.name : 'Not assigned'}</span>
                </div>
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
                  src="https://maps.google.com/mapfiles/kml/shapes/bus.png" 
                  alt="Bus" 
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
                    <span className="text-gray-600">Longitude:</span>
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
  const { isConnected, employeeEmail, currentLocation } = useRealTime();

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

      {/* Control Panel */}
      {showControls && (
        <div className="absolute top-16 right-4 z-10 w-80 space-y-4">
          <EmployeeConnectionPanel />
          <ConnectionStatusIndicator />
          <LocationHistoryControls />
        </div>
      )}

      {/* Connection Status Badge */}
      {!isConnected && (
        <div className="absolute top-4 left-4 z-10 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Not connected to real-time server</span>
          </div>
        </div>
      )}

      {/* Employee Status Badge */}
      {employeeEmail && (
        <div className="absolute top-16 left-4 z-10 bg-green-100 border border-green-300 text-green-700 px-3 py-2 rounded-lg text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Connected as: {employeeEmail}</span>
          </div>
        </div>
      )}

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