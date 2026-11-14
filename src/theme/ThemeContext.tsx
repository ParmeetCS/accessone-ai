import React, { createContext, useContext, useMemo } from 'react';
import { ColorTheme, lightColors, highContrastColors } from './colors';
import { FontScale, scaleFont as scaleFontUtil } from './typography';
import { useUserStore } from '../store/userStore';

interface ThemeContextValue {
  colors: ColorTheme;
  isHighContrast: boolean;
  fontScale: FontScale;
  scaleFont: (baseSize: number) => number;
  toggleHighContrast: () => void;
  cycleFontScale: (direction: 'up' | 'down' | 'std') => void;
  setFontScale: (scale: FontScale) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isHighContrast: false,
  fontScale: 'std',
  scaleFont: (size) => size,
  toggleHighContrast: () => {},
  cycleFontScale: () => {},
  setFontScale: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isHighContrast = useUserStore((state) => state.isHighContrast);
  const toggleHighContrast = useUserStore((state) => state.toggleHighContrast);
  const fontScale = useUserStore((state) => state.fontScale);
  const cycleFontScale = useUserStore((state) => state.cycleFontScale);
  const setFontScale = useUserStore((state) => state.setFontScale);

  const colors = useMemo(() => {
    return isHighContrast ? highContrastColors : lightColors;
  }, [isHighContrast]);

  const scaleFont = useMemo(() => {
    return (baseSize: number) => scaleFontUtil(baseSize, fontScale);
  }, [fontScale]);

  const value = useMemo(
    () => ({
      colors,
      isHighContrast,
      fontScale,
      scaleFont,
      toggleHighContrast,
      cycleFontScale,
      setFontScale,
    }),
    [colors, isHighContrast, fontScale, scaleFont, toggleHighContrast, cycleFontScale, setFontScale]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => useContext(ThemeContext);
