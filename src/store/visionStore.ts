import { create } from 'zustand';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useUserStore } from './userStore';

export type VisionMode = 'ocr' | 'describe' | 'objects' | 'barcode';

export interface DetectionResult {
  title: string;
  category: string;
  confidence: number;
  labelText: string;
  warningText?: string;
  distance: string;
  lux: number;
  timestamp: string;
}

const DEFAULT_OCR_RESULT: DetectionResult = {
  title: 'Prescription Medication Bottle',
  category: 'Pharmaceutical Oral Antibiotic',
  confidence: 99.4,
  labelText: 'Amoxicillin 500mg – Take 1 capsule twice daily with food. Prescribed by Dr. Patel. Expiry: 12/2026. Rx #492810',
  warningText: 'Finish entire course even if symptoms subside. If severe rash or swelling occurs, cease intake and trigger SOS immediately.',
  distance: '18 cm',
  lux: 480,
  timestamp: 'Just now',
};

const DEFAULT_SCENE_RESULT: DetectionResult = {
  title: 'Clinical Consultation Room',
  category: 'Spatial Scene Overview',
  confidence: 97.8,
  labelText: 'Interior clinical exam room. Table at 1.2m directly ahead with prescription bottle. Doctor Patel seated at 2.5m on your right. Clear walking path to door at 10 o\'clock.',
  warningText: 'Low step threshold near doorway. Lighting level optimal (520 Lux).',
  distance: '1.2 m - 3.0 m',
  lux: 520,
  timestamp: 'Just now',
};

interface VisionState {
  currentMode: VisionMode;
  setMode: (mode: VisionMode) => void;
  isScanning: boolean;
  torchOn: boolean;
  toggleTorch: () => void;
  isSpeaking: boolean;
  activeResult: DetectionResult | null;
  scanOCR: () => Promise<void>;
  describeScene: () => Promise<void>;
  readAloud: (overrideText?: string) => Promise<void>;
  stopSpeaking: () => Promise<void>;
}

export const useVisionStore = create<VisionState>((set, get) => ({
  currentMode: 'ocr',
  setMode: (mode) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    set({ currentMode: mode });
    if (mode === 'ocr') {
      set({ activeResult: DEFAULT_OCR_RESULT });
    } else if (mode === 'describe') {
      set({ activeResult: DEFAULT_SCENE_RESULT });
    }
  },
  isScanning: false,
  torchOn: false,
  toggleTorch: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    set((state) => ({ torchOn: !state.torchOn }));
  },
  isSpeaking: false,
  activeResult: DEFAULT_OCR_RESULT,

  scanOCR: async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    set({ isScanning: true });
    await new Promise((resolve) => setTimeout(resolve, 800));
    set({
      isScanning: false,
      currentMode: 'ocr',
      activeResult: {
        ...DEFAULT_OCR_RESULT,
        timestamp: 'Just now',
      },
    });
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  },

  describeScene: async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    set({ isScanning: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    set({
      isScanning: false,
      currentMode: 'describe',
      activeResult: {
        ...DEFAULT_SCENE_RESULT,
        timestamp: 'Just now',
      },
    });
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  },

  readAloud: async (overrideText) => {
    const { activeResult, isSpeaking } = get();
    if (isSpeaking) {
      await get().stopSpeaking();
      return;
    }

    const textToRead = overrideText || (activeResult ? `${activeResult.title}. ${activeResult.labelText}. ${activeResult.warningText || ''}` : 'No text available to read.');
    const userSpeechRate = useUserStore.getState().speechRate || 1.0;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      set({ isSpeaking: true });
      Speech.speak(textToRead, {
        rate: userSpeechRate,
        pitch: 1.0,
        language: 'en-US',
        onDone: () => set({ isSpeaking: false }),
        onStopped: () => set({ isSpeaking: false }),
        onError: () => set({ isSpeaking: false }),
      });
    } catch (e) {
      set({ isSpeaking: false });
    }
  },

  stopSpeaking: async () => {
    try {
      await Speech.stop();
    } catch {}
    set({ isSpeaking: false });
  },
}));
