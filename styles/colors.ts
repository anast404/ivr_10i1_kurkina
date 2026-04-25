export const COLORS = {
  // neutrals
  white: '#FFFFFF',
  cream: '#FAF6EF',
  warm: '#F0E8D8',
  charcoal: '#2D3A32',
  stone: '#8A9488',

  // semantic
  red: '#D95B5B',
  redPale: '#FDEAEA',
  error: '#D95B5B',
  errorPale: '#FDEAEA',
  orange: '#E8973A',
  green: '#4CAF50',
  greenStrong: '#5BA86A',

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
  border: '#E0EBF0',
  borderSky: '#E0EBF0',
} as const;

export type TColors = typeof COLORS;
