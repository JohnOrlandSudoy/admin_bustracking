import React, { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import { FileText } from 'lucide-react';

interface Report {
  id: string;
  type: string;
  description: string;
  created_at: string;
  employee: {
    id: string;
    email: string;
    profile: {
      phone: string;
      fullName: string;
    };
    username: string;
  };
  bus: {
    id: string;
    bus_number: string;
  };
}

export const ReportsTab: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getReports();
        setReports(response.data);
      } catch (err) {
        setError('Failed to fetch reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Reports</h2>
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.length === 0 && !loading && !error && (
          <p className="text-gray-600">No reports found.</p>
        )}
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Report ID: {report.id.substring(0, 8)}...</h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {report.type}
              </span>
            </div>
            <p className="text-gray-700 mb-2">{report.description}</p>
            <p className="text-sm text-gray-500 mb-2">Created: {new Date(report.created_at).toLocaleString()}</p>
            
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Employee:</strong> {report.employee.profile.fullName} ({report.employee.email})</p>
              <p><strong>Bus:</strong> {report.bus.bus_number}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
