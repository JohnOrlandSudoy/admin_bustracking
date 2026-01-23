import axios from 'axios';
import { Bus, Terminal, Route, NotificationPayload, Feedback, FeedbackStats, Contact, ContactsResponse, RefundsResponse, RefundRequest } from '../types';

// Base URLs are configurable via Vite env vars. Keep sensible defaults for backward compatibility.
const API_URL = (import.meta.env.VITE_ADMIN_API_URL as string) || 'https://backendbus-sumt.onrender.com/api/admin';
const CLIENT_API_URL = (import.meta.env.VITE_CLIENT_API_URL as string) || 'https://backendbus-sumt.onrender.com/api/client';
const ROOT_API_URL = (() => {
  const override = (import.meta.env.VITE_API_BASE_URL as string) || '';
  if (override) return override;
  if (API_URL.includes('/api/admin')) return API_URL.replace('/api/admin', '/api');
  return 'http://localhost:3000/api';
})();



// Attach Authorization header from localStorage token on every request (if present).
axios.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = config.headers || {};
      // Only set Authorization if it's not already set
      if (!('Authorization' in config.headers)) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch (err) {
    // ignore (e.g., SSR or restricted environment)
  }
  return config;
});

// Helper function to handle API errors
const handleApiError = (error: any) => {
  console.error('API error:', error);
  const data = error?.response?.data;
  const msg = (data && (data.error || data.message)) || error.message || 'An error occurred';
  throw new Error(msg);
};

export const busAPI = {
  getBuses: async () => {
    try {
      const response = await axios.get(`${API_URL}/buses`);
      return { data: response.data as Bus[] };
    } catch (error) {
      handleApiError(error);
      return { data: [] };
    }
  },

  getBusLocations: async () => {
    try {
      const response = await axios.get(`${API_URL}/bus-locations`);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: [] };
    }
  },

  updateBus: async (busId: string, busData: Partial<Bus>) => {
    try {
      const response = await axios.put(`${API_URL}/bus/${busId}`, busData);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  },

  deleteBus: async (busId: string) => {
    try {
      const response = await axios.delete(`${API_URL}/bus/${busId}`);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  },

  

  createBus: async (busData: Omit<Bus, 'id'>) => {
    try {
      const response = await axios.post(`${API_URL}/bus`, busData);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  },

  getTransitInsights: async () => {
    try {
      const response = await axios.get(`${API_URL}/transit-insights`);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: [] };
    }
  },
};

export const terminalAPI = {
  getTerminals: async () => {
    try {
      const response = await axios.get(`${API_URL}/terminals`);
      return { data: response.data as Terminal[] };
    } catch (error) {
      handleApiError(error);
      return { data: [] };
    }
  },

  createTerminal: async (terminalData: Omit<Terminal, 'id'>) => {
    try {
      const response = await axios.post(`${API_URL}/terminal`, terminalData);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  },

  updateTerminal: async (terminalId: string, terminalData: Partial<Terminal>) => {
    try {
      const response = await axios.put(`${API_URL}/terminal/${terminalId}`, terminalData);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  },

  deleteTerminal: async (terminalId: string) => {
    try {
      const response = await axios.delete(`${API_URL}/terminal/${terminalId}`);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  },
};

export const routeAPI = {
  getRoutes: async () => {
    try {
      const response = await axios.get(`${API_URL}/routes`);
      return { data: response.data as Route[] };
    } catch (error) {
      handleApiError(error);
      return { data: [] };
    }
  },

  createRoute: async (routeData: { name: string; start_terminal_id: string; end_terminal_id: string }) => {
    try {
      const response = await axios.post(`${API_URL}/route`, routeData);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  },

  updateRoute: async (routeId: string, routeData: Partial<Route>) => {
    try {
      const response = await axios.put(`${API_URL}/route/${routeId}`, routeData);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  },

  deleteRoute: async (routeId: string) => {
    try {
      const response = await axios.delete(`${API_URL}/route/${routeId}`);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  },
};

export const notificationAPI = {
  sendNotification: async (notificationData: NotificationPayload) => {
    try {
      const response = await axios.post(`${API_URL}/notification`, notificationData);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  },

  // Get notifications for a specific client
  getClientNotifications: async (userId: string) => {
    try {
      const response = await axios.get(`${CLIENT_API_URL}/notifications?userId=${userId}`);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: [] };
    }
  },

  // Get notifications for a specific employee
  getEmployeeNotifications: async (employeeId: string) => {
    try {
      const response = await axios.get(`${CLIENT_API_URL}/notifications?employeeId=${employeeId}`);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: [] };
    }
  },
};

export const userAPI = {
  getUsers: async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: [] };
    }
  },

  getClients: async () => {
    try {
      const response = await axios.get(`${API_URL}/users/clients`);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: [] };
    }
  },

  getEmployees: async () => {
    try {
      const response = await axios.get(`${API_URL}/users/employees`);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: [] };
    }
  },

  deleteUser: async (userId: string) => {
    try {
      const response = await axios.delete(`${API_URL}/user/${userId}`);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  },
};

export const feedbackAPI = {
  // Get all feedbacks with user and bus details
  getFeedbacks: async () => {
    try {
      const response = await axios.get(`${API_URL}/feedbacks`);
      return { data: response.data as Feedback[] };
    } catch (error) {
      handleApiError(error);
      return { data: [] };
    }
  },

  // Get feedback by specific bus
  getFeedbacksByBus: async (busId: string) => {
    try {
      const response = await axios.get(`${API_URL}/feedbacks/bus/${busId}`);
      return { data: response.data as Feedback[] };
    } catch (error) {
      handleApiError(error);
      return { data: [] };
    }
  },

  // Get feedback statistics
  getFeedbackStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/feedbacks/stats`);
      return { data: response.data as FeedbackStats };
    } catch (error) {
      handleApiError(error);
      return {
        data: {
          total_feedbacks: 0,
          average_rating: 0,
          rating_distribution: {},
          bus_feedback_count: []
        }
      };
    }
  },

  // Get feedback by specific user
  getFeedbacksByUser: async (userId: string) => {
    try {
      const response = await axios.get(`${API_URL}/feedbacks/user/${userId}`);
      return { data: response.data as Feedback[] };
    } catch (error) {
      handleApiError(error);
      return { data: [] };
    }
  },
};

export const contactAPI = {
  getContacts: async (params: { status?: string; page?: number; limit?: number }) => {
    try {
      const query = new URLSearchParams();
      if (params.status && params.status !== 'all') query.append('status', params.status);
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
      const response = await axios.get(`${API_URL}/contacts${query.toString() ? `?${query.toString()}` : ''}`);
      return { data: response.data as ContactsResponse };
    } catch (error) {
      handleApiError(error);
      return { data: { contacts: [] as Contact[], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } } };
    }
  },
};

export const adminAPI = {
  createEmployee: async (employeeData: any) => {
    try {
      const response = await axios.post(`${API_URL}/employee/create`, employeeData);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  },

  assignBusToEmployee: async (busId: string, email: string) => {
    try {
      const response = await axios.put(`${API_URL}/employee/assign-bus`, { busId, email });
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  },

  confirmEmployee: async (employeeId: string) => {
    try {
      const response = await axios.put(`${API_URL}/employee/${employeeId}/confirm`);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  },

  getEmployeeById: async (employeeId: string) => {
    try {
      const response = await axios.get(`${API_URL}/employee/${employeeId}`);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  },

  getReports: async () => {
    try {
      const response = await axios.get(`${API_URL}/reports`);
      return { data: response.data };
    } catch (error) {
      handleApiError(error);
      return { data: [] };
    }
  },
};

export const bookingAPI = {
    getBookings: async () => {
      try {
        const response = await axios.get(`${CLIENT_API_URL}/bookings`);
        return { data: response.data };
      } catch (error) {
        handleApiError(error);
        return { data: [] };
      }
    },
    confirmBooking: async (bookingId: string) => {
        try {
          const response = await axios.put(`${API_URL}/booking/${bookingId}/confirm`);
          return { data: response.data };
        } catch (error) {
          handleApiError(error);
          return { data: null };
        }
      },
  };

export const refundAPI = {
  getRefunds: async (params: { page?: number; limit?: number } = {}) => {
    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
      const response = await axios.get(`${API_URL}/refunds${query.toString() ? `?${query.toString()}` : ''}`);
      return { data: response.data as RefundsResponse };
    } catch (error) {
      handleApiError(error);
      return { data: { refunds: [] as RefundRequest[], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } } };
    }
  },
  getRefundById: async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/refunds/${id}`);
      return { data: response.data as RefundRequest };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  },
  updateRefundStatus: async (id: string, status: 'pending' | 'approved' | 'rejected', note?: string) => {
    try {
      const response = await axios.put(`${API_URL}/refund/${id}/status`, { status, note });
      return { data: response.data as RefundRequest };
    } catch (error) {
      handleApiError(error);
      return { data: null };
    }
  }
};

export const otpAPI = {
  sendOtp: async (email: string) => {
    try {
      const response = await axios.post(`${ROOT_API_URL}/auth/send-otp`, { email });
      return { success: true, data: response.data };
    } catch (error) {
      handleApiError(error);
      return { success: false, data: null };
    }
  },
  verifyOtp: async (email: string, code: string) => {
    try {
      const response = await axios.post(`${ROOT_API_URL}/auth/verify-otp`, { email, code });
      return { success: true, data: response.data };
    } catch (error) {
      handleApiError(error);
      return { success: false, data: null };
    }
  },
  updatePasswordWithOtp: async (email: string, code: string, newPassword: string) => {
    try {
      const response = await axios.post(`${ROOT_API_URL}/auth/update-password-with-otp`, { email, code, newPassword });
      return { success: true, data: response.data };
    } catch (error) {
      handleApiError(error);
      return { success: false, data: null };
    }
  }
};
