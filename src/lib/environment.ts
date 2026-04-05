/**
 * Environment Detection — Smart switching between Lovable preview and Laravel backend
 *
 * Lovable-hosted apps (including custom domains) always have VITE_SUPABASE_PROJECT_ID set at build time.
 * When a custom domain points to Lovable hosting there is NO Laravel backend,
 * so we must detect this and use Supabase edge functions instead.
 */

const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

/** Lovable sets this env var automatically at build time for every project */
const hasLovableBuildMarker = !!import.meta.env.VITE_SUPABASE_PROJECT_ID;

/** Running on a known Lovable preview/published domain */
const isLovableDomain =
  hostname.endsWith('.lovableproject.com') ||
  hostname.endsWith('.lovable.app') ||
  hostname.endsWith('.lovable.dev');

/** Running on localhost or private network IP */
export const IS_LOCAL_DEV =
  !isLovableDomain && (
    /^(localhost|127\.0\.0\.1)$/.test(hostname) ||
    /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)
  );

/**
 * Running on Lovable hosting (preview, published, OR custom domain).
 * Custom domains on Lovable hosting don't match *.lovable.app but the build
 * marker is still present and there is no Laravel backend.
 *
 * On localhost we always assume a Laravel backend is available, so IS_LOVABLE is false.
 */
export const IS_LOVABLE = isLovableDomain || (hasLovableBuildMarker && !IS_LOCAL_DEV);

/** Running on production cPanel with Laravel backend (not Lovable, not localhost) */
export const IS_CPANEL = !IS_LOCAL_DEV && !IS_LOVABLE && hostname !== '';

/** Whether a real Laravel backend is available */
export const HAS_BACKEND = IS_LOCAL_DEV || IS_CPANEL;
