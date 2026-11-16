/**
 * AccessOne AI - Clinical Backend API Service
 * Multimodal neural assistive API client connected to FastAPI backend.
 */

import Constants from 'expo-constants';

// Automatically detect dev server host IP when running in Expo Go
const devHost = Constants?.expoConfig?.hostUri?.split(':')[0] || 'localhost';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${devHost}:8000/api/v1`;

export interface VisionApiResponse {
  success: boolean;
  mode: string;
  result_text: string;
  confidence: number;
  processing_ms: number;
  title: string;
  category: string;
  warning_text?: string;
  distance?: string;
  lux?: number;
  entities?: Record<string, any>;
  objects_detected?: Array<{ label: string; confidence: number; position: string; box?: number[] }>;
  hazards?: string[];
  limitations?: string;
}

export interface HearingSoundEvent {
  id: string;
  title: string;
  category: 'door' | 'alarm' | 'siren' | 'speech' | 'medical';
  direction: string;
  angleDeg: number;
  db: number;
  confidence: number;
  time: string;
}

export interface HearingTranscribeResponse {
  success: boolean;
  transcript: string;
  is_final: boolean;
  confidence?: number;
  timestamp: string;
  status: string;
  decibels: number;
  is_speech: boolean;
  sound_events: HearingSoundEvent[];
  processing_ms: number;
  session_id?: string;
  language: string;
  error?: string;
}

export interface EchoSignAnimationData {
  word: string;
  type: 'motion_keypoints' | 'fingerspelling';
  keypoints: number[][]; // [frames x 198]
  duration: number;
  num_frames: number;
  source: string;
  character?: string;
  available: boolean;
}

export interface SpeechToSignApiResponse {
  success: boolean;
  gloss_sequence: string[];
  original_text: string;
  language: string;
  animation_data: EchoSignAnimationData[];
  available_vocabulary: string[];
  missing_vocabulary: string[];
  session_id?: string;
  status: string;
}

export interface SignToTextApiResponse {
  success: boolean;
  status: string;
  predicted_text?: string;
  confidence?: number;
  gesture_sequence: string[];
  landmarks?: number[];
  model_status: {
    operational: boolean;
    weights_found: boolean;
    weights_path?: string;
    expected_features: number;
    vocabulary_size: number;
    supported_vocabulary: string[];
    message: string;
  };
  message?: string;
}

export interface SignCapabilitiesResponse {
  success: boolean;
  version: string;
  engine: string;
  motion_library: {
    total_words: number;
    avg_duration: number;
    total_samples: number;
    sample_words: string[];
    fingerspelling_supported: boolean;
    feature_dimension: number;
  };
  gesture_model: Record<string, any>;
  supported_languages: string[];
  grammar_spec: string;
}

export interface VoiceSynthesisRequest {
  text: string;
  speechRate?: number;
  pitch?: number;
  voiceProfile?: 'clinical-neutral' | 'warm-assistant' | 'urgent-alert';
}

export interface SosPayload {
  patientId: string;
  patientName: string;
  category: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  facility: string;
  medicalConditions: string[];
  allergies: string[];
  timestamp: string;
}

export interface SosResponse {
  status: 'dispatched' | 'acknowledged' | 'queued';
  cadIncidentId: string;
  estimatedArrivalMinutes: number;
  unitsAssigned: string[];
}

export const api = {
  healthCheck: async (): Promise<{ status: string; version: string; neuralEngine: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`);
      if (res.ok) {
        return await res.json();
      }
      return { status: 'offline', version: '4.2.0', neuralEngine: 'On-Device CoreML/NNAPI' };
    } catch (e) {
      return { status: 'offline', version: '4.2.0', neuralEngine: 'Fallback Local' };
    }
  },

  vision: {
    /**
     * POST /api/v1/vision
     * Sends captured or uploaded image to backend for OCR, Scene Description, or Object Identification.
     * Routes internally: ocr→Windows WinRT, describe→Gemini 1.5 Flash, objects→YOLO.
     */
    analyze: async (payload: {
      image: string;
      mode: 'ocr' | 'describe' | 'objects' | 'barcode' | 'scene';
      language?: string;
    }): Promise<VisionApiResponse> => {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        // OCR can be slow on complex documents; Gemini is fast (~2-5s)
        const timeoutMs = payload.mode === 'ocr' || payload.mode === 'barcode' ? 60000 : 45000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(`${API_BASE_URL}/vision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: payload.image,
            mode: payload.mode,
            language: payload.language || 'en-US',
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Server status ${res.status}: ${errBody}`);
        }

        const data: VisionApiResponse = await res.json();
        return data;
      } catch (error: any) {
        const isTimeout = error.name === 'AbortError';
        console.warn('[Vision API] Backend request failed:', error.message);
        const duration = Date.now() - startTime;
        return {
          success: false,
          mode: payload.mode,
          result_text: isTimeout
            ? `Analysis timed out. The image may be too complex or the backend is busy. Try again or use a clearer photo.`
            : `Vision service unreachable (${error.message}). Ensure the backend is running at ${API_BASE_URL}.`,
          confidence: 0,
          processing_ms: duration,
          title: isTimeout ? 'Analysis Timed Out' : 'Vision Service Unavailable',
          category: 'Network / Offline Mode',
          warning_text: isTimeout
            ? 'OCR timed out. Try a photo with less text or better lighting.'
            : 'Unable to connect to the AI vision backend. Verify network connection and backend status.',
          distance: 'Not Available',
          lux: 400,
        };
      }
    },

    /**
     * POST /api/v1/vision/describe
     * Dedicated endpoint: AI-powered scene description for visually impaired users.
     * Uses Gemini 1.5 Flash multimodal (if GEMINI_API_KEY set on backend), YOLO fallback.
     */
    describe: async (payload: {
      image: string;
      language?: string;
    }): Promise<VisionApiResponse> => {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        // Gemini flash models can take up to ~40s under load; give headroom
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        const res = await fetch(`${API_BASE_URL}/vision/describe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: payload.image, language: payload.language || 'en-US' }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          // Fall back to main /vision endpoint with mode=describe
          return api.vision.analyze({ image: payload.image, mode: 'describe', language: payload.language });
        }

        return await res.json() as VisionApiResponse;
      } catch (error: any) {
        // Fall back to main endpoint on any error
        return api.vision.analyze({ image: payload.image, mode: 'describe', language: payload.language });
      }
    },
  },

  hearing: {
    /**
     * POST /api/v1/hearing/transcribe
     * Sends recorded audio payload to backend for genuine speech-to-text recognition
     * and spectral environmental sound event detection (fire alarm, siren, door knock, etc.).
     */
    transcribe: async (payload: {
      audio: string;
      format?: string;
      language?: string;
      sessionId?: string;
      isFinal?: boolean;
    }): Promise<HearingTranscribeResponse> => {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for audio transcription

        const res = await fetch(`${API_BASE_URL}/hearing/transcribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio: payload.audio,
            format: payload.format || 'm4a',
            language: payload.language || 'en-US',
            session_id: payload.sessionId,
            is_final: payload.isFinal !== undefined ? payload.isFinal : true,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Server status ${res.status}: ${errBody}`);
        }

        const data: HearingTranscribeResponse = await res.json();
        return data;
      } catch (error: any) {
        console.warn('[Hearing API] Transcribe request error:', error.message);
        const duration = Date.now() - startTime;
        return {
          success: false,
          transcript: '',
          is_final: payload.isFinal !== undefined ? payload.isFinal : true,
          confidence: undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'network_failure',
          decibels: 36,
          is_speech: false,
          sound_events: [],
          processing_ms: duration,
          session_id: payload.sessionId,
          language: payload.language || 'en-US',
          error: error.message || 'Network unreachable',
        };
      }
    },

    streamAudioChunk: async (chunkBase64: string) => {
      return { transcriptChunk: '', decibels: 38, isSpeech: true };
    },
  },

  bridge: {
    /**
     * POST /api/v1/bridge/speech-to-sign
     * Converts spoken voice (or recognized text) to Indian Sign Language (ISL) gloss and 198-keypoint motion data.
     */
    speechToSign: async (payload: {
      text?: string;
      audio?: string;
      audioFormat?: string;
      language?: string;
      sessionId?: string;
    }): Promise<SpeechToSignApiResponse> => {
      try {
        const res = await fetch(`${API_BASE_URL}/bridge/speech-to-sign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: payload.text,
            audio: payload.audio,
            audio_format: payload.audioFormat || 'm4a',
            language: payload.language || 'english',
            session_id: payload.sessionId,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
        return await res.json();
      } catch (err: any) {
        console.warn('[Bridge API] speechToSign error:', err.message);
        return {
          success: false,
          gloss_sequence: [],
          original_text: payload.text || '',
          language: payload.language || 'english',
          animation_data: [],
          available_vocabulary: [],
          missing_vocabulary: [],
          status: 'network_error',
        };
      }
    },

    /**
     * POST /api/v1/bridge/text-to-sign
     * Converts typed text to grammatical ISL Gloss and 3D avatar animation keypoints.
     */
    textToSign: async (payload: {
      text: string;
      language?: string;
      sessionId?: string;
    }): Promise<SpeechToSignApiResponse> => {
      try {
        const res = await fetch(`${API_BASE_URL}/bridge/text-to-sign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: payload.text,
            language: payload.language || 'english',
            session_id: payload.sessionId,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
        return await res.json();
      } catch (err: any) {
        console.warn('[Bridge API] textToSign error:', err.message);
        return {
          success: false,
          gloss_sequence: [],
          original_text: payload.text,
          language: payload.language || 'english',
          animation_data: [],
          available_vocabulary: [],
          missing_vocabulary: [],
          status: 'network_error',
        };
      }
    },

    /**
     * POST /api/v1/bridge/sign-to-text
     * Sends camera frames or landmark sequences to EchoSign gesture recognition pipeline.
     */
    signToText: async (payload: {
      videoFrame?: string;
      landmarks?: number[][];
      language?: string;
      sessionId?: string;
    }): Promise<SignToTextApiResponse> => {
      try {
        const res = await fetch(`${API_BASE_URL}/bridge/sign-to-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_frame: payload.videoFrame,
            landmarks: payload.landmarks,
            language: payload.language || 'english',
            session_id: payload.sessionId,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
        return await res.json();
      } catch (err: any) {
        console.warn('[Bridge API] signToText error:', err.message);
        return {
          success: false,
          status: 'network_error',
          gesture_sequence: [],
          model_status: {
            operational: false,
            weights_found: false,
            expected_features: 198,
            vocabulary_size: 14,
            supported_vocabulary: [],
            message: `Sign recognition server error: ${err.message}`,
          },
        };
      }
    },

    /**
     * GET /api/v1/bridge/sign-capabilities
     * Retrieves motion library statistics, vocabulary list, and model training status.
     */
    getSignCapabilities: async (): Promise<SignCapabilitiesResponse | null> => {
      try {
        const res = await fetch(`${API_BASE_URL}/bridge/sign-capabilities`);
        if (!res.ok) return null;
        return await res.json();
      } catch (err: any) {
        return null;
      }
    },

    synthesizeSpeech: async (req: VoiceSynthesisRequest): Promise<{ audioUrl?: string }> => {
      return { audioUrl: undefined }; // Local TTS via expo-speech
    },

    sendChatMessage: async (message: string, recipient: string) => {
      await new Promise((r) => setTimeout(r, 400));
      return { success: true, messageId: `msg-${Date.now()}` };
    },
  },

  safety: {
    dispatchEmergencyPayload: async (payload: SosPayload): Promise<SosResponse> => {
      await new Promise((r) => setTimeout(r, 500));
      return {
        status: 'dispatched',
        cadIncidentId: `CAD-SF-${Math.floor(100000 + Math.random() * 900000)}`,
        estimatedArrivalMinutes: 4,
        unitsAssigned: ['Medic Unit 14', 'St. Jude Security Lead'],
      };
    },
  },
};
