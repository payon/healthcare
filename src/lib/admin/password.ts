import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * HaveIBeenPwned k-anonymity breach check. Returns the breach count (0 = clean).
 * Fail-open on network error (kiosk LAN may be offline) with a warning —
 * local complexity policy in schemas.ts remains the enforced baseline.
 */
export async function checkPasswordBreach(password: string): Promise<number> {
  try {
    const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'biogram-kiosk-admin' },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HIBP status ${res.status}`);
    const text = await res.text();
    for (const line of text.split('\n')) {
      const [hashSuffix, count] = line.trim().split(':');
      if (hashSuffix === suffix) return parseInt(count, 10) || 0;
    }
    return 0;
  } catch (error) {
    console.warn('Password breach check unavailable (fail-open):', error);
    return 0;
  }
}

/** Reject known-breached passwords; throws with a user-facing message. */
export async function rejectBreachedPassword(password: string): Promise<void> {
  const count = await checkPasswordBreach(password);
  if (count > 0) {
    throw new Error('유출된 비밀번호입니다. 다른 비밀번호를 사용하세요');
  }
}
