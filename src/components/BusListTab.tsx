import React, { useState, useEffect } from 'react';
import { Bus } from '../types';
import { busAPI, terminalAPI, routeAPI } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import { Search, Filter, Bus as BusIcon, Users, MapPin, Settings, Plus, Map, Clock } from 'lucide-react';

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

// Location data with address
interface LocationData {
  lat: number;
  lng: number;
  address: string;
  timestamp: string;
  accuracy?: number;
}

export const BusListTab: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [filteredBuses, setFilteredBuses] = useState<Bus[]>([]);
  const [terminals, setTerminals] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [realTimeLocations, setRealTimeLocations] = useState<Record<string, LocationData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'maintenance'>('all');
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  useEffect(() => {
    fetchData();
    fetchRealTimeLocations();
  }, []);

  useEffect(() => {
    filterBuses();
  }, [buses, searchTerm, statusFilter]);

  // Fetch real-time bus locations from API
  const fetchRealTimeLocations = async () => {
    try {
      const response = await fetch('https://employee-server-89en.onrender.com/api/admin/locations');
      if (response.ok) {
        const data: BusLocationResponse[] = await response.json();
        const locations: Record<string, LocationData> = {};
        
        // Process each bus location and get address
        for (const item of data) {
          const address = await getAddressFromCoordinates(item.latest.lat, item.latest.lng);
          locations[item.busId] = {
            lat: item.latest.lat,
            lng: item.latest.lng,
            address: address,
            timestamp: item.latest.timestamp,
            accuracy: item.latest.accuracy
          };
        }
        
        setRealTimeLocations(locations);
      }
    } catch (error) {
      console.error('Error fetching real-time bus locations:', error);
    }
  };

  // Function to get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      // Use OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          return data.display_name;
        }
      }
      
      // Fallback to coordinates if geocoding fails
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      // Fallback to coordinates
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch buses, terminals, and routes in parallel
      const [busesResponse, terminalsResponse, routesResponse] = await Promise.all([
        busAPI.getBuses(),
        terminalAPI.getTerminals(),
        routeAPI.getRoutes()
      ]);
      
      setBuses(busesResponse.data);
      setTerminals(terminalsResponse.data);
      setRoutes(routesResponse.data);
    } catch (err) {
      setError('Failed to fetch bus data. Please try again.');
      console.error('Error fetching bus data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterBuses = () => {
    let filtered = buses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(bus =>
        bus.bus_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bus => bus.status === statusFilter);
    }

    setFilteredBuses(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTerminalName = (terminalId: string | null) => {
    if (!terminalId) return 'Not assigned';
    const terminal = terminals.find(t => t.id === terminalId);
    return terminal ? terminal.name : 'Unknown';
  };

  const getRouteName = (routeId: string | null) => {
    if (!routeId) return 'Not assigned';
    const route = routes.find(r => r.id === routeId);
    return route ? route.name : 'Unknown';
  };

  const getBusLocation = (busId: string) => {
    const realTimeLoc = realTimeLocations[busId];
    if (realTimeLoc) {
      return {
        ...realTimeLoc,
        isRealTime: true
      };
    }
    
    // Fallback to stored location if no real-time data
    const bus = buses.find(b => b.id === busId);
    if (bus?.current_location) {
      return {
        lat: bus.current_location.lat,
        lng: bus.current_location.lng,
        address: `${bus.current_location.lat.toFixed(6)}, ${bus.current_location.lng.toFixed(6)}`,
        timestamp: new Date().toISOString(),
        isRealTime: false
      };
    }
    
    return null;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handleRefresh = () => {
    fetchData();
    fetchRealTimeLocations();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BusIcon className="h-6 w-6 mr-2 text-pink-600" />
            All Buses
          </h2>
          <p className="text-gray-600 mt-1">
            Manage and view all buses in your fleet ({filteredBuses.length} of {buses.length} buses)
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 flex items-center"
          >
            <Settings className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by bus number or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bus List Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bus Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Real-Time Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBuses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <BusIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No buses found</p>
                    <p className="text-sm">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria'
                        : 'No buses have been registered yet'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBuses.map((bus) => {
                  const locationData = getBusLocation(bus.id);
                  
                  return (
                    <tr key={bus.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <BusIcon className="h-8 w-8 text-pink-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {bus.bus_number}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {bus.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bus.status)}`}>
                          {bus.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {bus.available_seats}/{bus.total_seats}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {((bus.available_seats / bus.total_seats) * 100).toFixed(0)}% available
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-xs">Terminal: {getTerminalName(bus.terminal_id)}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-xs">Route: {getRouteName(bus.route_id)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {locationData ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              {locationData.isRealTime ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                                  Live
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Stored
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center text-xs text-gray-600">
                                <Map className="h-3 w-3 mr-1" />
                                <span className="truncate max-w-48" title={locationData.address}>
                                  {locationData.address}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatTimestamp(locationData.timestamp)}
                              </div>
                              {locationData.accuracy && (
                                <div className="text-xs text-blue-600">
                                  Accuracy: ±{locationData.accuracy.toFixed(1)}m
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <Map className="h-4 w-4 mr-1" />
                            <span className="text-xs">No location data</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedBus(bus)}
                          className="text-pink-600 hover:text-pink-900 transition-colors duration-150"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bus Details Modal */}
      {selectedBus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center">
                <BusIcon className="h-5 w-5 mr-2 text-pink-600" />
                Bus Details: {selectedBus.bus_number}
              </h3>
              <button
                onClick={() => setSelectedBus(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus ID</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedBus.id}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Number</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedBus.bus_number}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBus.status)}`}>
                    {selectedBus.status}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedBus.available_seats} available / {selectedBus.total_seats} total seats
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Terminal</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{getTerminalName(selectedBus.terminal_id)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{getRouteName(selectedBus.route_id)}</p>
                </div>
              </div>
            </div>

            {/* Location Information */}
            {(() => {
              const locationData = getBusLocation(selectedBus.id);
              if (locationData) {
                return (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <Map className="h-4 w-4 mr-2" />
                      Current Location
                    </h4>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Coordinates</label>
                          <p className="text-sm text-gray-900 font-mono">
                            {locationData.lat.toFixed(6)}, {locationData.lng.toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Last Update</label>
                          <p className="text-sm text-gray-900">
                            {formatTimestamp(locationData.timestamp)}
                          </p>
                        </div>
                        {locationData.accuracy && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Accuracy</label>
                            <p className="text-sm text-gray-900">±{locationData.accuracy.toFixed(1)} meters</p>
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                          <p className="text-sm text-gray-900">{locationData.address}</p>
                        </div>
                      </div>
                      {locationData.isRealTime && (
                        <div className="mt-3 flex items-center text-xs text-green-600">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                          Live tracking active
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedBus(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
