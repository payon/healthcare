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
 * next/image builds a srcset from the file, and `sizes` tells the browser
 * which width to fetch, so small screens load fast and large kiosk screens
 * stay sharp. Any load/remote-config failure falls back to a bundled image
 * instead of blanking the tree.
 */
export function ResponsiveImage({
  src,
  fallbackSrc,
  alt,
  width,
  height,
  sizes = '100vw',
  priority,
  className,
}: ResponsiveImageProps) {
  const [failed, setFailed] = useState(false);
  const effectiveSrc = !src || failed ? fallbackSrc : src;

  return (
    <Image
      src={effectiveSrc}
      alt={alt}
      width={width ?? 1344}
      height={height ?? 768}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
