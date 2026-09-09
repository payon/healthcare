import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import type { Role } from './rbac';

const SECRET_KEY = process.env.JWT_SECRET || 'biogram-mini-admin-secret-key-2026';
const SECRET = new TextEncoder().encode(SECRET_KEY);
const EXPIRY = '8h';

export const COOKIE_NAME = 'admin_session';

export interface SessionPayload {
  userId: string;
  role: Role;
}

export async function createSession(userId: string, role: Role): Promise<string> {
  const token = await new SignJWT({ userId, role } as SessionPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET);

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
    const { payload } = await jwtVerify<SessionPayload>(token, SECRET);

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
    const token = cookieStore.get(COOKIE_NAME)?.value;

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

export function setSessionCookie(response: Response, token: string): Response {
  response.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${8 * 60 * 60}`
  );
  return response;
}

export function clearSessionCookie(response: Response): Response {
  response.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
  );
  return response;
}
