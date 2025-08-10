import React, { useState, useEffect, useMemo } from 'react';
import { getAppSettings } from '../data/apps';
import { useTheme } from '../context/ThemeContext';
import { useElementSize } from '../hooks/useElementSize';

const ClockApp = ({ appId = 'clock' }) => {
  const [time, setTime] = useState(new Date());
  const [settings, setSettings] = useState(getAppSettings(appId));
  const { theme } = useTheme();
  const { ref, width, height } = useElementSize();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

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

  const layout = useMemo(() => {
    const safeW = Math.max(1, width);
    const safeH = Math.max(1, height);
    const vertical = safeH > safeW * 1.2;
    const hhmmChars = 5; // HH:MM
    const includeSeconds = settings.showSeconds;
    const secondsUnits = includeSeconds ? 3 : 0; // :ss
    const charWidthFactor = 0.62; // monospace approx width ratio
    const totalUnits = hhmmChars + secondsUnits * 0.6; // seconds narrower
    const maxByWidth = (safeW * 0.96) / (charWidthFactor * totalUnits);
    const maxByHeight = safeH * (vertical ? 0.48 : 0.7);
    const hhmmSize = Math.max(24, Math.min(240, Math.min(maxByWidth, maxByHeight)));
    const secSize = Math.max(16, Math.min(160, Math.floor(hhmmSize * 0.55)));
    const ampmSize = Math.max(14, Math.min(120, Math.floor(hhmmSize * 0.4)));
    return { hhmmSize, secSize, ampmSize, vertical };
  }, [width, height, settings.showSeconds]);

  const timeString = formatTime(time);
  const parts = timeString.split(':');
  const hasSeconds = parts.length === 3;
  const hhmm = hasSeconds ? `${parts[0]}:${parts[1]}` : timeString;
  const seconds = hasSeconds ? parts[2].split(' ')[0] : null;
  const ampm = !settings.format24h ? time.toLocaleTimeString([], { hour12: true }).split(' ')[1] : null;

  return (
    <div ref={ref} className="w-full h-full flex items-center justify-center">
      <div className={layout.vertical ? 'flex flex-col items-center' : 'flex items-baseline items-center'}>
        <div
          className="font-mono font-bold text-white leading-none"
          style={{ fontSize: `${layout.hhmmSize}px` }}
        >
          {hhmm}
        </div>
        {settings.showSeconds && seconds && (
          <div
            className={layout.vertical ? 'mt-0.5' : 'ml-1'}
            style={{ color: theme.accent, fontSize: `${layout.secSize}px`, lineHeight: 1 }}
          >
            :{seconds}
          </div>
        )}
        {ampm && (
          <div
            className={layout.vertical ? 'mt-0.5' : 'ml-1'}
            style={{ color: theme.accent, fontSize: `${layout.ampmSize}px`, lineHeight: 1 }}
          >
            {ampm}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClockApp;
