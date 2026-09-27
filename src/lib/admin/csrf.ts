// CSRF defense-in-depth for cookie-authenticated mutations.
// SameSite=Strict is the primary guard; this rejects cross-site requests that
// carry a forged Origin/Referer even in older browsers. Requests WITHOUT
// Origin/Referer (curl, same-origin form posts) are allowed — only a
// *mismatched* origin is rejected.

function requestHost(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-host');
  if (forwarded) return forwarded.split(',')[0].trim().toLowerCase();
  const host = request.headers.get('host');
  if (host) return host.toLowerCase();
  try {
    return new URL(request.url).host.toLowerCase();
  } catch {
    return '';
  }
}

function headerHost(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

export function isSafeMethod(request: Request): boolean {
  return request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS';
}

export function isOriginAllowed(request: Request): boolean {
  if (isSafeMethod(request)) return true;

  const host = requestHost(request);
  const origin = headerHost(request.headers.get('origin'));
  if (origin) return origin === host;

  // No Origin (non-CORS form/curl): fall back to Referer when present.
  const referer = headerHost(request.headers.get('referer'));
  if (referer) return referer === host;

  return true;
}
