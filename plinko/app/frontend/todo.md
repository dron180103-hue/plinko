# Plinko Game - Visual & UX Overhaul

## Design Guidelines
- **Style**: Neon Casino / Dark Premium
- **Colors**: Deep purple (#06000f) base, neon purple (#a855f7), amber (#f59e0b), emerald (#10b981)
- **Effects**: Glow, pulse, scale on tap, gradient shimmer, confetti on big wins
- **Layout**: h-dvh flex column, NO scrolling on game tab

## Tasks

1. **GameTab.tsx** - Completely rewrite for compact no-scroll layout:
   - Combine balance + level into one compact row
   - Merge bet/ball controls into minimal 2-row layout
   - Remove verbose stats, show only essential info
   - Compact action buttons with neon glow effects
   - Remove history section from default view

2. **Index.tsx** - Restructure main layout:
   - Use `h-dvh` with flex to prevent any scrolling on game tab
   - Canvas takes ~40% of screen height
   - Controls fill remaining space compactly
   - Add daily money offer popup (once per day, full-screen)
   - Add PWA install banner
   - Add win animations (confetti particles)

3. **DailyOffer.tsx** - New component:
   - Full-screen overlay with countdown timer
   - Premium visual design with gradients
   - "Buy coins for real money" offer
   - Shows once per day, stored in localStorage
   - Close button after 3 seconds

4. **PWA Setup**:
   - manifest.json in public/
   - Service worker (sw.js) in public/
   - Update index.html with manifest link + SW registration
   - Install banner component

5. **i18n.ts** - Add new translation keys for daily offer and PWA

## Files to modify:
- src/components/GameTab.tsx (rewrite)
- src/pages/Index.tsx (restructure)
- src/components/DailyOffer.tsx (new)
- src/lib/i18n.ts (add keys)
- public/manifest.json (new)
- public/sw.js (new)
- index.html (update)