# WebSocket Integration for Real-Time Bus Tracking

This document describes the WebSocket integration that has been added to the BusMap component to provide real-time bus location updates, employee data, and interactive map features.

## Overview

The integration connects to a WebSocket server running on `ws://localhost:3001` to receive real-time updates from buses and display them on an interactive map. The system includes automatic reconnection, location history tracking, and comprehensive real-time statistics.

## Features

### 1. WebSocket Connection Management
- **Automatic Connection**: Connects to WebSocket server when admin dashboard loads
- **Connection States**: Shows connecting, connected, disconnected, and error states
- **Automatic Reconnection**: Implements exponential backoff with up to 10 retry attempts
- **Connection Status Indicator**: Visual indicator with status text and retry count

### 2. Real-Time Bus Location Updates
- **Enhanced Location Data**: Receives `enhanced_location_update` messages with:
  - GPS coordinates (lat, lng)
  - Accuracy information
  - Timestamp
  - Bus details (number, route, seats, status)
  - Passenger count
  - Employee information
- **Live Map Updates**: Bus markers update in real-time with smooth transitions
- **Data Parsing**: Automatically parses and stores location, bus, and employee data

### 3. Interactive Map Integration
- **Real-Time Markers**: Custom bus icons with enhanced popups showing:
  - Bus number and route
  - Current passenger count and available seats
  - Real-time GPS coordinates and accuracy
  - Last update timestamp
  - Employee information (email, client ID)
- **Location Trails**: Optional movement paths for buses with configurable opacity
- **Auto-fitting**: Map automatically adjusts to show all active buses

### 4. Data Management
- **Connected Employees**: Tracks employees and their assigned buses
- **Location History**: Stores up to 50 recent locations per bus
- **Multiple Buses**: Handles multiple buses simultaneously
- **Data Cleanup**: Automatically removes inactive buses after 5 minutes

### 5. UI Components
- **Connection Status Indicator**: Shows connection state with manual connect/disconnect
- **Real-Time Statistics**: Live counts of active buses, passengers, and available seats
- **Location History Controls**: Toggle for showing/hiding trails and clearing history
- **WebSocket Demo**: Testing interface for development and debugging

## Architecture

### Components

1. **WebSocketService** (`src/services/websocketService.ts`)
   - Manages WebSocket connection lifecycle
   - Handles reconnection logic
   - Provides message and status event handlers

2. **RealTimeContext** (`src/context/RealTimeContext.tsx`)
   - React context for real-time data
   - Manages WebSocket state and bus data
   - Provides hooks for components

3. **BusMap** (`src/components/BusMap.tsx`)
   - Enhanced map component with real-time integration
   - Displays both static and real-time bus data
   - Includes control panel for real-time features

4. **RealTimeBusMarker** (`src/components/RealTimeBusMarker.tsx`)
   - Enhanced marker component for real-time buses
   - Shows detailed information in popups
   - Displays GPS accuracy and timestamps

5. **LocationTrail** (`src/components/LocationTrail.tsx`)
   - Renders movement paths for buses
   - Uses different opacity for recent vs. older locations
   - Provides trail information in tooltips

6. **Control Components**
   - `ConnectionStatusIndicator`: Shows connection status
   - `RealTimeBusStats`: Displays live statistics
   - `LocationHistoryControls`: Manages trail visibility

### Data Flow

```
WebSocket Server (ws://localhost:3001)
    ↓
WebSocketService (Connection Management)
    ↓
RealTimeContext (State Management)
    ↓
BusMap Component (Map Rendering)
    ↓
Real-time Markers & Trails
```

## Message Format

### Enhanced Location Update
```json
{
  "type": "enhanced_location_update",
  "data": {
    "lat": 14.5995,
    "lng": 120.9842,
    "accuracy": 5,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "busNumber": "BUS-001",
    "route": "Route 1",
    "totalSeats": 50,
    "availableSeats": 30,
    "status": "active",
    "passengers": 20,
    "employeeEmail": "driver@example.com",
    "clientId": "client_123"
  }
}
```

## Usage

### 1. Starting the WebSocket Server
Ensure your WebSocket server is running on `ws://localhost:3001` and sending messages in the expected format.

### 2. Using the Real-Time Features
- The WebSocket connection automatically starts when the admin dashboard loads
- Use the control panel toggle (gear icon) in the top-right of the map to access real-time controls
- Monitor connection status and real-time statistics
- Toggle location trails on/off as needed

### 3. Testing the Integration
- Use the WebSocket Demo section in the Buses tab
- Send test messages to verify connectivity
- Simulate location updates to see real-time markers
- Monitor connection status and reconnection attempts

## Configuration

### WebSocket Server URL
The WebSocket server URL can be configured in `src/services/websocketService.ts`:

```typescript
constructor(url: string = 'ws://localhost:3001') {
  this.url = url;
}
```

### Reconnection Settings
```typescript
private maxReconnectAttempts = 10;
private reconnectDelay = 1000; // Base delay in milliseconds
```

### Location History Settings
```typescript
// Keep only last 50 locations per bus
if (history.length > 50) {
  history.splice(0, history.length - 50);
}
```

## Error Handling

- **Connection Failures**: Automatic retry with exponential backoff
- **Message Parsing Errors**: Graceful fallback with console logging
- **Invalid Data**: Validation and filtering of location data
- **Network Issues**: Automatic reconnection when connection is lost

## Performance Considerations

- **Location History**: Limited to 50 points per bus to prevent memory issues
- **Data Cleanup**: Inactive buses are automatically removed after 5 minutes
- **Efficient Updates**: Only re-renders components when data changes
- **Memory Management**: Automatic cleanup of disconnected buses and old data

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify WebSocket server is running on `ws://localhost:3001`
   - Check browser console for connection errors
   - Ensure no firewall blocking the connection

2. **No Real-Time Updates**
   - Check connection status indicator
   - Verify server is sending `enhanced_location_update` messages
   - Check message format matches expected structure

3. **Map Not Updating**
   - Ensure `RealTimeProvider` wraps the application
   - Check for JavaScript errors in console
   - Verify WebSocket messages are being received

### Debug Mode
Use the WebSocket Demo component to:
- Monitor connection status
- Send test messages
- Simulate location updates
- View real-time data flow

## Future Enhancements

- **WebSocket Authentication**: Add secure connection with API keys
- **Data Persistence**: Store location history in database
- **Advanced Analytics**: Real-time performance metrics and alerts
- **Mobile Optimization**: Responsive design for mobile devices
- **Offline Support**: Cache data when connection is lost

## Dependencies

- **React**: 18+ with hooks support
- **Leaflet**: For map functionality
- **TypeScript**: For type safety
- **Tailwind CSS**: For styling

## Support

For issues or questions about the WebSocket integration:
1. Check the browser console for error messages
2. Verify WebSocket server configuration
3. Test with the WebSocket Demo component
4. Review connection status indicators
