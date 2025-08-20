import React, { useState, useEffect } from 'react';
import { Bus, User } from '../types';
import { busAPI, terminalAPI, routeAPI, adminAPI } from '../utils/api';
import { BusMap } from './BusMap';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import { Settings, Users, MapPin, Phone, Mail } from 'lucide-react';

interface BusesTabProps {
  buses: Bus[];
  routes: any[];
  terminals: any[];
  assignedEmployees: Record<string, any>;
  loading: boolean;
  error: string | null;
}

export const BusesTab: React.FC<BusesTabProps> = ({
  buses: propBuses,
  routes: propRoutes,
  terminals: propTerminals,
  assignedEmployees: propAssignedEmployees,
  loading: propLoading,
  error: propError
}) => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [terminals, setTerminals] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [assignEmployeeEmail, setAssignEmployeeEmail] = useState('');
  const [assignedEmployees, setAssignedEmployees] = useState<Record<string, User>>({});
  const [newBusForm, setNewBusForm] = useState({
    bus_number: '',
    total_seats: 50,
    terminal_id: '',
    route_id: '',
  });
  const [editBus, setEditBus] = useState<Bus | null>(null);
  const [editForm, setEditForm] = useState({
    bus_number: '',
    total_seats: 50,
    terminal_id: '',
    route_id: '',
    status: 'inactive' as 'active' | 'inactive' | 'maintenance',
    available_seats: 0,
  });
  const [deleteBusTarget, setDeleteBusTarget] = useState<Bus | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  // Debug logging
  console.log('BusesTab props:', { propBuses, propRoutes, propTerminals, propAssignedEmployees, propLoading, propError });
  console.log('BusesTab local state:', { buses, routes, terminals, loading, error });

  // Use props if provided, otherwise use local state
  const displayBuses = propBuses.length > 0 ? propBuses : buses;
  const displayRoutes = propRoutes.length > 0 ? propRoutes : routes;
  const displayTerminals = propTerminals.length > 0 ? propTerminals : terminals;
  const displayAssignedEmployees = Object.keys(propAssignedEmployees).length > 0 ? propAssignedEmployees : assignedEmployees;
  
  // Simplified loading logic - only show loading if we have no data at all
  const displayLoading = propLoading || (loading && displayBuses.length === 0 && displayRoutes.length === 0 && displayTerminals.length === 0);
  const displayError = propError || error;

  console.log('BusesTab display values:', { displayBuses, displayRoutes, displayTerminals, displayLoading, displayError });
 
  useEffect(() => {
    // Only fetch data if props are not provided
    if (propBuses.length === 0 && propRoutes.length === 0 && propTerminals.length === 0) {
      fetchData();
    } else {
      // If props are provided, set loading to false immediately
      setLoading(false);
      console.log('Using props data, setting loading to false');
    }
  }, [propBuses.length, propRoutes.length, propTerminals.length]);

  // Update loading state when props change
  useEffect(() => {
    if (propBuses.length > 0 || propRoutes.length > 0 || propTerminals.length > 0) {
      setLoading(false);
      console.log('Props updated, setting loading to false');
    }
  }, [propBuses, propRoutes, propTerminals]);

  useEffect(() => {
    const fetchAssignedEmployees = async () => {
      const employeeDetails: Record<string, User> = {};
      for (const bus of displayBuses) {
        if (bus.driver_id && !displayAssignedEmployees[bus.driver_id]) {
          try {
            const response = await adminAPI.getEmployeeById(bus.driver_id);
            if (response.data) {
              employeeDetails[bus.driver_id] = response.data;
            }
          } catch (error) {
            console.error(`Failed to fetch driver details for bus ${bus.id}`, error);
          }
        }
        if (bus.conductor_id && !displayAssignedEmployees[bus.conductor_id]) {
          try {
            const response = await adminAPI.getEmployeeById(bus.conductor_id);
            if (response.data) {
              employeeDetails[bus.conductor_id] = response.data;
            }
          } catch (error) {
            console.error(`Failed to fetch conductor details for bus ${bus.id}`, error);
          }
        }
      }
      if (Object.keys(employeeDetails).length > 0) {
        setAssignedEmployees(prev => ({...prev, ...employeeDetails}));
      }
    };

    if (displayBuses.length > 0) {
      fetchAssignedEmployees();
    }
  }, [displayBuses, displayAssignedEmployees]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching bus management data...');
      
      const [transitResponse, terminalsResponse, routesResponse] = await Promise.all([
        busAPI.getTransitInsights(),
        terminalAPI.getTerminals(),
        routeAPI.getRoutes()
      ]);

      console.log('API responses:', { 
        buses: transitResponse.data, 
        terminals: terminalsResponse.data, 
        routes: routesResponse.data 
      });

      setBuses(transitResponse.data || []);
      setTerminals(terminalsResponse.data || []);
      setRoutes(routesResponse.data || []);
    } catch (err) {
      console.error('Error fetching bus management data:', err);
      setError('Failed to fetch data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await busAPI.createBus({
        ...newBusForm,
        total_seats: Number(newBusForm.total_seats),
        available_seats: Number(newBusForm.total_seats),
        status: 'inactive',
        current_location: null,
        driver_id: null,
        conductor_id: null
      });
      
      setSuccess('Bus created successfully!');
      setNewBusForm({
        bus_number: '',
        total_seats: 50,
        terminal_id: '',
        route_id: '',
      });
      setShowAddForm(false);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to create bus');
    }
  };

  const handleAssignEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBus) return;

    setError(null);
    setSuccess(null);

    try {
      await adminAPI.assignBusToEmployee(selectedBus.id, assignEmployeeEmail);
      setSuccess('Employee assigned successfully! The bus status will update once the employee is active.');
      await fetchData();
      setSelectedBus(null);
      setAssignEmployeeEmail('');
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to assign employee. The employee might not be active yet.');
    }
  };

  const openEditModal = (bus: Bus) => {
    setEditBus(bus);
    setEditForm({
      bus_number: bus.bus_number,
      total_seats: bus.total_seats,
      terminal_id: bus.terminal_id || '',
      route_id: bus.route_id || '',
      status: bus.status,
      available_seats: bus.available_seats,
    });
  };

  const handleUpdateBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBus) return;
    setError(null);
    setSuccess(null);
    try {
      await busAPI.updateBus(editBus.id, {
        bus_number: editForm.bus_number,
        total_seats: Number(editForm.total_seats),
        available_seats: Number(editForm.available_seats),
        terminal_id: editForm.terminal_id || null,
        route_id: editForm.route_id || null,
        status: editForm.status,
      } as any);
      setSuccess('Bus updated successfully');
      setEditBus(null);
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update bus');
    }
  };

  const handleDeleteBus = async (busId: string) => {
    setError(null);
    setSuccess(null);
    try {
      await busAPI.deleteBus(busId);
      setSuccess('Bus deleted successfully');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete bus');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (displayLoading) {
    console.log('Showing loading spinner, displayLoading:', displayLoading);
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Bus Management</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
          >
            <span className="mr-2">+</span>
            Add Bus
          </button>
          <button
            onClick={fetchData}
            className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Refresh
          </button>
        </div>
      </div>

      {displayError && <ErrorAlert message={displayError} onClose={() => setError(null)} />}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-green-800">{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-600 hover:text-green-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Add Bus Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Register New Bus</h3>
          <form onSubmit={handleCreateBus} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bus Number</label>
              <input
                type="text"
                value={newBusForm.bus_number}
                onChange={(e) => setNewBusForm(prev => ({...prev, bus_number: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., PH-BUS-101"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats</label>
              <input
                type="number"
                value={newBusForm.total_seats}
                onChange={(e) => setNewBusForm(prev => ({...prev, total_seats: parseInt(e.target.value)}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                min="1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Terminal</label>
              <select
                value={newBusForm.terminal_id}
                onChange={(e) => setNewBusForm(prev => ({...prev, terminal_id: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              >
                <option value="">Select Terminal</option>
                {displayTerminals.map((terminal) => (
                  <option key={terminal.id} value={terminal.id}>
                    {terminal.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
              <select
                value={newBusForm.route_id}
                onChange={(e) => setNewBusForm(prev => ({...prev, route_id: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              >
                <option value="">Select Route</option>
                {displayRoutes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2 px-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200"
              >
                Register Bus
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="border border-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Map */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-pink-600" />
          Bus Locations
        </h3>
        <BusMap 
          buses={displayBuses} 
          routes={displayRoutes}
          terminals={displayTerminals}
          assignedEmployees={displayAssignedEmployees}
        />
      </div>

      {/* Bus Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayBuses.map((bus) => {
          const driver = bus.driver_id ? displayAssignedEmployees[bus.driver_id] : null;
          const conductor = bus.conductor_id ? displayAssignedEmployees[bus.conductor_id] : null;
          const route = displayRoutes.find(r => r.id === bus.route_id);
          const startTerminalName = route?.start_terminal_id ? (displayTerminals.find(t => t.id === route.start_terminal_id)?.name || 'Unknown') : 'Not assigned';
          const endTerminalName = route?.end_terminal_id ? (displayTerminals.find(t => t.id === route.end_terminal_id)?.name || 'Unknown') : 'Not assigned';

          return (
            <div key={bus.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Bus {bus.bus_number}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bus.status)}`}>
                  {bus.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Seats: {bus.available_seats}/{bus.total_seats}
                </div>
                {bus.current_location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Lat: {bus.current_location.lat.toFixed(4)}, Lng: {bus.current_location.lng.toFixed(4)}
                  </div>
                )}

                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Driver: {driver ? driver.profile.fullName : 'Not assigned'}
                </div>
                {driver && (
                  <div className="pl-6 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Mail className="h-3 w-3 mr-2" />
                      {driver.email}
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-2" />
                      {driver.profile.phone}
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Conductor: {conductor ? conductor.profile.fullName : 'Not assigned'}
                </div>
                {conductor && (
                  <div className="pl-6 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Mail className="h-3 w-3 mr-2" />
                      {conductor.email}
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-2" />
                      {conductor.profile.phone}
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Terminal: {displayTerminals.find(t => t.id === bus.terminal_id)?.name || 'Not assigned'}
                </div>

                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Route: {route?.name || 'Not assigned'}
                </div>

                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Start Terminal: {startTerminalName}
                </div>

                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  End Terminal: {endTerminalName}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedBus(bus)}
                  className="col-span-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 flex items-center justify-center"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Assign Employee
                </button>
                <button
                  onClick={() => openEditModal(bus)}
                  className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Edit
                </button>
              </div>
              <button
                onClick={() => { setDeleteBusTarget(bus); setDeleteConfirmInput(''); }}
                className="mt-2 w-full border border-red-300 text-red-600 py-2 px-4 rounded-lg hover:bg-red-50 transition-all duration-200"
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>

      {/* Reassignment Modal */}
      {selectedBus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <h3 className="text-xl font-semibold mb-4">Assign Employee to Bus {selectedBus.bus_number}</h3>
            <form onSubmit={handleAssignEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Email</label>
                <input
                  type="email"
                  value={assignEmployeeEmail}
                  onChange={(e) => setAssignEmployeeEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="pending.driver@example.com"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200"
                >
                  Assign
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBus(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bus Modal */}
      {editBus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg relative">
            <h3 className="text-xl font-semibold mb-4">Edit Bus {editBus.bus_number}</h3>
            <form onSubmit={handleUpdateBus} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Number</label>
                  <input
                    type="text"
                    value={editForm.bus_number}
                    onChange={(e) => setEditForm(prev => ({...prev, bus_number: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats</label>
                  <input
                    type="number"
                    value={editForm.total_seats}
                    onChange={(e) => setEditForm(prev => ({...prev, total_seats: parseInt(e.target.value) || 0}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Seats</label>
                  <input
                    type="number"
                    value={editForm.available_seats}
                    onChange={(e) => setEditForm(prev => ({...prev, available_seats: parseInt(e.target.value) || 0}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    min="0"
                    max={editForm.total_seats}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({...prev, status: e.target.value as any}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="maintenance">maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Terminal</label>
                  <select
                    value={editForm.terminal_id}
                    onChange={(e) => setEditForm(prev => ({...prev, terminal_id: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Not assigned</option>
                    {displayTerminals.map((terminal) => (
                      <option key={terminal.id} value={terminal.id}>{terminal.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                  <select
                    value={editForm.route_id}
                    onChange={(e) => setEditForm(prev => ({...prev, route_id: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Not assigned</option>
                    {displayRoutes.map((route) => (
                      <option key={route.id} value={route.id}>{route.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2 px-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200">
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditBus(null)} className="border border-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-50 transition-all duration-200">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteBusTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <h3 className="text-xl font-semibold mb-2 text-red-600">Delete Bus {deleteBusTarget.bus_number}</h3>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. This will permanently remove the bus and its associations.
            </p>
            <div className="mb-4 text-sm bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-700">To confirm, please type the bus number exactly:</p>
              <p className="mt-1 font-mono text-red-800">{deleteBusTarget.bus_number}</p>
            </div>
            <input
              type="text"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder="Type bus number to confirm"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  await handleDeleteBus(deleteBusTarget.id);
                  setDeleteBusTarget(null);
                  setDeleteConfirmInput('');
                }}
                disabled={deleteConfirmInput !== deleteBusTarget.bus_number}
                className={`py-2 px-6 rounded-lg transition-all duration-200 ${deleteConfirmInput === deleteBusTarget.bus_number ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-200 text-white cursor-not-allowed'}`}
              >
                Permanently Delete
              </button>
              <button
                onClick={() => { setDeleteBusTarget(null); setDeleteConfirmInput(''); }}
                className="border border-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
