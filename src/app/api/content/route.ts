import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const contents = await db.kioskContent.findMany({
      orderBy: { section: 'asc' },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    });
    return NextResponse.json(contents);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, title, body: content, imageUrl, qrCodeUrl } = body;

    if (!section || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const upserted = await db.kioskContent.upsert({
      where: { section },
      update: {
        title,
        body: content || '',
        imageUrl: imageUrl || null,
        qrCodeUrl: qrCodeUrl || null,
      },
      create: {
        section,
        title,
        body: content || '',
        imageUrl: imageUrl || null,
        qrCodeUrl: qrCodeUrl || null,
      },
    });

    return NextResponse.json(upserted);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
