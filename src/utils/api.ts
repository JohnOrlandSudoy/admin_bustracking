import axios from 'axios';
import { Bus, Terminal, Route, NotificationPayload, BusReassignment, Feedback, FeedbackStats } from '../types';

const API_URL = 'http://localhost:3000/api/admin';
const CLIENT_API_URL = 'http://localhost:3000/api/client';

// Helper function to handle API errors
const handleApiError = (error: any) => {
  console.error('API error:', error);
  throw new Error(error.response?.data?.message || error.message || 'An error occurred');
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