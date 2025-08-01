import React, { useState, useEffect } from 'react';
import { userAPI } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import { User as UserIcon, Users as UsersIcon } from 'lucide-react';
import { User } from '../types';

// Extended interface for API response that might include Supabase user_metadata
interface ApiUser extends User {
  user_metadata?: {
    username?: string;
    role?: 'client' | 'admin' | 'employee';
  };
}

export const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'clients' | 'employees'>('all');

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let response;
      
      switch (activeTab) {
        case 'clients':
          response = await userAPI.getClients();
          break;
        case 'employees':
          response = await userAPI.getEmployees();
          break;
        default:
          response = await userAPI.getUsers();
          break;
      }
      
      setUsers(response.data);
    } catch (err) {
      setError(`Failed to fetch ${activeTab} users`);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'employee': return 'bg-blue-100 text-blue-800';
      case 'client': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
        <button
          onClick={fetchUsers}
          className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Refresh
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-3 px-6 font-medium text-sm ${
            activeTab === 'all'
              ? 'border-b-2 border-pink-500 text-pink-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Users
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`py-3 px-6 font-medium text-sm ${
            activeTab === 'clients'
              ? 'border-b-2 border-pink-500 text-pink-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Clients
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`py-3 px-6 font-medium text-sm ${
            activeTab === 'employees'
              ? 'border-b-2 border-pink-500 text-pink-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Employees
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-pink-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.username || user.user_metadata?.username || 'Unknown User'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role || user.user_metadata?.role)}`}>
                    {user.role || user.user_metadata?.role || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="max-w-xs truncate">{user.id}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
};