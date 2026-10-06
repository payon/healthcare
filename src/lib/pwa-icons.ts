import { db } from '@/lib/db';

export interface PwaIconSlot {
  slot: string;
  size: number;
  purpose: 'any' | 'maskable';
  label: string;
  description: string;
  defaultUrl: string;
}

export const PWA_ICON_SLOTS: PwaIconSlot[] = [
  {
    slot: 'icon-192',
    size: 192,
    purpose: 'any',
    label: '앱 아이콘 192',
    description: '모바일·태블릿 홈화면, 앱 목록 (any)',
    defaultUrl: '/pwa-icon-192.png',
  },
  {
    slot: 'icon-512',
    size: 512,
    purpose: 'any',
    label: '앱 아이콘 512',
    description: '데스크탑·대형 키오스크 설치, 스플래시 (any)',
    defaultUrl: '/pwa-icon-512.png',
  },
  {
    slot: 'maskable-512',
    size: 512,
    purpose: 'maskable',
    label: '마스크블 512',
    description: 'Android 적응형 아이콘 (80% 세이프존+여백 처리)',
    defaultUrl: '/pwa-maskable-512.png',
  },
  {
    slot: 'apple-180',
    size: 180,
    purpose: 'any',
    label: 'Apple 터치 180',
    description: 'iOS 홈화면 아이콘',
    defaultUrl: '/apple-touch-icon.png',
  },
];

export interface PwaIconState extends PwaIconSlot {
  url: string;
  isDefault: boolean;
  updatedAt: string;
}

/** Ensure all slots exist (defaults point at bundled icons). */
export async function ensurePwaIcons(): Promise<PwaIconState[]> {
  const existing = await db.pwaIcon.findMany();
  const bySlot = new Map(existing.map((r) => [r.slot, r]));
  const out: PwaIconState[] = [];
  for (const slot of PWA_ICON_SLOTS) {
    const row = bySlot.get(slot.slot);
    if (!row) {
      const created = await db.pwaIcon.create({
        data: { slot: slot.slot, url: slot.defaultUrl, size: slot.size, purpose: slot.purpose, isDefault: true },
      });
      out.push({ ...slot, url: created.url, isDefault: true, updatedAt: created.updatedAt.toISOString() });
    } else {
      out.push({
        ...slot,
        url: row.url,
        isDefault: row.isDefault,
        updatedAt: row.updatedAt.toISOString(),
      });
    }
  }
  return out;
}

export function buildManifest(name: string, shortName: string, icons: PwaIconState[]) {
  const iconEntries = icons
    .filter((i) => i.slot !== 'apple-180')
    .map((i) => ({
      src: i.url,
      sizes: `${i.size}x${i.size}`,
      type: 'image/png',
      purpose: i.purpose === 'maskable' ? 'maskable' : 'any',
    }));
  return {
    id: '/',
    name,
    short_name: shortName,
    description: 'Biogram MINI 헬스케어 장비 이용 교육 키오스크',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#f0fdfa',
    theme_color: '#0d9488',
    categories: ['health', 'education', 'medical'],
    lang: 'ko',
    dir: 'ltr',
    icons: iconEntries,
    screenshots: [
      {
        src: '/kiosk-images/screenshot-equipment.jpg',
        sizes: '1344x768',
        type: 'image/jpeg',
        form_factor: 'wide',
      },
      {
        src: '/kiosk-images/screenshot-location.jpg',
        sizes: '1344x768',
        type: 'image/jpeg',
        form_factor: 'wide',
      },
      {
        src: '/kiosk-images/screenshot-equipment-narrow.jpg',
        sizes: '768x1344',
        type: 'image/jpeg',
        form_factor: 'narrow',
      },
      {
        src: '/kiosk-images/screenshot-location-narrow.jpg',
        sizes: '768x1344',
        type: 'image/jpeg',
        form_factor: 'narrow',
      },
    ],
    shortcuts: [
      { name: '장비 소개', url: '/?screen=equipment-intro', icons: [{ src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' }] },
      { name: '설치 위치', url: '/?screen=location', icons: [{ src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' }] },
      { name: '측정 안내', url: '/?screen=measurement-mode', icons: [{ src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' }] },
    ],
    prefer_related_applications: false,
  };
}
