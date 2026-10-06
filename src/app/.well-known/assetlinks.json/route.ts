import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /.well-known/assetlinks.json - Digital Asset Links for TWA (Play Store).
// Set ASSETLINKS_JSON env to a JSON array, e.g.:
//   [{"relation":["delegate_permission/common.handle_all_urls"],"target":{"namespace":"android_app","package_name":"kr.co.biogram.mini","sha256_cert_fingerprints":["AA:BB:..."]}}]
// The SHA-256 comes from Play Console → App integrity → App signing key certificate.
// Until configured, returns an empty array (PWABuilder TWA check will flag it).
export async function GET() {
  try {
    const raw = process.env.ASSETLINKS_JSON || '[]';
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('ASSETLINKS_JSON must be a JSON array');
    return NextResponse.json(parsed, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (error) {
    console.error('AssetLinks error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
