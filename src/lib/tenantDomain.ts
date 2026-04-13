/**
 * Detect whether the current browser domain is a tenant domain
 * (subdomain like isp1.smartispapp.com or a custom domain)
 * vs the central SaaS domain (smartispapp.com, www.smartispapp.com, localhost, lovable.app).
 */

const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';

// Central domains that show the landing page
const CENTRAL_DOMAINS = [
  'smartispapp.com',
  'www.smartispapp.com',
];

function isCentralDomain(): boolean {
  // Exact match with central domains
  if (CENTRAL_DOMAINS.includes(hostname)) return true;

  // Localhost / dev
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) return true;

  // Lovable preview/published domains
  if (hostname.endsWith('.lovable.app') || hostname.endsWith('.lovableproject.com') || hostname.endsWith('.lovable.dev')) return true;

  return false;
}

/**
 * Returns true if the current domain belongs to a tenant
 * (i.e. NOT a central/SaaS domain).
 */
export function isTenantDomain(): boolean {
  if (!hostname) return false;
  return !isCentralDomain();
}
