export interface WebSocketMessage {
  type: 'connected' | 'employee_connected_confirmed' | 'location_confirmed' | 'enhanced_location_update' | 'location_broadcast' | 'pong' | 'error' | 'employee_connected' | 'location_update' | 'ping';
  data: any;
  timestamp?: string;
}

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: string;
}

export interface BusDataFromServer {
  bus: {
    bus_number: string;
    route?: {
      name: string;
    };
    status: string;
    total_seats: number;
    available_seats: number;
  };
  employee?: {
    email: string;
    name?: string;
  };
}

export interface EnhancedLocationUpdate {
  employeeEmail: string;
  clientId: string;
  location: LocationData;
  busData: {
    busNumber: string;
    route: string;
    totalSeats: number;
    availableSeats: number;
    status: string;
    passengers: number;
  };
  timestamp: string;
}

export interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  message?: string;
  reconnectAttempts: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];
  private statusHandlers: ((status: ConnectionStatus) => void)[] = [];
  private isConnecting = false;
  private employeeEmail: string | null = null;

  constructor(url: string = 'ws://localhost:3001') {
    this.url = url;
  }

  connect(employeeEmail: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.employeeEmail = employeeEmail;
      this.isConnecting = true;
      this.updateStatus('connecting', 'Connecting to WebSocket server...');

      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.updateStatus('connected', 'Connected to WebSocket server');
          
          // Send employee connection message immediately after connection
          this.sendEmployeeConnection(employeeEmail);
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.messageHandlers.forEach(handler => handler(message));
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          this.isConnecting = false;
          if (!event.wasClean) {
            this.handleReconnection();
          } else {
            this.updateStatus('disconnected', 'Connection closed');
          }
        };

        this.ws.onerror = (error) => {
          this.isConnecting = false;
          this.updateStatus('error', 'WebSocket connection error');
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        this.updateStatus('error', 'Failed to create WebSocket connection');
        reject(error);
      }
    });
  }

  private sendEmployeeConnection(email: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'employee_connected',
        data: { email: email }
      };
      
      this.ws.send(JSON.stringify(message));
      console.log('Sent employee connection for:', email);
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateStatus('error', 'Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    this.updateStatus('disconnected', `Connection lost. Reconnecting in ${Math.round(delay / 1000)}s... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.employeeEmail) {
        this.connect(this.employeeEmail).catch(() => {
          // Reconnection failed, will retry on next close event
        });
      }
    }, delay);
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.employeeEmail = null;
    this.updateStatus('disconnected', 'Disconnected from WebSocket server');
  }

  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  // Send location update to server
  sendLocationUpdate(location: LocationData): void {
    if (!this.isConnected()) return;

    const locationData = {
      type: 'location_update',
      data: {
        location: location,
        timestamp: new Date().toISOString()
      }
    };

    this.send(locationData);
  }

  // Ping server for status
  pingServer(): void {
    if (!this.isConnected()) return;

    this.send({
      type: 'ping',
      data: {}
    });
  }

  onMessage(handler: (message: WebSocketMessage) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  onStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    this.statusHandlers.push(handler);
    return () => {
      const index = this.statusHandlers.indexOf(handler);
      if (index > -1) {
        this.statusHandlers.splice(index, 1);
      }
    };
  }

  private updateStatus(status: ConnectionStatus['status'], message?: string): void {
    const connectionStatus: ConnectionStatus = {
      status,
      message,
      reconnectAttempts: this.reconnectAttempts
    };
    
    this.statusHandlers.forEach(handler => handler(connectionStatus));
  }

  getConnectionState(): 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' | null {
    return this.ws ? this.ws.readyState : null;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getEmployeeEmail(): string | null {
    return this.employeeEmail;
  }
}

export const websocketService = new WebSocketService();
export default WebSocketService;
