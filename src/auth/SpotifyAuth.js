// Simple Spotify Implicit Grant auth helper for browser-only apps

const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com/authorize';

// Default client id for one-click connect (no manual entry). Replace with yours if needed.
export const DEFAULT_SPOTIFY_CLIENT_ID = 'c0e306fda7564575b2b8173ad25de008';

export const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
];

export function buildSpotifyAuthUrl({ clientId, redirectUri, state }) {
  const params = new URLSearchParams({
    response_type: 'token',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES.join(' '),
    state: state || Math.random().toString(36).slice(2),
    show_dialog: 'true',
  });
  return `${SPOTIFY_ACCOUNTS}?${params.toString()}`;
}

export function parseAccessTokenFromHash(hash) {
  if (!hash || hash[0] !== '#') return null;
  const params = new URLSearchParams(hash.slice(1));
  const accessToken = params.get('access_token');
  const tokenType = params.get('token_type');
  const expiresIn = Number(params.get('expires_in') || '0');
  if (!accessToken) return null;
  const expiresAt = Date.now() + expiresIn * 1000 - 60 * 1000; // refresh 1 min early
  return { accessToken, tokenType, expiresIn, expiresAt };
}


