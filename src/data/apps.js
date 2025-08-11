export const apps = [
  {
    id: 'clock',
    name: 'Clock',
    description: 'Digital clock with customizable format',
    componentPath: 'ClockApp',
    enabled: true,
    defaultPosition: { x: 50, y: 50 },
    defaultSize: { width: 300, height: 120 },
    settings: {
      format24h: false,
      showSeconds: true,
      fontSize: 'large'
    }
  },
  {
    id: 'date',
    name: 'Date',
    description: 'Current date display',
    componentPath: 'DateApp',
    enabled: true,
    defaultPosition: { x: 50, y: 200 },
    defaultSize: { width: 250, height: 80 },
    settings: {
      format: 'long', // 'short', 'medium', 'long'
      showYear: true
    }
  },
  {
    id: 'weather',
    name: 'Weather',
    description: 'Current weather conditions',
    componentPath: 'WeatherApp',
    enabled: true,
    defaultPosition: { x: 400, y: 50 },
    defaultSize: { width: 320, height: 200 },
    settings: {
      location: '',
      units: 'fahrenheit', // 'celsius', 'fahrenheit'
      showDetails: true
    }
  },
  {
    id: 'news',
    name: 'News',
    description: 'Latest news headlines',
    componentPath: 'NewsApp',
    enabled: true,
    defaultPosition: { x: 50, y: 400 },
    defaultSize: { width: 400, height: 250 },
    settings: {
      source: 'general',
      maxItems: 5,
      refreshInterval: 300000 // 5 minutes
    }
  },
  {
    id: 'spotify',
    name: 'Spotify',
    description: 'Currently playing track',
    componentPath: 'SpotifyApp',
    enabled: false,
    defaultPosition: { x: 750, y: 400 },
    defaultSize: { width: 280, height: 260 },
    settings: {
      clientId: '',
      clientSecret: '',
      redirectUri: `${window.location.origin}/callback`
    }
  },
  {
    id: 'handtracking',
    name: 'Hand Tracking',
    description: 'Camera-based hand tracking with cursor control',
    componentPath: 'HandTrackingApp',
    enabled: false,
    isBackgroundService: true, // This app runs in background, not displayed as widget
    defaultPosition: { x: 800, y: 50 },
    defaultSize: { width: 350, height: 300 },
    settings: {
      enabled: false,
      showPreview: false,
      sensitivity: 1.0,
      smoothing: 0.8,
      pinchSensitivity: 0.2 // Default 20% (0.0-1.0 range)
    }
  }
];

// Helper to get settings from either localStorage or global settings API
const getSettings = () => {
  // Try to import global settings, but fallback to localStorage if not available
  try {
    const { globalSettings } = require('../utils/globalSettings');
    const settings = globalSettings.getSetting('smartMirrorSettings');
    console.log('Getting app settings from global:', settings);
    return JSON.parse(settings || '{}');
  } catch (e) {
    console.log('Fallback to localStorage for app settings');
    return JSON.parse(localStorage.getItem('smartMirrorSettings') || '{}');
  }
};

// Helper to save settings to both localStorage and global settings API
const saveSettings = (settings) => {
  const settingsJson = JSON.stringify(settings);
  console.log('Saving app settings:', settingsJson);
  
  // Save to localStorage first for immediate access
  localStorage.setItem('smartMirrorSettings', settingsJson);
  
  // Also save to global settings if available
  try {
    const { globalSettings } = require('../utils/globalSettings');
    globalSettings.updateSetting('smartMirrorSettings', settingsJson);
    console.log('Saved to global settings successfully');
  } catch (e) {
    console.log('Failed to save to global settings:', e);
  }
};

export const getEnabledApps = () => {
  const settings = getSettings();
  return apps.filter(app => settings[app.id]?.enabled !== false);
};

export const getAppSettings = (appId) => {
  const settings = getSettings();
  const app = apps.find(a => a.id === appId);
  return {
    ...app?.settings,
    ...settings[appId]?.settings
  };
};

export const saveAppSettings = (appId, newSettings) => {
  const settings = getSettings();
  if (!settings[appId]) {
    settings[appId] = {};
  }
  settings[appId].settings = { ...settings[appId].settings, ...newSettings };
  saveSettings(settings);
};

export const toggleAppEnabled = (appId, enabled) => {
  const settings = getSettings();
  if (!settings[appId]) {
    settings[appId] = {};
  }
  settings[appId].enabled = enabled;
  saveSettings(settings);
};
