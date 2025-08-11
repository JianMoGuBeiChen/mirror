// Global settings API that works across all browsers and devices
class GlobalSettingsAPI {
  constructor() {
    this.ws = null;
    this.reconnectInterval = null;
    this.isConnected = false;
    this.pendingUpdates = new Map();
    this.listeners = new Set();
    this.localCache = {};
    this.init();
  }

  init() {
    this.loadFromServer();
    this.connect();
    
    // Sync with localStorage for compatibility
    this.syncWithLocalStorage();
  }

  async loadFromServer() {
    try {
      // Try multiple server URLs
      const urls = [
        `http://${window.location.hostname}:8889/settings`,
        `http://localhost:8889/settings`,
        `http://127.0.0.1:8889/settings`
      ];
      
      for (const url of urls) {
        try {
          console.log('Trying to load settings from:', url);
          const response = await fetch(url);
          if (response.ok) {
            const settings = await response.json();
            this.localCache = settings;
            this.updateLocalStorage(settings);
            this.notifyListeners();
            console.log('Loaded global settings from server:', url);
            return;
          }
        } catch (e) {
          console.log('Failed to connect to:', url);
        }
      }
      throw new Error('All server URLs failed');
    } catch (e) {
      console.log('Failed to load settings from server, using localStorage');
      this.loadFromLocalStorage();
    }
  }

  loadFromLocalStorage() {
    const keys = Object.keys(localStorage);
    const settings = {};
    keys.forEach(key => {
      try {
        settings[key] = localStorage.getItem(key);
      } catch (e) {
        // ignore
      }
    });
    this.localCache = settings;
  }

  updateLocalStorage(settings) {
    // Don't clear all localStorage, just update the settings we care about
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        localStorage.setItem(key, value);
      } else {
        localStorage.removeItem(key);
      }
    });
  }

  syncWithLocalStorage() {
    // Listen for direct localStorage changes and sync to server
    window.addEventListener('storage', (e) => {
      if (!e.key) return; // ignore clear events
      console.log('Storage event:', e.key, e.newValue);
      if (!this.isApplyingRemote) {
        this.updateSetting(e.key, e.newValue);
      }
    });

    // Override localStorage methods to capture direct calls
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);

    localStorage.setItem = (key, value) => {
      originalSetItem(key, value);
      console.log('localStorage.setItem:', key, value, 'isApplyingRemote:', this.isApplyingRemote);
      if (!this.isApplyingRemote) {
        this.updateSetting(key, value);
      }
    };

    localStorage.removeItem = (key) => {
      originalRemoveItem(key);
      console.log('localStorage.removeItem:', key, 'isApplyingRemote:', this.isApplyingRemote);
      if (!this.isApplyingRemote) {
        this.updateSetting(key, null);
      }
    };
  }

  connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      
      // Try multiple WebSocket URLs
      const urls = [
        `${protocol}://${window.location.hostname}:8889`,
        `${protocol}://localhost:8889`,
        `${protocol}://127.0.0.1:8889`
      ];
      
      let urlIndex = 0;
      
      const tryConnect = () => {
        if (urlIndex >= urls.length) {
          console.log('All WebSocket URLs failed, retrying in 5s...');
          this.reconnect();
          return;
        }
        
        const url = urls[urlIndex];
        console.log('Trying WebSocket connection to:', url);
        
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          console.log('Connected to global settings WebSocket:', url);
          this.isConnected = true;
          if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
          }
          this.processPendingUpdates();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'settings_update') {
              console.log('Received settings update via WebSocket');
              
              // Only update if settings actually changed
              const currentSettingsStr = JSON.stringify(this.localCache);
              const newSettingsStr = JSON.stringify(data.settings);
              
              if (currentSettingsStr !== newSettingsStr) {
                // CRITICAL: Set flag to prevent feedback loop
                this.isApplyingRemote = true;
                
                this.localCache = data.settings;
                this.updateLocalStorage(data.settings);
                this.notifyListeners();
                
                // Clear flag after a brief delay
                setTimeout(() => {
                  this.isApplyingRemote = false;
                }, 100);
                
                console.log('Settings applied and UI updated');
              }
            }
          } catch (e) {
            console.error('Invalid WebSocket message:', e);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket connection closed:', url);
          this.isConnected = false;
          this.reconnect();
        };

        this.ws.onerror = (error) => {
          console.log('WebSocket error for', url, '- trying next...');
          urlIndex++;
          setTimeout(tryConnect, 100);
        };
      };

      tryConnect();
    } catch (error) {
      console.log('Failed to connect to WebSocket server:', error);
      this.reconnect();
    }
  }

  reconnect() {
    if (!this.reconnectInterval) {
      this.reconnectInterval = setInterval(() => {
        this.connect();
      }, 5000);
    }
  }

  async updateSetting(key, value) {
    // Update local cache immediately
    if (value === null) {
      delete this.localCache[key];
    } else {
      this.localCache[key] = value;
    }

    // Try WebSocket first
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({
          type: 'settings_change',
          key: key,
          newValue: value
        }));
        return;
      } catch (e) {
        console.log('WebSocket send failed, using HTTP');
      }
    }

    // Fallback to HTTP
    this.pendingUpdates.set(key, value);
    this.processPendingUpdates();
  }

  async processPendingUpdates() {
    if (this.pendingUpdates.size === 0 || this.isApplyingRemote) return;

    try {
      const updates = Object.fromEntries(this.pendingUpdates);
      console.log('Processing pending updates:', updates);
      
      // Try multiple server URLs for HTTP fallback
      const urls = [
        `http://${window.location.hostname}:8889/settings`,
        `http://localhost:8889/settings`,
        `http://127.0.0.1:8889/settings`
      ];
      
      for (const url of urls) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });

          if (response.ok) {
            this.pendingUpdates.clear();
            console.log('Synced pending updates via HTTP:', url);
            return;
          }
        } catch (e) {
          console.log('HTTP sync failed for:', url);
        }
      }
      throw new Error('All HTTP sync URLs failed');
    } catch (e) {
      console.log('Failed to sync pending updates:', e);
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.localCache);
      } catch (e) {
        console.error('Listener error:', e);
      }
    });
  }

  getSetting(key) {
    return this.localCache[key] || localStorage.getItem(key);
  }

  getAllSettings() {
    return { ...this.localCache };
  }
}

// Export singleton
export const globalSettings = new GlobalSettingsAPI();

// Compatibility layer - override localStorage for seamless integration
window.addEventListener('load', () => {
  // Make sure all components use the global settings
  globalSettings.addListener(() => {
    // Dispatch storage events for existing components
    window.dispatchEvent(new Event('storage'));
  });
});
