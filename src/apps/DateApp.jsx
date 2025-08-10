import React, { useMemo, useState, useEffect } from 'react';
import { getAppSettings } from '../data/apps';
import { useTheme } from '../context/ThemeContext';
import { useElementSize } from '../hooks/useElementSize';

const DateApp = ({ appId = 'date' }) => {
  const [date, setDate] = useState(new Date());
  const [settings, setSettings] = useState(getAppSettings(appId));
  const { theme } = useTheme();
  const { ref, width, height } = useElementSize();

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSettings(getAppSettings(appId));
  }, [appId]);

  // Live update when settings change elsewhere
  useEffect(() => {
    const handleStorage = () => setSettings(getAppSettings(appId));
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
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

  const fontSize = useMemo(() => {
    const safeW = Math.max(1, width);
    const safeH = Math.max(1, height);
    // Assume average date length ~ 18 chars with spaces
    const estChars = 18;
    const charWidthFactor = 0.52;
    const byWidth = (safeW * 0.96) / (estChars * charWidthFactor);
    const byHeight = safeH * 0.6;
    return Math.max(16, Math.min(72, Math.floor(Math.min(byWidth, byHeight))));
  }, [width, height]);

  return (
    <div ref={ref} className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="font-light leading-none" style={{ fontSize: `${fontSize}px`, color: 'white' }}>
          {formatDate(date)}
          <span className="ml-1 align-middle inline-block rounded-full" style={{ background: theme.accent, width: Math.max(4, fontSize * 0.12), height: Math.max(4, fontSize * 0.12) }} />
        </div>
      </div>
    </div>
  );
};

export default DateApp;
