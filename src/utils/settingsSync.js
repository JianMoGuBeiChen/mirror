// Simple WebSocket-based settings sync
class SettingsSync {
  constructor() {
    this.ws = null;
    this.isHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.reconnectInterval = null;
    this.isApplyingRemote = false;
    this.overrideLocalStorage();
    this.init();
  }

  overrideLocalStorage() {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);
    const originalClear = localStorage.clear.bind(localStorage);

    const dispatchLocalStorageEvent = (key, oldValue, newValue) => {
      try {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key,
            oldValue,
            newValue,
            storageArea: localStorage,
            url: window.location.href,
          })
        );
      } catch (_) {
        // no-op if StorageEvent cannot be constructed
      }
    };

    localStorage.setItem = (key, value) => {
      const oldValue = localStorage.getItem(key);
      originalSetItem(key, value);
      dispatchLocalStorageEvent(key, oldValue, value);
      if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.isApplyingRemote) {
        this.ws.send(
          JSON.stringify({ type: 'settings_change', key, newValue: value, oldValue })
        );
      }
    };

    localStorage.removeItem = (key) => {
      const oldValue = localStorage.getItem(key);
      originalRemoveItem(key);
      dispatchLocalStorageEvent(key, oldValue, null);
      if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.isApplyingRemote) {
        this.ws.send(
          JSON.stringify({ type: 'settings_change', key, newValue: null, oldValue })
        );
      }
    };

    localStorage.clear = () => {
      const keys = Object.keys(localStorage);
      originalClear();
      keys.forEach((key) => dispatchLocalStorageEvent(key, null, null));
      if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.isApplyingRemote) {
        this.ws.send(JSON.stringify({ type: 'settings_clear' }));
      }
    };
  }

  init() {
    // Always connect: host will act as server peer as well
    this.connect();
    
    // Listen for localStorage changes
    window.addEventListener('storage', (e) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.isApplyingRemote) {
        // Broadcast any local change (from settings UI or other code)
        this.ws.send(JSON.stringify({
          type: 'settings_change',
          key: e.key,
          newValue: e.newValue,
          oldValue: e.oldValue
        }));
      }
    });
  }

  connect() {
    try {
      // Prefer same-origin WS path (proxied by dev server) to avoid firewall issues
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const sameOriginUrl = `${protocol}://${window.location.host}/settings-sync`;
      let connected = false;

      const tryConnect = (url, onFail) => {
        try {
          const ws = new WebSocket(url);
          ws.onopen = () => {
            this.ws = ws;
            connected = true;
            console.log('Connected to settings sync:', url);
            if (this.reconnectInterval) {
              clearInterval(this.reconnectInterval);
              this.reconnectInterval = null;
            }
            this.attachHandlers();
          };
          ws.onerror = () => {
            ws.close();
            if (onFail) onFail();
          };
        } catch (_) {
          if (onFail) onFail();
        }
      };

      // Fallback direct port 8889
      const hostIP = window.location.hostname;
      const directUrl = `${protocol}://${hostIP}:8889`;

      tryConnect(sameOriginUrl, () => {
        if (!connected) tryConnect(directUrl);
      });
      
      // Handlers are set after connection to reuse with fallback
      // See attachHandlers
    } catch (error) {
      console.log('Failed to connect to settings sync:', error);
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

  attachHandlers() {
    if (!this.ws) return;
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'settings_change') {
        this.isApplyingRemote = true;
        try {
          if (data.newValue === null) {
            localStorage.removeItem(data.key);
          } else {
            localStorage.setItem(data.key, data.newValue);
          }
        } finally {
          this.isApplyingRemote = false;
        }
      } else if (data.type === 'settings_clear') {
        this.isApplyingRemote = true;
        try {
          localStorage.clear();
        } finally {
          this.isApplyingRemote = false;
        }
      }
    };

    this.ws.onclose = () => {
      console.log('Settings sync disconnected, attempting to reconnect...');
      this.reconnect();
    };

    this.ws.onerror = () => {
      this.reconnect();
    };
  }
}

// Export singleton instance
export const settingsSync = new SettingsSync();
