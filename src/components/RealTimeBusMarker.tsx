import React from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';

interface BusData {
  busNumber: string;
  route: string;
  totalSeats: number;
  availableSeats: number;
  status: string;
  passengers: number;
}

interface RealTimeBusMarkerProps {
  bus: {
    location: {
      lat: number;
      lng: number;
      accuracy?: number;
    };
    busData: BusData;
    employeeEmail: string;
    clientId: string;
    timestamp: string;
  };
  icon: Icon;
  showLocationHistory: boolean;
  locationHistory?: Array<{ lat: number; lng: number }>;
}

export const RealTimeBusMarker: React.FC<RealTimeBusMarkerProps> = ({
  bus,
  icon,
  showLocationHistory,
  locationHistory = []
}) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return 'text-gray-600';
    if (accuracy <= 5) return 'text-green-600';
    if (accuracy <= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyLabel = (accuracy?: number) => {
    if (!accuracy) return 'Unknown';
    if (accuracy <= 5) return 'Excellent';
    if (accuracy <= 10) return 'Good';
    if (accuracy <= 20) return 'Fair';
    return 'Poor';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-red-600';
      case 'maintenance':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Marker
      position={[bus.location.lat, bus.location.lng] as LatLngExpression}
      icon={icon}
    >
      <Tooltip 
        direction="top" 
        offset={[0, -20]} 
        opacity={1} 
        permanent={false} 
        className="leaflet-tooltip-custom"
      >
        <div className="text-xs font-semibold text-pink-700">Bus {bus.busData.busNumber}</div>
        <div className="text-xs text-gray-700">
          {bus.busData.passengers}/{bus.busData.totalSeats} passengers
        </div>
        <div className="text-xs text-gray-500">
          {formatTimestamp(bus.timestamp)}
        </div>
      </Tooltip>

      <Popup>
        <div style={{ minWidth: 280 }} className="text-sm font-sans">
          {/* Header */}
          <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
            <img 
              src="https://maps.google.com/mapfiles/kml/shapes/bus.png" 
              alt="Bus" 
              className="w-8 h-8 mr-3" 
            />
            <div>
              <div className="font-bold text-pink-700 text-lg">Bus {bus.busData.busNumber}</div>
              <div className="text-sm text-gray-600">{bus.busData.route}</div>
            </div>
          </div>

          {/* Location Information */}
          <div className="mb-3">
            <div className="flex items-center mb-2">
              <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.657 16.657L13.414 12.414a2 2 0 0 0-2.828 0l-4.243 4.243"/>
                <path d="M7 7h.01"/>
                <path d="M17 7h.01"/>
              </svg>
              <span className="font-medium text-gray-700">GPS Coordinates</span>
            </div>
            <div className="ml-6 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Latitude:</span>
                <span className="font-mono text-gray-800">{bus.location.lat.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Longitude:</span>
                <span className="font-mono text-gray-800">{bus.location.lng.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Accuracy:</span>
                <span className={`font-medium ${getAccuracyColor(bus.location.accuracy)}`}>
                  {bus.location.accuracy ? `${bus.location.accuracy}m (${getAccuracyLabel(bus.location.accuracy)})` : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Update:</span>
                <span className="font-medium text-gray-800">{formatTimestamp(bus.timestamp)}</span>
              </div>
            </div>
          </div>

          {/* Bus Information */}
          <div className="mb-3">
            <div className="flex items-center mb-2">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="7" width="18" height="13" rx="2"/>
                <path d="M16 3v4M8 3v4"/>
              </svg>
              <span className="font-medium text-gray-700">Bus Details</span>
            </div>
            <div className="ml-6 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium capitalize ${getStatusColor(bus.busData.status)}`}>
                  {bus.busData.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Passengers:</span>
                <span className="font-medium text-gray-800">{bus.busData.passengers}/{bus.busData.totalSeats}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Available Seats:</span>
                <span className="font-medium text-gray-800">{bus.busData.availableSeats}</span>
              </div>
            </div>
          </div>

          {/* Employee Information */}
          <div className="mb-3">
            <div className="flex items-center mb-2">
              <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 20h5v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2h5"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="font-medium text-gray-700">Employee</span>
            </div>
            <div className="ml-6 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-800 truncate max-w-32">{bus.employeeEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Client ID:</span>
                <span className="font-mono text-gray-800 text-xs">{bus.clientId}</span>
              </div>
            </div>
          </div>

          {/* Location History Info */}
          {showLocationHistory && locationHistory.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center text-xs text-gray-500">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>Location trail available ({locationHistory.length} points)</span>
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};
