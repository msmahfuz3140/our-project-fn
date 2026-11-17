/**
 * Only allow same-origin, absolute-path redirects within a known set of app
 * areas. This prevents `?redirect=https://evil.example` (and protocol-relative
 * `//evil.example`) open-redirect abuse after login.
 *
 * The whitelist intentionally covers authenticated destinations only. Anything
 * else falls back to the default dashboard entry point.
 */
const ALLOWED_REDIRECT_PREFIXES = [
  '/dashboard',
  '/plans',
  '/profile',
  '/settings',
  '/change-password',
  '/heda'
] as const;

function isWhitelistedPath(pathname: string): boolean {
  return ALLOWED_REDIRECT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function sanitizeRedirectPath(
  value: string | null | undefined,
  fallback = '/dashboard/tool'
): string {
  if (!value) return fallback;

  const trimmed = value.trim();
  if (!trimmed.startsWith('/')) return fallback;
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return fallback;
  if (/[\r\n]/.test(trimmed)) return fallback;

  try {
    const parsed = new URL(trimmed, 'https://internal.invalid');
    if (parsed.origin !== 'https://internal.invalid') return fallback;
    if (!isWhitelistedPath(parsed.pathname)) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
