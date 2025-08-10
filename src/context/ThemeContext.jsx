import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Fun, descriptive themes with accent colors
const THEMES = [
  { id: 'emerald', name: 'Emerald Glow', accent: '#10B981', preview: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.05))' },
  { id: 'midnight', name: 'Midnight Blue', accent: '#3B82F6', preview: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.05))' },
  { id: 'aurora', name: 'Aurora Violet', accent: '#8B5CF6', preview: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(139,92,246,0.05))' },
  { id: 'sunset', name: 'Sunset Amber', accent: '#F59E0B', preview: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.05))' },
  { id: 'neon', name: 'Neon Mint', accent: '#2DD4BF', preview: 'linear-gradient(135deg, rgba(45,212,191,0.25), rgba(45,212,191,0.05))' },
  { id: 'cyber', name: 'Cyber Grape', accent: '#A78BFA', preview: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(167,139,250,0.05))' },
];

// Fun typography packs
const FONT_PACKS = [
  {
    id: 'minimal-modern',
    name: 'Minimal Modern',
    primary: 'Inter',
    mono: 'JetBrains Mono',
    previewText: 'Aa',
  },
  {
    id: 'neon-grid',
    name: 'Neon Grid', // futuristic
    primary: 'Orbitron',
    mono: 'Roboto Mono',
    previewText: 'AƎ',
  },
  {
    id: 'playground-pop',
    name: 'Playground Pop', // fun
    primary: 'Fredoka',
    mono: 'JetBrains Mono',
    previewText: 'Aa',
  },
  {
    id: 'doodle-laughs',
    name: 'Doodle Laughs', // funny
    primary: 'Patrick Hand',
    mono: 'Inconsolata',
    previewText: ':)',
  },
  {
    id: 'mythic-serif',
    name: 'Mythic Serif', // epic
    primary: 'Cinzel',
    mono: 'Inconsolata',
    previewText: 'Aa',
  },
];

const STORAGE_KEY = 'smartMirrorTheme';
const FONT_STORAGE_KEY = 'smartMirrorFont';

const ThemeContext = createContext({
  theme: THEMES[0],
  themes: THEMES,
  setThemeId: (_id) => {},
  fontPack: FONT_PACKS[0],
  fontPacks: FONT_PACKS,
  setFontId: (_id) => {},
});

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'emerald';
  });
  const [fontId, setFontId] = useState(() => {
    return localStorage.getItem(FONT_STORAGE_KEY) || 'minimal-modern';
  });

  const theme = useMemo(() => THEMES.find(t => t.id === themeId) || THEMES[0], [themeId]);
  const fontPack = useMemo(() => FONT_PACKS.find(f => f.id === fontId) || FONT_PACKS[0], [fontId]);

  // Persist and expose CSS variable for accent color
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme.id);
    } catch (_) {}
    document.documentElement.style.setProperty('--accent', theme.accent);
  }, [theme]);

  // Persist and expose CSS variables for fonts
  useEffect(() => {
    try {
      localStorage.setItem(FONT_STORAGE_KEY, fontPack.id);
    } catch (_) {}
    document.documentElement.style.setProperty('--font-primary', fontPack.primary);
    document.documentElement.style.setProperty('--font-mono', fontPack.mono);
  }, [fontPack]);

  // Respond to storage changes from other tabs/windows
  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem(STORAGE_KEY) || 'emerald';
      setThemeId(stored);
      const storedFont = localStorage.getItem(FONT_STORAGE_KEY) || 'minimal-modern';
      setFontId(storedFont);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const value = useMemo(() => ({ 
    theme, themes: THEMES, setThemeId,
    fontPack, fontPacks: FONT_PACKS, setFontId,
  }), [theme, fontPack]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);


