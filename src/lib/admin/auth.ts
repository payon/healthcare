import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import type { Role } from './rbac';

function getSecret(): Uint8Array {
  const key = process.env.JWT_SECRET;
  if (!key || key.length < 32) {
    throw new Error(
      'JWT_SECRET is not configured (min 32 chars). Refusing to sign/verify sessions.'
    );
  }
  return new TextEncoder().encode(key);
}

// __Host- prefix requires Secure + Path=/ + no Domain, and browsers never
// send Secure cookies over plain HTTP. The deployment runs a production build
// over plain HTTP (LAN kiosk), so cookie security MUST follow the actual
// connection (request protocol / x-forwarded-proto), never NODE_ENV.
// Before this fix, prod-over-HTTP set a Secure __Host- cookie the browser
// stored but never sent back → login "succeeds" then every /admin page
// bounces to /admin/login forever.
export const SECURE_COOKIE_NAME = '__Host-admin_session';
export const COOKIE_NAME = 'admin_session';
const EXPIRY = '8h';
const MAX_AGE = 8 * 60 * 60;

export function isSecureRequest(request: Request): boolean {
  const forwarded = request.headers.get('x-forwarded-proto');
  if (forwarded) return forwarded.split(',')[0].trim().toLowerCase() === 'https';
  try {
    return new URL(request.url).protocol === 'https:';
  } catch {
    return false;
  }
}

function cookieFlags(secure: boolean): string {
  return `HttpOnly${secure ? '; Secure' : ''}; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`;
}

/** Read the session token from either cookie name (secure or plain). */
export function getTokenFromCookies(
  get: (name: string) => string | undefined
): string | undefined {
  return get(SECURE_COOKIE_NAME) ?? get(COOKIE_NAME);
}

export interface SessionPayload extends JWTPayload {
  userId: string;
  role: Role;
}

export async function createSession(userId: string, role: Role): Promise<string> {
  // jti guarantees uniqueness: without it, two logins in the same second
  // produce byte-identical tokens (same sub/iat/secret) and the second
  // AdminSession insert fails on the UNIQUE(token) constraint (500 on login).
  const token = await new SignJWT({ userId, role } as SessionPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());

  // Calculate expiry time (8 hours from now)
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

  // Save session to database
  await db.adminSession.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecret());

    // Check session exists in DB and is not expired
    const session = await db.adminSession.findUnique({
      where: { token },
      select: { expiresAt: true },
    });

    if (!session || session.expiresAt < new Date()) {
      // Clean up expired session
      if (session) {
        await db.adminSession.delete({ where: { token } }).catch(() => {});
      }
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = getTokenFromCookies((name) => cookieStore.get(name)?.value);

    if (!token) return null;

    const payload = await verifySession(token);
    if (!payload) return null;

    const user = await db.adminUser.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) return null;

    return { ...user, role: user.role as Role };
  } catch {
    return null;
  }
}

export function setSessionCookie(response: Response, token: string, secure: boolean): Response {
  const name = secure ? SECURE_COOKIE_NAME : COOKIE_NAME;
  response.headers.append('Set-Cookie', `${name}=${token}; ${cookieFlags(secure)}`);
  return response;
}

export function clearSessionCookie(response: Response): Response {
  // Clear both names: the client may hold either (or a stale one).
  response.headers.append(
    'Set-Cookie',
    `${SECURE_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
  );
  response.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`
  );
  return response;
}

export async function revokeUserSessions(userId: string): Promise<void> {
  await db.adminSession.deleteMany({ where: { userId } }).catch(() => {});
}
