import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apps, saveAppSettings, toggleAppEnabled } from '../data/apps';

const Settings = () => {
  const [settings, setSettings] = useState({});
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem('smartMirrorSettings') || '{}');
    setSettings(savedSettings);
  }, []);

  const handleToggleApp = (appId, enabled) => {
    toggleAppEnabled(appId, enabled);
    setSettings(prev => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        enabled
      }
    }));
    
    // Trigger storage event for other components
    window.dispatchEvent(new Event('storage'));
  };

  const handleSettingChange = (appId, settingKey, value) => {
    const newSettings = {
      ...settings,
      [appId]: {
        ...settings[appId],
        settings: {
          ...settings[appId]?.settings,
          [settingKey]: value
        }
      }
    };
    
    setSettings(newSettings);
    saveAppSettings(appId, { [settingKey]: value });
    
    // Trigger storage event for other components
    window.dispatchEvent(new Event('storage'));
  };

  const isAppEnabled = (appId) => {
    return settings[appId]?.enabled !== false; // Default to true
  };

  const getAppSetting = (appId, settingKey, defaultValue) => {
    return settings[appId]?.settings?.[settingKey] ?? defaultValue;
  };

  const renderAppSettings = (app) => {
    switch (app.id) {
      case 'clock':
        return (
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={getAppSetting('clock', 'format24h', false)}
                  onChange={(e) => handleSettingChange('clock', 'format24h', e.target.checked)}
                  className="rounded"
                />
                <span>24-hour format</span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={getAppSetting('clock', 'showSeconds', true)}
                  onChange={(e) => handleSettingChange('clock', 'showSeconds', e.target.checked)}
                  className="rounded"
                />
                <span>Show seconds</span>
              </label>
            </div>
            <div>
              <label className="block mb-2">Font Size</label>
              <select
                value={getAppSetting('clock', 'fontSize', 'large')}
                onChange={(e) => handleSettingChange('clock', 'fontSize', e.target.value)}
                className="bg-gray-700 text-white rounded px-3 py-2 w-full"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        );

      case 'date':
        return (
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Date Format</label>
              <select
                value={getAppSetting('date', 'format', 'long')}
                onChange={(e) => handleSettingChange('date', 'format', e.target.value)}
                className="bg-gray-700 text-white rounded px-3 py-2 w-full"
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={getAppSetting('date', 'showYear', true)}
                  onChange={(e) => handleSettingChange('date', 'showYear', e.target.checked)}
                  className="rounded"
                />
                <span>Show year</span>
              </label>
            </div>
          </div>
        );

      case 'weather':
        return (
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Location</label>
              <input
                type="text"
                placeholder="Enter city name"
                value={getAppSetting('weather', 'location', '')}
                onChange={(e) => handleSettingChange('weather', 'location', e.target.value)}
                className="bg-gray-700 text-white rounded px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block mb-2">Temperature Units</label>
              <select
                value={getAppSetting('weather', 'units', 'fahrenheit')}
                onChange={(e) => handleSettingChange('weather', 'units', e.target.value)}
                className="bg-gray-700 text-white rounded px-3 py-2 w-full"
              >
                <option value="fahrenheit">Fahrenheit</option>
                <option value="celsius">Celsius</option>
              </select>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={getAppSetting('weather', 'showDetails', true)}
                  onChange={(e) => handleSettingChange('weather', 'showDetails', e.target.checked)}
                  className="rounded"
                />
                <span>Show weather details</span>
              </label>
            </div>
          </div>
        );

      case 'news':
        return (
          <div className="space-y-4">
            <div>
              <label className="block mb-2">News Source</label>
              <select
                value={getAppSetting('news', 'source', 'general')}
                onChange={(e) => handleSettingChange('news', 'source', e.target.value)}
                className="bg-gray-700 text-white rounded px-3 py-2 w-full"
              >
                <option value="general">General</option>
                <option value="technology">Technology</option>
                <option value="business">Business</option>
                <option value="science">Science</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Max Items</label>
              <select
                value={getAppSetting('news', 'maxItems', 5)}
                onChange={(e) => handleSettingChange('news', 'maxItems', parseInt(e.target.value))}
                className="bg-gray-700 text-white rounded px-3 py-2 w-full"
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Refresh Interval</label>
              <select
                value={getAppSetting('news', 'refreshInterval', 300000)}
                onChange={(e) => handleSettingChange('news', 'refreshInterval', parseInt(e.target.value))}
                className="bg-gray-700 text-white rounded px-3 py-2 w-full"
              >
                <option value={60000}>1 minute</option>
                <option value={300000}>5 minutes</option>
                <option value={600000}>10 minutes</option>
                <option value={1800000}>30 minutes</option>
              </select>
            </div>
          </div>
        );

      case 'handtracking':
        return (
          <div className="space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-yellow-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Camera Permission Required</span>
              </div>
              <p className="text-sm text-yellow-300 mt-2">
                This app requires access to your camera for hand tracking. Make sure to allow camera permissions when prompted.
              </p>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={getAppSetting('handtracking', 'enabled', false)}
                  onChange={(e) => handleSettingChange('handtracking', 'enabled', e.target.checked)}
                  className="rounded"
                />
                <span>Enable Hand Tracking</span>
              </label>
              <p className="text-sm text-gray-400 mt-1">
                Track your index finger to control a cursor on the mirror
              </p>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={getAppSetting('handtracking', 'showPreview', false)}
                  onChange={(e) => handleSettingChange('handtracking', 'showPreview', e.target.checked)}
                  className="rounded"
                  disabled={!getAppSetting('handtracking', 'enabled', false)}
                />
                <span>Show Camera Preview</span>
              </label>
              <p className="text-sm text-gray-400 mt-1">
                Display camera feed with hand landmarks in the Hand Tracking app
              </p>
            </div>

            <div>
              <label className="block mb-2">Cursor Sensitivity</label>
              <select
                value={getAppSetting('handtracking', 'sensitivity', 1.0)}
                onChange={(e) => handleSettingChange('handtracking', 'sensitivity', parseFloat(e.target.value))}
                className="bg-gray-700 text-white rounded px-3 py-2 w-full"
                disabled={!getAppSetting('handtracking', 'enabled', false)}
              >
                <option value={0.5}>Low</option>
                <option value={1.0}>Normal</option>
                <option value={1.5}>High</option>
                <option value={2.0}>Very High</option>
              </select>
              <p className="text-sm text-gray-400 mt-1">
                Adjust how responsive the cursor is to hand movements
              </p>
            </div>

            <div>
              <label className="block mb-2">Movement Smoothing</label>
              <select
                value={getAppSetting('handtracking', 'smoothing', 0.8)}
                onChange={(e) => handleSettingChange('handtracking', 'smoothing', parseFloat(e.target.value))}
                className="bg-gray-700 text-white rounded px-3 py-2 w-full"
                disabled={!getAppSetting('handtracking', 'enabled', false)}
              >
                <option value={0.2}>Minimal</option>
                <option value={0.5}>Low</option>
                <option value={0.8}>Normal</option>
                <option value={0.9}>High</option>
              </select>
              <p className="text-sm text-gray-400 mt-1">
                Reduce cursor jitter with movement smoothing
              </p>
            </div>

            <div>
              <label className="block mb-2">
                Pinch Sensitivity: {Math.round(getAppSetting('handtracking', 'pinchSensitivity', 0.2) * 100)}%
              </label>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={getAppSetting('handtracking', 'pinchSensitivity', 0.2)}
                onChange={(e) => handleSettingChange('handtracking', 'pinchSensitivity', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                disabled={!getAppSetting('handtracking', 'enabled', false)}
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${getAppSetting('handtracking', 'pinchSensitivity', 0.2) * 200}%, #374151 ${getAppSetting('handtracking', 'pinchSensitivity', 0.2) * 200}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Very Sensitive (5%)</span>
                <span>Less Sensitive (50%)</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Lower values = easier to trigger pinch, higher values = need tighter pinch
              </p>
            </div>
          </div>
        );

      default:
        return <div className="text-gray-400">No settings available for this app.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Smart Mirror Settings</h1>
          <Link 
            to="/"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            Back to Mirror
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* App List */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Apps</h2>
            <div className="space-y-2">
              {apps.map(app => (
                <div 
                  key={app.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedApp?.id === app.id 
                      ? 'bg-blue-600 border-blue-500' 
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                  }`}
                  onClick={() => setSelectedApp(app)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{app.name}</h3>
                      <p className="text-sm text-gray-400">{app.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAppEnabled(app.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleApp(app.id, e.target.checked);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* App Settings */}
          <div className="lg:col-span-2">
            {selectedApp ? (
              <div>
                <h2 className="text-xl font-semibold mb-4">{selectedApp.name} Settings</h2>
                <div className="bg-gray-800 p-6 rounded-lg">
                  {isAppEnabled(selectedApp.id) ? (
                    renderAppSettings(selectedApp)
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <div className="text-4xl mb-4">📱</div>
                      <p>Enable this app to configure its settings</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-4">⚙️</div>
                  <p>Select an app to configure its settings</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
