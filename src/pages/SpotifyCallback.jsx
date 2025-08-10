import React, { useEffect } from 'react';
import { parseAccessTokenFromHash } from '../auth/SpotifyAuth';

const TOKEN_KEY = 'spotify_token';

const SpotifyCallback = () => {
  useEffect(() => {
    const parsed = parseAccessTokenFromHash(window.location.hash);
    if (parsed) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(parsed));
      try { window.dispatchEvent(new Event('storage')); } catch (_) {}
    }
    // Redirect back to settings
    window.location.replace('/settings');
  }, []);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
      Processing Spotify sign-in...
    </div>
  );
};

export default SpotifyCallback;


