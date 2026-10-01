// Simple in-memory IP-based rate limiter (single-instance).
// For multi-instance deployments, replace with Redis.

const buckets = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    const retryAfterMs = windowMs - (now - hits[0]);
    return { allowed: false, retryAfterMs };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true, retryAfterMs: 0 };
}

export function getClientIp(request: Request): string {
  // X-Real-IP 우선: Caddy/CloudPanel이 실제 접속 IP로 세팅한다.
  // X-Forwarded-For는 프록시가 뒤에 실제 IP를 append하므로 마지막 값을 사용
  // (첫 값은 클라이언트가 위조 가능 → rate-limit 우회로 악용되던 문제 수정).
  // NOTE: :3100 직접 접속 시 헤더 위조가 가능하므로, 민감 제한(로그인 잠금)은
  // 이메일 기준으로 DB에 강제한다 (lockout.ts — 헤더와 무관).
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return 'unknown';
}

export function safeParseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
