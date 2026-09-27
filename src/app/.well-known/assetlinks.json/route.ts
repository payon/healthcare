import { NextResponse } from 'next/server';

// GET /.well-known/assetlinks.json - Digital Asset Links for TWA packaging.
// Configure via ASSETLINKS_JSON env (the full JSON array from Play Console /
// Bubblewrap). Returns 404 until configured — TWA builders will tell you.
export async function GET() {
  const raw = process.env.ASSETLINKS_JSON;
  if (!raw) {
    return NextResponse.json(
      { error: 'Asset Links not configured (set ASSETLINKS_JSON)' },
      { status: 404 }
    );
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('must be an array');
    return NextResponse.json(parsed, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid ASSETLINKS_JSON' }, { status: 500 });
  }
}
