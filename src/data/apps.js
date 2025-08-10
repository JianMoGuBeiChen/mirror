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

export const getEnabledApps = () => {
  const settings = JSON.parse(localStorage.getItem('smartMirrorSettings') || '{}');
  return apps.filter(app => settings[app.id]?.enabled !== false);
};

export const getAppSettings = (appId) => {
  const settings = JSON.parse(localStorage.getItem('smartMirrorSettings') || '{}');
  const app = apps.find(a => a.id === appId);
  return {
    ...app?.settings,
    ...settings[appId]?.settings
  };
};

export const saveAppSettings = (appId, newSettings) => {
  const settings = JSON.parse(localStorage.getItem('smartMirrorSettings') || '{}');
  if (!settings[appId]) {
    settings[appId] = {};
  }
  settings[appId].settings = { ...settings[appId].settings, ...newSettings };
  localStorage.setItem('smartMirrorSettings', JSON.stringify(settings));
};

export const toggleAppEnabled = (appId, enabled) => {
  const settings = JSON.parse(localStorage.getItem('smartMirrorSettings') || '{}');
  if (!settings[appId]) {
    settings[appId] = {};
  }
  settings[appId].enabled = enabled;
  localStorage.setItem('smartMirrorSettings', JSON.stringify(settings));
};
