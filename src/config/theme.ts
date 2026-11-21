/**
 * Chillbro Mobile App Theme & Design Tokens
 * Extracted directly from Chillbro Web Platform
 */

export const colors = {
  // Brand & Accents
  gold: {
    primary: '#D4AF37',
    hover: '#E5C058',
    dark: '#B38F24',
    soft: '#FDF8EC',
    text: '#C8A038',
  },

  // Dark Header & Navigation
  dark: {
    darkest: '#0D0F12',
    bg: '#16191E',
    card: '#1E2229',
    border: '#2A2F3A',
  },

  // Light Surfaces & Neutrals
  surface: {
    white: '#FFFFFF',
    light: '#F8FAFC',
    subtle: '#F1F5F9',
    border: '#E2E8F0',
    borderSubtle: '#EDF2F7',
  },

  // Typography
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
    onDark: '#FFFFFF',
    onDarkSecondary: '#CBD5E1',
  },

  // Semantic & Badges
  status: {
    badgeDanger: '#EF4444',
    error: '#EF4444',
    ratingStar: '#F59E0B',
    success: '#10B981',
    deliveryText: '#D97706',
    deliveryBg: '#FEF3C7',
    inStockBg: '#DCFCE7',
    inStockText: '#15803D',
    outOfStockBg: '#FEE2E2',
    outOfStockText: '#B91C1C',
  },
};

export const typography = {
  h1: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodySemiBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  eyebrow: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export default {
  colors,
  typography,
  spacing,
  radii,
};
