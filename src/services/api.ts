/**
 * AccessOne AI - Clinical Backend API Service
 * Cleanly typed stubs for FastAPI backend integration.
 */

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface VisionOCRResponse {
  success: boolean;
  text: string;
  confidence: number;
  entities: {
    medicationName?: string;
    dosage?: string;
    frequency?: string;
    warning?: string;
  };
  processedAt: string;
}

export interface SceneDescriptionResponse {
  success: boolean;
  description: string;
  hazards: string[];
  lightingLux: number;
  objectsDetected: Array<{ label: string; distanceMeters: number; position: string }>;
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
      // In production: const res = await fetch(`${API_BASE_URL}/health`); return await res.json();
      return { status: 'healthy', version: '4.2.0', neuralEngine: 'On-Device CoreML/NNAPI' };
    } catch (e) {
      return { status: 'offline', version: '4.2.0', neuralEngine: 'Fallback Local' };
    }
  },

  vision: {
    scanOcr: async (imageBase64: string): Promise<VisionOCRResponse> => {
      // Mocked realistic fast response matching FastAPI endpoint
      await new Promise((r) => setTimeout(r, 600));
      return {
        success: true,
        text: 'Amoxicillin 500mg - Take 1 capsule twice daily with food. Prescribed by Dr. Patel. Expiry: 12/2026.',
        confidence: 0.994,
        entities: {
          medicationName: 'Amoxicillin 500mg',
          dosage: '1 capsule',
          frequency: 'twice daily with food',
          warning: 'Finish entire course even if symptoms subside. Cease intake if rash occurs.',
        },
        processedAt: new Date().toISOString(),
      };
    },

    describeScene: async (imageBase64: string): Promise<SceneDescriptionResponse> => {
      await new Promise((r) => setTimeout(r, 800));
      return {
        success: true,
        description: 'Exam room with table 1.2m ahead, prescription bottle centered, doctor seated at 2.5m.',
        hazards: ['Step threshold near corridor door at 10 o\'clock'],
        lightingLux: 520,
        objectsDetected: [
          { label: 'Prescription Bottle', distanceMeters: 0.2, position: 'center' },
          { label: 'Doctor Patel', distanceMeters: 2.5, position: 'right-45' },
          { label: 'Doorway', distanceMeters: 3.2, position: 'left-60' },
        ],
      };
    },
  },

  hearing: {
    streamAudioChunk: async (chunkBase64: string) => {
      // Audio stream chunking for live transcription
      return { transcriptChunk: '', decibels: 38, isSpeech: true };
    },
  },

  bridge: {
    synthesizeSpeech: async (req: VoiceSynthesisRequest): Promise<{ audioUrl?: string }> => {
      return { audioUrl: undefined }; // In mobile frontend, expo-speech handles local TTS directly
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
