// ─── SKIN IQ — Shared Design System ─────────────────────────────────────────
// Warm Ivory × Deep Indigo × Vivid Coral — maximum contrast, elegant light theme

export const COLORS = {
  // Backgrounds
  bg:           '#FAF8F5',   // warm ivory
  bgAlt:        '#F2EEF8',   // soft lavender tint
  card:         '#FFFFFF',
  cardElevated: '#FDFCFB',

  // Primary — Deep Indigo
  ink:          '#1E1B4B',   // near-black indigo
  inkMid:       '#3730A3',   // medium indigo
  inkLight:     '#EEF2FF',   // very light indigo tint

  // Accent — Vivid Coral
  coral:        '#F25C38',   // vivid coral/orange-red
  coralLight:   '#FEF0EC',
  coralDark:    '#C43E20',

  // Supporting
  teal:         '#0D9488',
  tealLight:    '#CCFBF1',
  rose:         '#E11D48',
  roseLight:    '#FFE4E6',
  amber:        '#D97706',
  amberLight:   '#FEF3C7',
  violet:       '#7C3AED',
  violetLight:  '#EDE9FE',
  emerald:      '#059669',
  emeraldLight: '#D1FAE5',

  // Text
  text:         '#111827',   // near-black
  textMid:      '#4B5563',
  textSoft:     '#9CA3AF',
  textXLight:   '#D1D5DB',

  // Border
  border:       '#E5E7EB',
  borderLight:  '#F3F4F6',
};

export const RADII = {
  sm: 8, md: 14, lg: 20, xl: 28, full: 999,
};

export const SHADOW = {
  sm: { shadowColor: '#1E1B4B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  md: { shadowColor: '#1E1B4B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 5 },
  lg: { shadowColor: '#1E1B4B', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.14, shadowRadius: 28, elevation: 10 },
  coral: { shadowColor: '#F25C38', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
};
