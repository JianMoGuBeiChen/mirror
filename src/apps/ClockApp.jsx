import React, { useState, useEffect } from 'react';
import { getAppSettings } from '../data/apps';

const ClockApp = ({ appId = 'clock' }) => {
  const [time, setTime] = useState(new Date());
  const [settings, setSettings] = useState(getAppSettings(appId));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSettings(getAppSettings(appId));
  }, [appId]);

  const formatTime = (date) => {
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !settings.format24h
    };

    if (settings.showSeconds) {
      options.second = '2-digit';
    }

    return date.toLocaleTimeString([], options);
  };

  const getFontSize = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-2xl';
      case 'medium': return 'text-4xl';
      case 'large': return 'text-6xl';
      default: return 'text-4xl';
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="text-center">
        <div className={`font-mono font-bold text-white ${getFontSize()}`}>
          {formatTime(time)}
        </div>
        {!settings.format24h && (
          <div className="text-white/70 text-lg mt-1">
            {time.toLocaleTimeString([], { 
              hour12: true 
            }).split(' ')[1]}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClockApp;
