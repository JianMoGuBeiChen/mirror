import React, { useState, useEffect } from 'react';
import { getAppSettings } from '../data/apps';

const WeatherApp = ({ appId = 'weather' }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(getAppSettings(appId));

  useEffect(() => {
    setSettings(getAppSettings(appId));
  }, [appId]);

  useEffect(() => {
    if (settings.location) {
      fetchWeather();
    }
  }, [settings.location, settings.units]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchWeather = async () => {
    if (!settings.location) return;
    
    setLoading(true);
    setError('');
    
    try {
      // First, geocode the location
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(settings.location)}&count=1&language=en&format=json`
      );
      
      if (!geoRes.ok) throw new Error('Location lookup failed');
      
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('Location not found');
      }
      
      const location = geoData.results[0];
      const { latitude, longitude } = location;
      
      // Fetch weather data
      const tempUnit = settings.units === 'celsius' ? 'celsius' : 'fahrenheit';
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=${tempUnit}&timezone=auto`
      );
      
      if (!weatherRes.ok) throw new Error('Weather fetch failed');
      
      const weatherJson = await weatherRes.json();
      setWeatherData({
        ...weatherJson.current_weather,
        location: `${location.name}${location.admin1 ? ', ' + location.admin1 : ''}`
      });
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Unable to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (weatherCode) => {
    const iconMap = {
      0: '☀️', 1: '🌤️', 2: '⛅️', 3: '☁️',
      45: '🌫️', 48: '🌫️',
      51: '🌦️', 53: '🌦️', 55: '🌦️',
      56: '🌧️', 57: '🌧️',
      61: '🌧️', 63: '🌧️', 65: '🌧️',
      66: '🌧️', 67: '🌧️',
      71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️',
      80: '🌧️', 81: '🌧️', 82: '🌧️',
      85: '🌨️', 86: '🌨️',
      95: '⛈️', 96: '⛈️', 99: '⛈️'
    };
    return iconMap[weatherCode] || '❓';
  };

  const getWeatherDescription = (weatherCode) => {
    const descMap = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing rime fog',
      51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
      56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
      61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
      66: 'Light freezing rain', 67: 'Heavy freezing rain',
      71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
      80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
      85: 'Slight snow showers', 86: 'Heavy snow showers',
      95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
    };
    return descMap[weatherCode] || 'Unknown';
  };

  if (!settings.location) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center text-white/70">
          <div className="text-lg mb-2">🌤️</div>
          <div className="text-sm">Set location in settings</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-white/70">Loading weather...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center text-red-400">
          <div className="text-lg mb-2">❌</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-white/70">No weather data</div>
      </div>
    );
  }

  const tempUnit = settings.units === 'celsius' ? '°C' : '°F';

  return (
    <div className="w-full h-full flex flex-col p-4">
      <div className="text-center">
        <div className="text-4xl mb-2">
          {getWeatherIcon(weatherData.weathercode)}
        </div>
        <div className="text-white text-2xl font-bold">
          {Math.round(weatherData.temperature)}{tempUnit}
        </div>
        <div className="text-white/70 text-sm mt-1">
          {weatherData.location}
        </div>
        {settings.showDetails && (
          <div className="text-white/50 text-xs mt-1">
            {getWeatherDescription(weatherData.weathercode)}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherApp;
