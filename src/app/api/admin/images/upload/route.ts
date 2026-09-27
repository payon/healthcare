import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/admin/middleware';
import { processUpload, isAllowedCategory } from '@/lib/admin/upload';
import { logAudit } from '@/lib/admin/audit';
import { checkRateLimit, getClientIp } from '@/lib/admin/rate-limit';
import { db } from '@/lib/db';

// POST /api/admin/images/upload - Secure image upload (images:upload)
export const POST = withAuth('images:upload', async (request, _context, auth) => {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`upload:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도하세요' },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const category = String(formData.get('category') ?? 'general');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '파일이 필요합니다' }, { status: 400 });
    }
    if (!isAllowedCategory(category)) {
      return NextResponse.json({ error: '허용되지 않은 카테고리입니다' }, { status: 400 });
    }

    const image = await processUpload(file, category);

    // Library record (responsive variants included)
    await db.uploadedImage.create({
      data: {
        url: image.url,
        filename: image.filename,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType,
        size: image.size,
        category,
        variants: JSON.stringify(image.variants),
        uploadedBy: auth.userId,
      },
    });

    await logAudit({
      userId: auth.userId,
      action: 'upload',
      entity: 'Image',
      after: { url: image.url, mimeType: image.mimeType, size: image.size },
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다';
    const status = message.startsWith('지원하지') || message.startsWith('허용되지') || message.startsWith('파일 크기') || message.startsWith('유효한')
      ? 400
      : 500;
    if (status === 500) console.error('Upload error:', error);
    return NextResponse.json({ error: message }, { status });
  }
});
