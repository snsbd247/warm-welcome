/**
 * Environment Detection — Smart switching between Lovable preview and Laravel backend
 */

const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

/** Running on Lovable preview (no Laravel backend available) */
export const IS_LOVABLE =
  hostname.endsWith('.lovableproject.com') ||
  hostname.endsWith('.lovable.app') ||
  hostname.endsWith('.lovable.dev');

/** Running on localhost or private network IP */
export const IS_LOCAL_DEV =
  !IS_LOVABLE && (
    /^(localhost|127\.0\.0\.1)$/.test(hostname) ||
    /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)
  );

/** Running on production (any non-local, non-Lovable domain) */
export const IS_CPANEL = !IS_LOCAL_DEV && !IS_LOVABLE && hostname !== '';

/** Whether a real Laravel backend is available */
export const HAS_BACKEND = IS_LOCAL_DEV || IS_CPANEL;
