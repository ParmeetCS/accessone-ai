export interface ColorTheme {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceContainer: string;
  surfaceContainerLow: string;
  surfaceContainerHigh: string;
  border: string;
  primary: string;
  primaryContainer: string;
  primaryFixed: string;
  primaryFixedDim: string;
  onPrimary: string;
  onPrimaryFixed: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  sos: string;
  sosContainer: string;
  onSos: string;
  secondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  warning: string;
  warningContainer: string;
  accent: string;
  cardShadow: string;
}

export const lightColors: ColorTheme = {
  isDark: false,
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceContainer: '#EFF4FF',
  surfaceContainerLow: '#F1F5F9',
  surfaceContainerHigh: '#E2E8F0',
  border: '#E2E8F0',
  primary: '#0D7A5F', // Clinical Teal
  primaryContainer: '#0E836D',
  primaryFixed: '#D1FAE5',
  primaryFixedDim: '#77D8BE',
  onPrimary: '#FFFFFF',
  onPrimaryFixed: '#002019',
  text: '#0F172A', // Dark Slate
  textSecondary: '#475569',
  textMuted: '#64748B',
  sos: '#DC2626', // Emergency Red
  sosContainer: '#FEE2E2',
  onSos: '#FFFFFF',
  secondary: '#545F73',
  secondaryContainer: '#D5E0F8',
  onSecondaryContainer: '#1E293B',
  warning: '#D97706',
  warningContainer: '#FEF3C7',
  accent: '#0D7A5F',
  cardShadow: 'rgba(15, 23, 42, 0.06)',
};

export const highContrastColors: ColorTheme = {
  isDark: true,
  background: '#000000',
  surface: '#121212',
  surfaceContainer: '#1E1E1E',
  surfaceContainerLow: '#181818',
  surfaceContainerHigh: '#2A2A2A',
  border: '#404040',
  primary: '#1ABC9C', // Bright high contrast teal/cyan
  primaryContainer: '#16A085',
  primaryFixed: '#003B2F',
  primaryFixedDim: '#1ABC9C',
  onPrimary: '#000000',
  onPrimaryFixed: '#FFFFFF',
  text: '#FFFFFF', // Pure White
  textSecondary: '#E2E8F0',
  textMuted: '#CBD5E1',
  sos: '#FF3B30',
  sosContainer: '#450A0A',
  onSos: '#FFFFFF',
  secondary: '#94A3B8',
  secondaryContainer: '#1E293B',
  onSecondaryContainer: '#F1F5F9',
  warning: '#FBBF24',
  warningContainer: '#451A03',
  accent: '#1ABC9C',
  cardShadow: 'rgba(255, 255, 255, 0.1)',
};
