import { Platform } from 'react-native';

export interface OnDeviceOcrResult {
  text: string;
  processingMs: number;
  blockCount: number;
}

type NativeRecognitionResult = {
  text: string;
  blocks: Array<{ text: string; boundingBox: Record<string, number>; lines: unknown[] }>;
};

let cachedModule: {
  recognizeText: (uri: string) => Promise<NativeRecognitionResult>;
  isSupported: () => boolean;
} | null | undefined;

/**
 * Lazily resolve the expo-mlkit-ocr native module.
 * Returns null when running in Expo Go / web where the native module
 * (ExpoMlkitOcr) is not linked, so callers can use the backend OCR instead.
 */
const getNativeModule = () => {
  if (cachedModule !== undefined) return cachedModule;
  if (Platform.OS === 'web') {
    cachedModule = null;
    return cachedModule;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-mlkit-ocr');
    if (mod?.recognizeText) {
      cachedModule = { recognizeText: mod.recognizeText, isSupported: mod.isSupported };
    } else {
      cachedModule = null;
    }
  } catch {
    cachedModule = null;
  }
  return cachedModule;
};

export const isOnDeviceOcrAvailable = (): boolean => {
  const mod = getNativeModule();
  if (!mod) return false;
  try {
    return typeof mod.isSupported === 'function' ? mod.isSupported() : true;
  } catch {
    return false;
  }
};

/**
 * Run Google ML Kit Text Recognition v2 fully on-device (realtime, offline).
 * Returns null if the native module is unavailable or recognition yields
 * nothing — the caller is expected to fall back to the backend OCR service
 * (which is also a real OCR engine, never mock data).
 */
export const recognizeTextOnDevice = async (imageUri: string): Promise<OnDeviceOcrResult | null> => {
  const mod = getNativeModule();
  if (!mod || !imageUri) return null;

  const startTime = Date.now();
  try {
    const recognition = await mod.recognizeText(imageUri);
    const text = (recognition?.text || '').trim();
    if (!text) return null;
    return {
      text,
      processingMs: Date.now() - startTime,
      blockCount: recognition?.blocks?.length || 0,
    };
  } catch (e: any) {
    console.warn('[OnDeviceOCR] ML Kit recognition failed:', e?.code || e?.message || e);
    return null;
  }
};
