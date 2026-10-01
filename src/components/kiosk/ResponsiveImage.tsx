'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ResponsiveImageProps {
  src: string;
  fallbackSrc: string;
  alt: string;
  width?: number;
  height?: number;
  /** Kiosk-tuned default: heroes span the full viewport on every device. */
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Senior-friendly responsive image for kiosks (mobile 360px → 32" 1080p+).
 * 16:9 고정 크롭: 원본 비율·기기 크기와 무관하게 항상 같은 크기로 보인다.
 * next/image builds a srcset from the file, and `sizes` tells the browser
 * which width to fetch, so small screens load fast and large kiosk screens
 * stay sharp. Any load/remote-config failure falls back to a bundled image
 * instead of blanking the tree.
 */
export function ResponsiveImage({
  src,
  fallbackSrc,
  alt,
  sizes = '100vw',
  priority,
}: ResponsiveImageProps) {
  const [failed, setFailed] = useState(false);
  const effectiveSrc = !src || failed ? fallbackSrc : src;

  return (
    <div className="relative aspect-video w-full overflow-hidden">
      <Image
        src={effectiveSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
