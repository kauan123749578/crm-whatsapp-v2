const DEFAULT_BACKEND_ORIGIN = 'http://localhost:3001';

function stripTrailingSlashes(url) {
  return url.replace(/\/+$/, '');
}

function normalizeBackendOrigin(input) {
  if (!input) return null;
  const cleaned = stripTrailingSlashes(String(input).trim());
  if (!cleaned) return null;

  // Allow passing either the origin (https://host) or the API base (.../api/whatsapp)
  if (cleaned.endsWith('/api/whatsapp')) {
    return cleaned.slice(0, -'/api/whatsapp'.length);
  }

  return cleaned;
}

function warnIfUsingLocalhostDefaults() {
  // Vite env vars are baked at build-time; in production Railway you must set them.
  if (typeof window === 'undefined') return;

  const hasEnv = Boolean(import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL);
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!hasEnv && !isLocal) {
    // eslint-disable-next-line no-console
    console.warn(
      '[config] VITE_API_URL / VITE_SOCKET_URL não definidos. ' +
        'O frontend vai tentar usar localhost e não vai conectar no Railway. ' +
        'Configure as variáveis no serviço WEB e faça redeploy.'
    );
  }
}

export function getBackendOrigin() {
  warnIfUsingLocalhostDefaults();

  const socketEnv = normalizeBackendOrigin(import.meta.env.VITE_SOCKET_URL);
  if (socketEnv) return socketEnv;

  const apiEnv = normalizeBackendOrigin(import.meta.env.VITE_API_URL);
  if (apiEnv) return apiEnv;

  return DEFAULT_BACKEND_ORIGIN;
}

export function getSocketUrl() {
  return getBackendOrigin();
}

export function getApiBaseUrl() {
  warnIfUsingLocalhostDefaults();

  const apiEnvRaw = String(import.meta.env.VITE_API_URL || '').trim();
  if (apiEnvRaw) {
    const cleaned = stripTrailingSlashes(apiEnvRaw);
    if (cleaned.endsWith('/api/whatsapp')) return cleaned;

    const origin = normalizeBackendOrigin(cleaned);
    return `${origin}/api/whatsapp`;
  }

  return `${DEFAULT_BACKEND_ORIGIN}/api/whatsapp`;
}





