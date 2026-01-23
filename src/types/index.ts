export interface Bus {
  id: string;
  bus_number: string;
  route_id: string;
  current_location: {
    lat: number;
    lng: number;
  } | null;
  status: 'active' | 'inactive' | 'maintenance';
  available_seats: number;
  total_seats: number;
  driver_id: string | null;
  conductor_id: string | null;
  terminal_id: string | null;
  driver?: {
    id: string;
    name: string;
    phone?: string;
  } | null;
  conductor?: {
    id: string;
    name: string;
    phone?: string;
  } | null;
}

export interface Terminal {
  id: string;
  name: string;
  address: string;
}

export interface Route {
  id: string;
  name: string;
  start_terminal_id: string | null;
  end_terminal_id: string | null;
  start_terminal: Terminal;
  end_terminal: Terminal;
}

export interface NotificationPayload {
  recipient_ids: string;
  type: 'delay' | 'route_change' | 'traffic' | 'general';
  message: string;
}

export interface BusReassignment {
  driver_id: string | null;
  conductor_id: string | null;
  route_id: string | null;
}

export interface User {
  id: string;
  role: 'client' | 'admin' | 'employee';
  username: string;
  email: string;
  profile: any;
}

export interface Feedback {
  id: string;
  user_id: string;
  bus_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  // Extended properties from API joins
  user?: {
    username: string;
    email: string;
    profile: any;
  };
  bus?: {
    bus_number: string;
    route_name?: string;
  };
}

export interface FeedbackStats {
  total_feedbacks: number;
  average_rating: number;
  rating_distribution: {
    [key: string]: number; // "1": count, "2": count, etc.
  };
  bus_feedback_count: {
    bus_id: string;
    bus_number: string;
    feedback_count: number;
  }[];
}

export interface Contact {
  id: string;
  full_name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RefundRequest {
  id: string;
  full_name: string;
  email: string;
  reason: string;
  proof_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  note?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface RefundsResponse {
  refunds: RefundRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
