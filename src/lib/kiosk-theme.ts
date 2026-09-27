import type { CSSProperties } from 'react';

/**
 * Admin-driven screen theme. backgroundImageUrl (cover) wins over
 * backgroundColor; a solid backgroundColor suppresses the screen's default
 * gradient (backgroundImage: 'none'), otherwise the gradient would paint
 * over the color. Empty values = keep screen defaults.
 */
export function themeStyle(
  backgroundColor?: string | null,
  backgroundImageUrl?: string | null
): CSSProperties {
  if (backgroundImageUrl) {
    return {
      backgroundImage: `url("${backgroundImageUrl}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }
  if (backgroundColor) {
    return { backgroundColor, backgroundImage: 'none' };
  }
  return {};
}
