const GENERAL_KEY = 'smartMirrorGeneral';

const DEFAULTS = {
  glowMode: 'on', // 'on' | 'off' | 'hover'
  mirrorEnabled: true,
  backgroundStyle: 'black', // 'black' | 'frosted' | 'liquid' | 'arctic' | 'ember' | 'smoke'
};

// Helper to get settings from either localStorage or global settings API
const getRawSettings = () => {
  try {
    const { globalSettings } = require('../utils/globalSettings');
    return globalSettings.getSetting(GENERAL_KEY);
  } catch (e) {
    return localStorage.getItem(GENERAL_KEY);
  }
};

// Helper to save settings to both localStorage and global settings API
const saveRawSettings = (value) => {
  localStorage.setItem(GENERAL_KEY, value);
  
  try {
    const { globalSettings } = require('../utils/globalSettings');
    globalSettings.updateSetting(GENERAL_KEY, value);
  } catch (e) {
    // Fallback to localStorage only
  }
};

export const getGeneralSettings = () => {
  try {
    const raw = getRawSettings();
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
};

export const saveGeneralSettings = (partial) => {
  const current = getGeneralSettings();
  const next = { ...current, ...partial };
  saveRawSettings(JSON.stringify(next));
};


