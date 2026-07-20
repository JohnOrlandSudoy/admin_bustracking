import React, { useState, useEffect } from 'react';
import { Terminal } from '../types';
import { terminalAPI } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import { TerminalLocationPicker, VerifiedTerminalLocation } from './TerminalLocationPicker';
import { MapPin, Plus, CheckCircle } from 'lucide-react';

const emptyLocation = (): VerifiedTerminalLocation | null => null;

export const TerminalsTab: React.FC = () => {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState<VerifiedTerminalLocation | null>(emptyLocation());
  const [editTerminal, setEditTerminal] = useState<Terminal | null>(null);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState<VerifiedTerminalLocation | null>(emptyLocation());
  const [deleteTarget, setDeleteTarget] = useState<Terminal | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTerminals();
  }, []);

  const fetchTerminals = async () => {
    try {
      setLoading(true);
      const response = await terminalAPI.getTerminals();
      setTerminals(response.data);
    } catch {
      setError('Failed to fetch terminals');
    } finally {
      setLoading(false);
    }
  };

  const terminalToLocation = (t: Terminal): VerifiedTerminalLocation | null => {
    if (t.lat == null || t.lng == null) return null;
    return {
      address: t.address,
      formatted_address: t.formatted_address || t.address,
      lat: t.lat,
      lng: t.lng,
      place_id: t.place_id,
      map_verified: Boolean(t.map_verified),
    };
  };

  const resetCreateForm = () => {
    setFormName('');
    setFormLocation(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLocation?.map_verified) {
      setError('Please search, place the pin, and confirm the location on the map before creating.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await terminalAPI.createTerminal({
        name: formName.trim(),
        address: formLocation.address,
        lat: formLocation.lat,
        lng: formLocation.lng,
        place_id: formLocation.place_id,
        formatted_address: formLocation.formatted_address,
        map_verified: true,
      });
      await fetchTerminals();
      resetCreateForm();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to create terminal');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (terminal: Terminal) => {
    setEditTerminal(terminal);
    setEditName(terminal.name);
    setEditLocation(terminalToLocation(terminal));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTerminal) return;
    if (!editLocation?.map_verified) {
      setError('Please confirm the terminal location on the map before saving changes.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await terminalAPI.updateTerminal(editTerminal.id, {
        name: editName.trim(),
        address: editLocation.address,
        lat: editLocation.lat,
        lng: editLocation.lng,
        place_id: editLocation.place_id,
        formatted_address: editLocation.formatted_address,
        map_verified: true,
      });
      await fetchTerminals();
      setEditTerminal(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to update terminal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await terminalAPI.deleteTerminal(deleteTarget.id);
      await fetchTerminals();
      setDeleteTarget(null);
      setConfirmInput('');
    } catch {
      setError('Failed to delete terminal');
    }
  };

  if (loading) return <LoadingSpinner />;

  const canCreate = formName.trim() && formLocation?.map_verified && !submitting;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Terminal Management</h2>
          <p className="text-sm text-gray-500 mt-1">Verify each stop on the map before saving (OpenStreetMap search)</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm(true); setFormLocation(null); setFormName(''); }}
          className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Terminal
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Add New Terminal</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Terminal Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Cabanatuan Central Terminal"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>

            <TerminalLocationPicker
              value={formLocation}
              onChange={setFormLocation}
              addressInputId="terminal-create-address"
            />

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={!canCreate}
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2 px-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving…' : 'Create Terminal'}
              </button>
              <button
                type="button"
                onClick={resetCreateForm}
                className="border border-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="bg-pink-100 p-2 rounded-lg mr-3">
                  <MapPin className="h-5 w-5 text-pink-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{terminal.name}</h3>
              </div>
              {terminal.map_verified && terminal.lat != null ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </span>
              ) : (
                <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full">Needs map</span>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Address:</strong> {terminal.formatted_address || terminal.address}</p>
              {terminal.lat != null && terminal.lng != null && (
                <p className="font-mono text-xs text-gray-500">
                  {terminal.lat.toFixed(5)}, {terminal.lng.toFixed(5)}
                </p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(terminal)}
                className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => { setDeleteTarget(terminal); setConfirmInput(''); }}
                className="border border-red-300 text-red-600 py-2 px-4 rounded-lg hover:bg-red-50 transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {terminals.length === 0 && !loading && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No terminals found. Add your first map-verified terminal!</p>
        </div>
      )}

      {editTerminal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000] overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative my-8">
            <h3 className="text-xl font-semibold mb-4">Edit Terminal</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terminal Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>
              <TerminalLocationPicker
                value={editLocation}
                onChange={setEditLocation}
                addressInputId="terminal-edit-address"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!editName.trim() || !editLocation?.map_verified || submitting}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2 px-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditTerminal(null)}
                  className="border border-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <h3 className="text-xl font-semibold mb-2 text-red-600">Delete Terminal {deleteTarget.name}</h3>
            <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
            <div className="mb-4 text-sm bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-700">Type the terminal name to confirm:</p>
              <p className="mt-1 font-mono text-red-800">{deleteTarget.name}</p>
            </div>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="Type terminal name to confirm"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                type="button"
                disabled={confirmInput !== deleteTarget.name}
                onClick={handleDelete}
                className={`py-2 px-6 rounded-lg transition-all duration-200 ${confirmInput === deleteTarget.name ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-200 text-white cursor-not-allowed'}`}
              >
                Permanently Delete
              </button>
              <button
                type="button"
                onClick={() => { setDeleteTarget(null); setConfirmInput(''); }}
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
