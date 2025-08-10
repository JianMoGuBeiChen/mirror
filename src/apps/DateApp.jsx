import React, { useState, useEffect } from 'react';
import { getAppSettings } from '../data/apps';

const DateApp = ({ appId = 'date' }) => {
  const [date, setDate] = useState(new Date());
  const [settings, setSettings] = useState(getAppSettings(appId));

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSettings(getAppSettings(appId));
  }, [appId]);

  const formatDate = (date) => {
    const options = {
      weekday: 'long',
      month: settings.format === 'short' ? 'short' : 'long',
      day: 'numeric'
    };

    if (settings.showYear) {
      options.year = 'numeric';
    }

    return date.toLocaleDateString([], options);
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-white text-2xl font-light">
          {formatDate(date)}
        </div>
      </div>
    </div>
  );
};

export default DateApp;
