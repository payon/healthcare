# Task ID: 2 — Agent: mobile-ui

## What was done

### FILE 1: `src/components/kiosk/MobileBottomNav.tsx`
- 5-tab fixed bottom navigation bar (홈/장비/안내/측정/더보기)
- Hidden on desktop via `md:hidden`
- Active tab detection with parent screen mapping (signup/vein-register/login → 안내, etc.)
- iOS safe area padding, min 56px touch targets, active indicator dot
- Uses `useKioskStore` for `currentScreen` and `navigateTo`

### FILE 2: `src/components/kiosk/AccessibilityToolbar.tsx`
- 3 font size options: 보통/크게/아주 크게
- Mobile: inline button bar with size 'A' glyphs + labels
- Desktop: floating pill at top-right with framer-motion expand/collapse
- Uses `useKioskStore` for `fontSize` and `setFontSize`

### FILE 3: `src/components/kiosk/MainMenu.tsx` (rewritten)
- **Progress bar**: Shows `학습 진행률 N/M (N%)` with animated bar, visible on both mobile & desktop
- **Desktop**: Preserved 3-column grid with 11 menu items + staggered animations
- **Mobile**: Horizontal scrollable category cards (9 items, snap-x) replacing grid
- **Mobile header**: Title + inline AccessibilityToolbar
- **Mobile CTA**: Fixed '실제 장비로 이동' button above bottom nav
- **Mobile nav**: Renders MobileBottomNav, hides KioskFooter
- **Both**: Notice box preserved

## Key design decisions
- Bottom nav uses `matches` array per tab for flexible screen-to-tab mapping
- Desktop AccessibilityToolbar is a floating pill to not obstruct content
- Mobile uses `pb-[env(safe-area-inset-bottom)]` for iOS notch
- Bottom spacer `h-28` on mobile accounts for fixed CTA + bottom nav

## Files modified
- Created: `src/components/kiosk/MobileBottomNav.tsx`
- Created: `src/components/kiosk/AccessibilityToolbar.tsx`  
- Rewritten: `src/components/kiosk/MainMenu.tsx`
- Updated: `worklog.md`
