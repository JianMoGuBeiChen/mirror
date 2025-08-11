const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = process.env.WS_PORT || 8889;
const SETTINGS_FILE = path.join(__dirname, 'global-settings.json');

// Global settings storage
let globalSettings = {};

// Load settings from file
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      globalSettings = JSON.parse(data);
      console.log('Loaded global settings from file');
    }
  } catch (e) {
    console.log('Failed to load settings, starting fresh');
    globalSettings = {};
  }
}

// Save settings to file
function saveSettings() {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(globalSettings, null, 2));
  } catch (e) {
    console.log('Failed to save settings:', e.message);
  }
}

// Broadcast helper
function broadcast(data, exclude) {
  wss.clients.forEach((client) => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

loadSettings();

const server = http.createServer((req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/settings' && req.method === 'GET') {
    // Return all current settings
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(globalSettings));
  } else if (req.url === '/settings' && req.method === 'POST') {
    // Update settings
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const updates = JSON.parse(body);
        Object.assign(globalSettings, updates);
        saveSettings();
        
        // Broadcast changes to all WebSocket clients
        broadcast(JSON.stringify({
          type: 'settings_update',
          settings: globalSettings
        }));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log('Client connected to settings sync');
  
  // Send current settings to new client
  ws.send(JSON.stringify({
    type: 'settings_update',
    settings: globalSettings
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data && data.type === 'settings_change') {
        console.log('Received settings change:', data);
        // Update global settings
        if (data.key) {
          const oldValue = globalSettings[data.key];
          if (data.newValue === null) {
            delete globalSettings[data.key];
          } else {
            globalSettings[data.key] = data.newValue;
          }
          saveSettings();
          
          console.log('Updated global settings, broadcasting to', wss.clients.size - 1, 'other clients');
          
          // Broadcast to all other clients
          broadcast(JSON.stringify({
            type: 'settings_update',
            settings: globalSettings
          }), ws);
        }
      }
    } catch (e) {
      console.log('Invalid message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from settings sync');
  });
});

server.listen(PORT, () => {
  console.log(`Global settings server listening on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket server listening on ws://0.0.0.0:${PORT}`);
});
