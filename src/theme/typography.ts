export type FontScale = 'sm' | 'std' | 'lg' | 'xl';

export const FONT_SCALE_MULTIPLIERS: Record<FontScale, number> = {
  sm: 0.9,
  std: 1.0,
  lg: 1.15,
  xl: 1.3,
};

export const BASE_FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
};

export function scaleFont(baseSize: number, scale: FontScale): number {
  return Math.round(baseSize * FONT_SCALE_MULTIPLIERS[scale]);
}
