import React, { useState } from 'react';
import { adminAPI } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';

export const ConfirmEmployeeTab: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await adminAPI.confirmEmployee(employeeId);
      setSuccess('Employee confirmed successfully! They can now be assigned to a bus.');
      setEmployeeId('');
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Failed to confirm employee. Please check the ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Confirm Employee</h2>
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <span className="text-green-800">{success}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg shadow-md p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Enter the employee ID to confirm"
            required
          />
        </div>
        <div className="flex space-x-3">
          <button
            type="submit"
            className="bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2 px-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200"
            disabled={loading}
          >
            {loading ? <LoadingSpinner /> : 'Confirm Employee'}
          </button>
        </div>
      </form>
    </div>
  );
};
