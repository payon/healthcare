import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Admin-curated content only (public content PUT removed). next/image
    // throws at render time for non-matching hosts, which would blank the
    // kiosk — so remote admin images are allowed and SafeImage guards load
    // failures with a bundled fallback.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            // NOTE: script-src 'unsafe-inline'은 Next.js App Router의 인라인
            // 부트스트랩 스크립트(flight data/하이드레이션)에 필수. 해시/넌스로
            // 대체 불가(빌드마다 변경 + 동적 데이터). object-src 'none',
            // frame-ancestors 'none' 등 나머지 지시문으로 보완.
            // NOTE: upgrade-insecure-requests는 HTTPS 서빙 때만 활성화할 것.
            // 평문 HTTP에서 켜면 브라우저가 모든 리소스를 https로 업그레이드해
            // ERR_SSL_PROTOCOL_ERROR로 전멸한다.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              // Admin-curated image links (incl. external http(s) equipment photos
              // and CSS background-image URLs, which are NOT proxied through
              // /_next/image). Public content PUT is removed, so only RBAC
              // admins can register these URLs.
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self'",
              "font-src 'self' data:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
