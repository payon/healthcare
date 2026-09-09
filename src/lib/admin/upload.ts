import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSION = 2048;

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  width: number;
  height: number;
  mimeType: string;
}

export async function processUpload(
  file: File,
  category: string
): Promise<UploadResult> {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`지원하지 않는 파일 형식입니다: ${file.type}`);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`파일 크기가 ${MAX_FILE_SIZE / 1024 / 1024}MB를 초과합니다`);
  }

  // Read file buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Process with sharp (skip SVG)
  let processedBuffer: Buffer;
  let width: number;
  let height: number;
  let mimeType = file.type;

  if (file.type === 'image/svg+xml') {
    processedBuffer = buffer;
    width = 0;
    height = 0;
  } else {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    width = metadata.width ?? 0;
    height = metadata.height ?? 0;

    // Resize if dimensions exceed max
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      image.resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to webp for optimization (unless original is GIF with animation)
    if (file.type === 'image/gif') {
      processedBuffer = await image.toBuffer();
    } else {
      processedBuffer = await image.webp({ quality: 85 }).toBuffer();
      mimeType = 'image/webp';

      // Get new dimensions after resize
      const newMetadata = await sharp(processedBuffer).metadata();
      width = newMetadata.width ?? width;
      height = newMetadata.height ?? height;
    }
  }

  // Generate filename and path
  const now = new Date();
  const dateDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const ext = mimeType === 'image/webp' ? 'webp' : file.name.split('.').pop() ?? 'bin';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const relativeDir = `admin-uploads/${category}/${dateDir}`;
  const publicDir = path.join(process.cwd(), 'public', relativeDir);
  const filePath = path.join(publicDir, uniqueName);
  const url = `/${relativeDir}/${uniqueName}`;

  // Ensure directory exists
  await fs.mkdir(publicDir, { recursive: true });

  // Write file
  await fs.writeFile(filePath, processedBuffer);

  return {
    url,
    filename: uniqueName,
    size: processedBuffer.length,
    width,
    height,
    mimeType,
  };
}
