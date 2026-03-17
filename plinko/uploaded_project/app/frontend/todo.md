# Plinko Clicker Game - Development Plan

## Design Guidelines

### Design References
- High-end mobile casino apps (dark theme with neon glow)
- Plinko game mechanics from gambling sites

### Color Palette
- Primary Background: #0a0014 (Deep Purple-Black)
- Secondary Background: #1a0a2e (Dark Purple)
- Card Background: #150825 (Purple-Black)
- Gold Accent: #FFD700 / #F59E0B
- Neon Purple: #A855F7 / #7C3AED
- Neon Green: #22C55E (wins)
- Neon Red: #EF4444 (losses)
- Text Primary: #FFFFFF
- Text Secondary: #A78BFA

### Typography
- Font: Inter / system-ui
- Large numbers: font-black, gradient text
- UI text: font-semibold

### Key Component Styles
- Buttons: Large, rounded, gradient backgrounds with glow effects
- Cards: Glass-morphism with purple tint
- Canvas: Full-width with neon glow border

## Files to Create (7 files max)

1. **src/pages/Index.tsx** - Main game page, layout, state management
2. **src/components/PlinkoCanvas.tsx** - HTML5 Canvas Plinko board with physics
3. **src/components/GameControls.tsx** - Tap button, drop ball button, balance display
4. **src/components/ConversionPopup.tsx** - Premium popup after 15 drops
5. **src/components/LanguageSelector.tsx** - RU/UA/EN language picker
6. **src/lib/i18n.ts** - Translations for all 3 languages
7. **src/lib/plinkoEngine.ts** - Physics engine for Plinko simulation

## No images needed - all visuals are CSS/Canvas rendered