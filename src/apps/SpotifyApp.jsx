import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const TOKEN_KEY = 'spotify_token';

function getStoredToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const token = JSON.parse(raw);
    if (token && token.expiresAt && Date.now() < token.expiresAt) return token;
    return null;
  } catch {
    return null;
  }
}

const SpotifyApp = ({ appId = 'spotify' }) => {
  const { theme } = useTheme();
  const [track, setTrack] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef(null);
  const [token, setToken] = useState(() => getStoredToken());

  // If token gets saved by callback, update here
  useEffect(() => {
    const onStorage = () => {
      const t = getStoredToken();
      setToken(t);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const fetchCurrentlyPlaying = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${token.accessToken}` },
      });
      if (res.status === 204) {
        setTrack(null);
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json || !json.item) {
        setTrack(null);
        return;
      }
      const item = json.item;
      const albumImage = item.album?.images?.[0]?.url;
      setTrack({
        title: item.name,
        album: item.album?.name,
        artist: item.artists?.[0]?.name,
        image: albumImage,
      });
    } catch (e) {
      setError('Unable to fetch Spotify track');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchCurrentlyPlaying();
    pollingRef.current = setInterval(fetchCurrentlyPlaying, 5000);
    return () => pollingRef.current && clearInterval(pollingRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token?.accessToken]);

  if (!token) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-2xl mb-2" style={{ color: theme.accent }}>🎵</div>
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Sign in to Spotify in Settings to enable this widget
          </div>
        </div>
      </div>
    );
  }

  if (loading && !track) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center" style={{ color: theme.accent }}>Unable to fetch Spotify</div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Not playing
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 flex flex-col items-center">
      <div className="w-full flex-1 flex items-center justify-center">
        {/* Album cover */}
        {track.image ? (
          <img src={track.image} alt={track.album} className="w-40 h-40 object-cover rounded-lg shadow-lg" />
        ) : (
          <div className="w-40 h-40 rounded-lg bg-white/10" />
        )}
      </div>
      {/* Song and album */}
      <div className="mt-3 text-center">
        <div className="text-white font-semibold text-sm truncate max-w-[240px]">{track.title}</div>
        <div className="text-xs mt-1" style={{ color: theme.accent }}>{track.album}</div>
      </div>
    </div>
  );
};

export default SpotifyApp;


