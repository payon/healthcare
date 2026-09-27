'use client';

import Image from 'next/image';
import { useState } from 'react';

interface SafeImageProps {
  src: string;
  fallbackSrc: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

/**
 * DB-driven image renderer. next/image throws at render time for hosts
 * outside remotePatterns — without this guard a single bad admin-entered
 * URL unmounts the whole kiosk tree (blank screen). Falls back to a
 * bundled placeholder on load error or empty src.
 */
export function SafeImage({
  src,
  fallbackSrc,
  alt,
  width,
  height,
  fill,
  priority,
  className,
  sizes,
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const effectiveSrc = !src || failed ? fallbackSrc : src;

  if (fill) {
    return (
      <Image
        src={effectiveSrc}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={effectiveSrc}
      alt={alt}
      width={width ?? 800}
      height={height ?? 450}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
