import React, { useState, useEffect } from 'react';
import { Terminal } from '../types';
import { terminalAPI } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import { MapPin, Plus } from 'lucide-react';

export const TerminalsTab: React.FC = () => {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
  });
  const [editTerminal, setEditTerminal] = useState<Terminal | null>(null);
  const [editForm, setEditForm] = useState({ name: '', address: '' });
  const [deleteTarget, setDeleteTarget] = useState<Terminal | null>(null);
  const [confirmInput, setConfirmInput] = useState('');

  useEffect(() => {
    fetchTerminals();
  }, []);

  const fetchTerminals = async () => {
    try {
      setLoading(true);
      const response = await terminalAPI.getTerminals();
      setTerminals(response.data);
    } catch (err) {
      setError('Failed to fetch terminals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await terminalAPI.createTerminal({
        name: formData.name,
        address: formData.address,
      });
      await fetchTerminals();
      setShowForm(false);
      setFormData({ name: '', address: '' });
    } catch (err) {
      setError('Failed to create terminal');
    }
  };

  const openEdit = (terminal: Terminal) => {
    setEditTerminal(terminal);
    setEditForm({ name: terminal.name, address: terminal.address });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTerminal) return;
    try {
      await terminalAPI.updateTerminal(editTerminal.id, {
        name: editForm.name,
        address: editForm.address,
      });
      await fetchTerminals();
      setEditTerminal(null);
    } catch (err) {
      setError('Failed to update terminal');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await terminalAPI.deleteTerminal(deleteTarget.id);
      await fetchTerminals();
      setDeleteTarget(null);
      setConfirmInput('');
    } catch (err) {
      setError('Failed to delete terminal');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Terminal Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Terminal
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      {/* Add Terminal Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Add New Terminal</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Terminal Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2 px-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200"
              >
                Create Terminal
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Terminals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <div className="flex items-center mb-3">
              <div className="bg-pink-100 p-2 rounded-lg mr-3">
                <MapPin className="h-5 w-5 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{terminal.name}</h3>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Address:</strong> {terminal.address}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => openEdit(terminal)}
                className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Edit
              </button>
              <button
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
          <p className="text-gray-500">No terminals found. Add your first terminal!</p>
        </div>
      )}

      {/* Edit Modal */}
      {editTerminal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <h3 className="text-xl font-semibold mb-4">Edit Terminal</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terminal Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({...prev, name: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({...prev, address: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2 px-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200">Save</button>
                <button type="button" onClick={() => setEditTerminal(null)} className="border border-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-50 transition-all duration-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
                disabled={confirmInput !== deleteTarget.name}
                onClick={handleDelete}
                className={`py-2 px-6 rounded-lg transition-all duration-200 ${confirmInput === deleteTarget.name ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-200 text-white cursor-not-allowed'}`}
              >
                Permanently Delete
              </button>
              <button onClick={() => { setDeleteTarget(null); setConfirmInput(''); }} className="border border-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-50 transition-all duration-200">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};