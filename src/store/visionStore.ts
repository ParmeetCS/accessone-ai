import { create } from 'zustand';
import * as Speech from 'expo-speech';
import * as Haptics from '../utils/haptics';
import { useUserStore } from './userStore';
import { api, VisionApiResponse } from '../services/api';
import { visionService } from '../services/supabase/vision';

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
  processingMs?: number;
  entities?: Record<string, any>;
  objectsDetected?: Array<{ label: string; confidence: number; position: string; box?: number[] }>;
  hazards?: string[];
  limitations?: string;
}

interface VisionState {
  currentMode: VisionMode;
  setMode: (mode: VisionMode) => void;
  isScanning: boolean;
  scanError: string | null;
  clearError: () => void;
  torchOn: boolean;
  toggleTorch: () => void;
  cameraFacing: 'back' | 'front';
  toggleCameraFacing: () => void;
  isLive: boolean;
  toggleLive: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  activeResult: DetectionResult | null;
  analyzeImageBase64: (base64: string) => Promise<void>;
  readAloud: (overrideText?: string) => Promise<void>;
  pauseSpeaking: () => Promise<void>;
  resumeSpeaking: () => Promise<void>;
  stopSpeaking: () => Promise<void>;
  replaySpeaking: () => Promise<void>;
  clearResult: () => void;
}

export const useVisionStore = create<VisionState>((set, get) => ({
  currentMode: 'ocr',
  setMode: (mode) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    set({ currentMode: mode, scanError: null });
  },

  isScanning: false,
  scanError: null,
  clearError: () => set({ scanError: null }),

  torchOn: false,
  toggleTorch: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    set((state) => ({ torchOn: !state.torchOn }));
  },

  cameraFacing: 'back',
  toggleCameraFacing: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    set((state) => ({ cameraFacing: state.cameraFacing === 'back' ? 'front' : 'back' }));
  },

  isLive: false,
  toggleLive: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    set((state) => ({ isLive: !state.isLive }));
  },

  isSpeaking: false,
  isPaused: false,
  activeResult: null,

  clearResult: () => {
    get().stopSpeaking();
    set({ activeResult: null, scanError: null });
  },

  analyzeImageBase64: async (base64: string) => {
    const { currentMode, isScanning } = get();
    if (isScanning) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    set({ isScanning: true, scanError: null });

    try {
      const language = useUserStore.getState().language || 'en-US';

      // Route describe mode through the dedicated /vision/describe endpoint (Gemini AI)
      // All other modes use the unified /vision endpoint
      let res;
      if (currentMode === 'describe') {
        res = await api.vision.describe({ image: base64, language });
      } else {
        res = await api.vision.analyze({
          image: base64,
          mode: currentMode,
          language,
        });
      }

      const newResult: DetectionResult = {
        title: res.title || (currentMode === 'ocr' ? 'Document / Prescription OCR' : currentMode === 'objects' ? 'Objects Detected' : 'Surroundings Overview'),
        category: res.category || 'Vision Assist',
        confidence: res.confidence || 0.0,
        labelText: res.result_text || 'No text or description recognized.',
        warningText: res.warning_text,
        distance: res.distance || 'Approx. 30 cm',
        lux: res.lux || 480,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        processingMs: res.processing_ms,
        entities: res.entities,
        objectsDetected: res.objects_detected,
        hazards: res.hazards,
        limitations: res.limitations,
      };

      set({
        isScanning: false,
        activeResult: newResult,
        scanError: null,
      });

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      // Auto-read aloud for describe/scene modes (most useful for visually impaired)
      if (currentMode === 'describe' || currentMode === 'objects') {
        setTimeout(() => {
          get().readAloud();
        }, 400);
      }

      // Store only useful metadata in vision_scans — never raw images
      const user = useUserStore.getState().user;
      if (user?.id) {
        let safeExtractedText = res.result_text;
        if (currentMode === 'ocr') {
          safeExtractedText = `[OCR Analysis: ${res.title} — ${res.result_text.split(/\s+/).length} words detected]`;
        }
        visionService.logScan({
          user_id: user.id,
          scan_mode: currentMode,
          extracted_text: safeExtractedText,
          confidence: Number((res.confidence || 0).toFixed(1)),
          processing_time_ms: res.processing_ms || 120,
        }).catch((err) => console.warn('[Supabase] Vision scan log skipped:', err));
      }
    } catch (err: any) {
      set({
        isScanning: false,
        scanError: err.message || 'Vision analysis failed. Please try again.',
      });
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
  },

  readAloud: async (overrideText) => {
    const { activeResult, isSpeaking } = get();
    if (isSpeaking) {
      await get().stopSpeaking();
      return;
    }

    const textToRead =
      overrideText ||
      (activeResult
        ? `${activeResult.title}. ${activeResult.labelText}. ${
            activeResult.warningText ? 'Patient safety advisory: ' + activeResult.warningText : ''
          }`
        : 'No text or scene description available to read.');

    const userSpeechRate = useUserStore.getState().speechRate || 1.0;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      set({ isSpeaking: true, isPaused: false });
      Speech.speak(textToRead, {
        rate: userSpeechRate,
        pitch: 1.0,
        language: 'en-US',
        onDone: () => set({ isSpeaking: false, isPaused: false }),
        onStopped: () => set({ isSpeaking: false, isPaused: false }),
        onError: () => set({ isSpeaking: false, isPaused: false }),
      });
    } catch {
      set({ isSpeaking: false, isPaused: false });
    }
  },

  pauseSpeaking: async () => {
    try {
      if (Speech.pause) {
        await Speech.pause();
        set({ isPaused: true });
      } else {
        await Speech.stop();
        set({ isSpeaking: false, isPaused: true });
      }
    } catch {
      set({ isSpeaking: false, isPaused: false });
    }
  },

  resumeSpeaking: async () => {
    try {
      if (Speech.resume) {
        await Speech.resume();
        set({ isPaused: false });
      } else {
        get().readAloud();
      }
    } catch {
      get().readAloud();
    }
  },

  stopSpeaking: async () => {
    try {
      await Speech.stop();
    } catch {}
    set({ isSpeaking: false, isPaused: false });
  },

  replaySpeaking: async () => {
    await get().stopSpeaking();
    setTimeout(() => {
      get().readAloud();
    }, 200);
  },
}));
