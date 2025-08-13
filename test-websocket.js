const WebSocket = require('ws');

// Test WebSocket connection to localhost:3001
const ws = new WebSocket('ws://localhost:3001');

ws.on('open', function open() {
  console.log('✅ Connected to WebSocket server');
  
  // Send a test message
  const testMessage = {
    type: 'test',
    data: {
      message: 'Hello from test script!',
      timestamp: new Date().toISOString()
    }
  };
  
  ws.send(JSON.stringify(testMessage));
  console.log('📤 Sent test message:', testMessage);
  
  // Send a simulated location update
  const locationUpdate = {
    type: 'enhanced_location_update',
    data: {
      lat: 14.5995 + (Math.random() - 0.5) * 0.01,
      lng: 120.9842 + (Math.random() - 0.5) * 0.01,
      accuracy: Math.floor(Math.random() * 20) + 1,
      timestamp: new Date().toISOString(),
      busNumber: 'BUS-TEST-001',
      route: 'Test Route',
      totalSeats: 50,
      availableSeats: 30,
      status: 'active',
      passengers: 20,
      employeeEmail: 'test.driver@example.com',
      clientId: 'test_client_001'
    }
  };
  
  ws.send(JSON.stringify(locationUpdate));
  console.log('📤 Sent location update:', locationUpdate);
  
  // Close connection after sending messages
  setTimeout(() => {
    console.log('🔌 Closing connection...');
    ws.close();
  }, 2000);
});

ws.on('message', function message(data) {
  try {
    const parsed = JSON.parse(data);
    console.log('📥 Received message:', parsed);
  } catch (error) {
    console.log('📥 Received raw message:', data.toString());
  }
});

ws.on('close', function close() {
  console.log('🔌 Connection closed');
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
});

console.log('🚀 Starting WebSocket test...');
console.log('📡 Attempting to connect to ws://localhost:3001');
console.log('⏳ Waiting for connection...');
