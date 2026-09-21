export const COLORS = {
  // base
  black: '#000000',

  // neutrals
  white: '#FFFFFF',
  cream: '#FAF6EF',
  warm: '#F0E8D8',
  charcoal: '#2D3A32',
  stone: '#8A9488',
  gray444: '#444444',
  gray555: '#555555',
  gray666: '#666666',
  gray888: '#888888',
  grayCcc: '#CCCCCC',

  // semantic
  red: '#D95B5B',
  redPale: '#FDEAEA',
  redSoft: '#FFB3B3',
  redStrong: '#F44336',
  error: '#D95B5B',
  errorPale: '#FDEAEA',
  orange: '#E8973A',
  amber: '#FF9800',
  green: '#4CAF50',
  greenStrong: '#5BA86A',
  bluePrimary: '#2196F3',

  // sage palette (plants/profile)
  sageDark: '#4E7D62',
  sage: '#7BAF8E',
  sageLight: '#B2D4BC',
  sagePale: '#EEF7F1',

  // sky palette (pills)
  skyDark: '#4E8FAD',
  sky: '#7AAFC9',
  skyPale: '#EBF4FF',

  // teal palette (shopping)
  tealDark: '#2D7A6C',
  teal: '#4E9E8F',
  tealLight: '#A8D5CE',
  tealPale: '#E8F6F4',

  // backgrounds
  bgPlants: '#F2F7FA',
  bgShopping: '#F2FAF8',
  greenPale: '#E8F5E9',
  orangePale: '#FFF3E0',
  successPale: '#E6F6ED',

  // border/divider
  border: '#E0EBF0',
  borderSky: '#E0EBF0',
  borderSoft: '#E0EBE4',
  borderWarm: '#E8E0D4',
  borderMuted: '#E0E8E4',
  borderTeal: '#D8EAE7',
  borderHeader: '#EEF0EE',
  dividerLight: '#F0F0F0',
  dividerLighter: '#F5F5F5',
  dividerRose: '#F0E8E8',
  borderDanger: '#F5C6C6',
  handle: '#DDE5E0',

  // overlays/alpha colors
  overlayBlack40: 'rgba(0,0,0,0.4)',
  overlayBlack45: 'rgba(0,0,0,0.45)',
  overlayBlack50: 'rgba(0, 0, 0, 0.5)',
  overlayCharcoal50: 'rgba(45,58,50,0.5)',
  overlaySage80: 'rgba(78,125,98,0.80)',
  overlaySky82: 'rgba(78,143,173,0.82)',
  white07: 'rgba(255,255,255,0.07)',
  white10: 'rgba(255,255,255,0.1)',
  white15: 'rgba(255,255,255,0.15)',
  white20: 'rgba(255,255,255,0.2)',
  white30: 'rgba(255,255,255,0.3)',
  white35: 'rgba(255,255,255,0.35)',
  white50: 'rgba(255,255,255,0.5)',
  white65: 'rgba(255,255,255,0.65)',
  white75: 'rgba(255,255,255,0.75)',
  white80: 'rgba(255,255,255,0.8)',
  white85: 'rgba(255,255,255,0.85)',
} as const;

export type TColors = typeof COLORS;
