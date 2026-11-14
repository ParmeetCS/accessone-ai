import { create } from 'zustand';
import { FontScale } from '../theme/typography';
import * as Haptics from 'expo-haptics';

export type SensoryProfileType = 'vision' | 'hearing' | 'dual' | 'cognitive';
export type HapticIntensityType = 'light' | 'medium' | 'heavy';

interface UserState {
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  setHighContrast: (val: boolean) => void;

  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  cycleFontScale: (direction: 'up' | 'down' | 'std') => void;

  speechRate: number;
  setSpeechRate: (rate: number) => void;

  sensoryProfile: SensoryProfileType;
  setSensoryProfile: (profile: SensoryProfileType) => void;

  hapticIntensity: HapticIntensityType;
  setHapticIntensity: (intensity: HapticIntensityType) => void;

  sosCountdownSeconds: number;
  setSosCountdownSeconds: (sec: number) => void;

  patientName: string;
  careRingOnline: boolean;
  toggleCareRing: () => void;
}

const SCALE_CYCLE: FontScale[] = ['sm', 'std', 'lg', 'xl'];

export const useUserStore = create<UserState>((set, get) => ({
  isHighContrast: false,
  toggleHighContrast: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    set((state) => ({ isHighContrast: !state.isHighContrast }));
  },
  setHighContrast: (val) => set({ isHighContrast: val }),

  fontScale: 'std',
  setFontScale: (scale) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    set({ fontScale: scale });
  },
  cycleFontScale: (direction) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (direction === 'std') {
      set({ fontScale: 'std' });
      return;
    }
    const current = get().fontScale;
    const currentIndex = SCALE_CYCLE.indexOf(current);
    if (direction === 'up') {
      const nextIndex = Math.min(SCALE_CYCLE.length - 1, currentIndex + 1);
      set({ fontScale: SCALE_CYCLE[nextIndex] });
    } else {
      const nextIndex = Math.max(0, currentIndex - 1);
      set({ fontScale: SCALE_CYCLE[nextIndex] });
    }
  },

  speechRate: 1.0,
  setSpeechRate: (rate) => set({ speechRate: rate }),

  sensoryProfile: 'dual',
  setSensoryProfile: (profile) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    set({ sensoryProfile: profile });
  },

  hapticIntensity: 'medium',
  setHapticIntensity: (intensity) => set({ hapticIntensity: intensity }),

  sosCountdownSeconds: 3,
  setSosCountdownSeconds: (sec) => set({ sosCountdownSeconds: sec }),

  patientName: 'Sarah Jenkins',
  careRingOnline: true,
  toggleCareRing: () => set((state) => ({ careRingOnline: !state.careRingOnline })),
}));
