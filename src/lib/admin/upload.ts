import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

// SVG는 Stored-XSS 위험으로 전면 거부. GIF 외에는 sharp 재인코딩을 강제하여
// 매직바이트 검증을 수행한다.
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const UPLOAD_ROUTE_PREFIX = '/admin-uploads';

export const SERVABLE_EXTENSIONS = ['.webp', '.gif', '.png', '.jpg', '.jpeg'] as const;

/**
 * Canonical upload directory. Must survive `next build` (which wipes .next)
 * and must not depend on process.cwd(), because the standalone server may run
 * with cwd=.next/standalone while `next dev` runs with cwd=project root.
 * Override with UPLOAD_DIR env when deploying.
 */
export function getUploadBaseDir(): string {
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
  const cwd = process.cwd();
  // <project>/.next/standalone → <project>/public/admin-uploads
  if (cwd.endsWith(`${path.sep}.next${path.sep}standalone`)) {
    return path.join(cwd, '..', '..', 'public', 'admin-uploads');
  }
  return path.join(cwd, 'public', 'admin-uploads');
}

/** Legacy rescue location (files written while cwd was .next/standalone). Read-only fallback. */
export function getLegacyUploadBaseDir(): string {
  const cwd = process.cwd();
  if (cwd.endsWith(`${path.sep}.next${path.sep}standalone`)) {
    return path.join(cwd, 'public', 'admin-uploads');
  }
  return path.join(cwd, '.next', 'standalone', 'public', 'admin-uploads');
}

const ALLOWED_CATEGORIES = ['general', 'content', 'equipment', 'banner'] as const;
export type UploadCategory = (typeof ALLOWED_CATEGORIES)[number];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 2048;

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  width: number;
  height: number;
  mimeType: string;
  variants: Array<{ url: string; width: number }>;
}

// Responsive variant widths (never upscaled): mobile ~360px → 32" kiosk 1080p+.
const VARIANT_WIDTHS = [640, 1280, 1920];

export function isAllowedCategory(value: string): value is UploadCategory {
  return (ALLOWED_CATEGORIES as readonly string[]).includes(value);
}

export async function processUpload(file: File, category: string): Promise<UploadResult> {
  if (!isAllowedCategory(category)) {
    throw new Error('허용되지 않은 카테고리입니다');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`지원하지 않는 파일 형식입니다: ${file.type}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`파일 크기가 ${MAX_FILE_SIZE / 1024 / 1024}MB를 초과합니다`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // sharp로 재인코딩 → 매직바이트 검증 + 메타데이터 스트립(EXIF 제거)
  let image: sharp.Sharp;
  try {
    image = sharp(buffer, { failOnError: true });
    await image.metadata();
  } catch {
    throw new Error('유효한 이미지 파일이 아닙니다');
  }

  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    image = image.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  let processedBuffer: Buffer;
  let mimeType: string;
  if (file.type === 'image/gif') {
    processedBuffer = await image.toBuffer();
    mimeType = 'image/gif';
  } else {
    processedBuffer = await image.webp({ quality: 85 }).toBuffer();
    mimeType = 'image/webp';
  }

  const ext = mimeType === 'image/webp' ? 'webp' : 'gif';
  const baseName = `${Date.now()}-${randomUUID().slice(0, 8)}`;

  const now = new Date();
  const dateDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const relativeDir = `${category}/${dateDir}`;
  const publicDir = path.join(getUploadBaseDir(), relativeDir);

  // category는 allowlist로 검증済み, 파일명은 서버 생성 → traversal 불가
  await fs.mkdir(publicDir, { recursive: true });

  const newMetadata = await sharp(processedBuffer).metadata().catch(() => null);
  const finalWidth = newMetadata?.width ?? width;
  const finalHeight = newMetadata?.height ?? height;

  // Responsive variants (static images only; animated GIF stays single-file).
  // Never upscale: widths capped at the actual image width.
  const variants: Array<{ url: string; width: number }> = [];
  let canonicalUrl: string;
  let canonicalSize = processedBuffer.length;

  if (mimeType === 'image/webp' && finalWidth > 0) {
    const targets = VARIANT_WIDTHS.filter((w) => w < finalWidth);
    for (const w of targets) {
      const name = `${baseName}-w${w}.${ext}`;
      const buf = await sharp(processedBuffer).resize(w, null, { withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      await fs.writeFile(path.join(publicDir, name), buf);
      variants.push({ url: `${UPLOAD_ROUTE_PREFIX}/${relativeDir}/${name}`, width: w });
    }
    const uniqueName = `${baseName}.${ext}`;
    await fs.writeFile(path.join(publicDir, uniqueName), processedBuffer);
    canonicalUrl = `${UPLOAD_ROUTE_PREFIX}/${relativeDir}/${uniqueName}`;
    variants.push({ url: canonicalUrl, width: finalWidth });
  } else {
    const uniqueName = `${baseName}.${ext}`;
    await fs.writeFile(path.join(publicDir, uniqueName), processedBuffer);
    canonicalUrl = `${UPLOAD_ROUTE_PREFIX}/${relativeDir}/${uniqueName}`;
    variants.push({ url: canonicalUrl, width: finalWidth });
  }

  return {
    url: canonicalUrl,
    filename: `${baseName}.${ext}`,
    size: canonicalSize,
    width: finalWidth,
    height: finalHeight,
    mimeType,
    variants,
  };
}
