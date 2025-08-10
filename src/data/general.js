const GENERAL_KEY = 'smartMirrorGeneral';

const DEFAULTS = {
  glowMode: 'on', // 'on' | 'off' | 'hover'
  mirrorEnabled: true,
  backgroundStyle: 'black', // 'black' | 'frosted' | 'liquid' | 'arctic' | 'ember' | 'smoke'
};

export const getGeneralSettings = () => {
  try {
    const raw = localStorage.getItem(GENERAL_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
};

export const saveGeneralSettings = (partial) => {
  const current = getGeneralSettings();
  const next = { ...current, ...partial };
  localStorage.setItem(GENERAL_KEY, JSON.stringify(next));
};


