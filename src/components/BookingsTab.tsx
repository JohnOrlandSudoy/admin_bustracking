import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';

interface Booking {
  id: string;
  user_id: string;
  bus_id: string;
  status: string;
  created_at: string;
  travel_date?: string;
  seats?: number[];
  amount?: number;
  receipt_sent?: boolean;
  email?: string;
  bus: {
    route: {
      name: string;
    };
    bus_number: string;
  };
  user: {
    email: string;
    profile: {
      phone: string;
      fullName: string;
    };
    username: string;
  };
}

export const BookingsTab: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getBookings();
      setBookings(response.data);
    } catch (err) {
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      await bookingAPI.confirmBooking(bookingId);
      fetchBookings(); // Refresh the bookings list
    } catch (err) {
      setError('Failed to confirm booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return 'N/A';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const openReceipt = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowReceipt(true);
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setSelectedBooking(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Bookings</h2>
        <button
          onClick={fetchBookings}
          className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Refresh
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booked On</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{booking.user.profile.fullName}</div>
                  <div className="text-sm text-gray-500">{booking.user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{booking.bus.bus_number}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{booking.bus.route.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{new Date(booking.created_at).toLocaleDateString()}</div>
                  <div className="text-sm text-gray-500">{new Date(booking.created_at).toLocaleTimeString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openReceipt(booking)}
                      className="text-pink-600 hover:text-pink-800 text-sm font-medium"
                    >
                      View
                    </button>
                    {booking.receipt_sent && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Sent</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => handleConfirmBooking(booking.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Confirm
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showReceipt && selectedBooking && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-4 rounded-t-xl text-white">
              <div className="font-bold text-lg">Booking Receipt</div>
              <div className="text-xs opacity-90">AuroRide — Admin Preview</div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-gray-600 text-sm">Booking ID</div>
                <div className="font-mono text-sm bg-gray-50 px-3 py-1.5 rounded border border-gray-200">{selectedBooking.id}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-gray-600 text-sm">Route</div>
                <div className="text-sm font-semibold text-gray-800">{selectedBooking.bus?.route?.name || '—'}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-gray-600 text-sm">Date</div>
                <div className="text-sm font-semibold text-gray-800">
                  {formatDate(selectedBooking.travel_date) || formatDate(selectedBooking.created_at)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-gray-600 text-sm">Seats</div>
                <div className="text-sm font-semibold text-gray-800">
                  {(selectedBooking.seats || []).join(', ') || '—'}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-gray-600 text-sm">Total</div>
                <div className="text-sm font-bold text-pink-600">
                  {typeof selectedBooking.amount === 'number' ? `$${selectedBooking.amount}` : `$${Number(selectedBooking.amount || 0)}`}
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-3">
              {selectedBooking.receipt_sent ? (
                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Receipt sent to {selectedBooking.user?.email}</span>
              ) : (
                <span className="text-xs text-gray-500">Receipt will be emailed on Confirm</span>
              )}
              <button onClick={closeReceipt} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
