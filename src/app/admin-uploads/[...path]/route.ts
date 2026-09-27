import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import {
  getUploadBaseDir,
  getLegacyUploadBaseDir,
  SERVABLE_EXTENSIONS,
} from '@/lib/admin/upload';

type RouteContext = { params: Promise<{ path: string[] }> };

const MIME_BY_EXT: Record<string, string> = {
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const SEGMENT = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

// GET /admin-uploads/... — serve uploaded images from disk.
// Replaces reliance on Next static public/ serving, which in standalone mode
// only serves files copied at BUILD time (runtime uploads 404'd).
// Public (kiosk images must load unauthenticated); traversal-safe by construction.
export async function GET(_request: Request, context: RouteContext) {
  const { path: parts } = await context.params;

  if (!parts || parts.length === 0 || parts.length > 5) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  for (const seg of parts) {
    if (!SEGMENT.test(seg) || seg === '.' || seg === '..') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }
  const ext = path.extname(parts[parts.length - 1]).toLowerCase();
  if (!(SERVABLE_EXTENSIONS as readonly string[]).includes(ext)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const bases = [getUploadBaseDir(), getLegacyUploadBaseDir()];
  for (const base of bases) {
    const resolved = path.resolve(base, ...parts);
    // Belt-and-suspenders: resolved path must stay inside the base dir.
    if (resolved !== base && !resolved.startsWith(base + path.sep)) continue;
    try {
      const stat = await fs.stat(resolved);
      if (!stat.isFile()) continue;
      const data = await fs.readFile(resolved);
      return new NextResponse(new Uint8Array(data), {
        status: 200,
        headers: {
          'Content-Type': MIME_BY_EXT[ext] ?? 'application/octet-stream',
          'Content-Length': String(data.length),
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch {
      // try next base
    }
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
