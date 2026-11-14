import { create } from 'zustand';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useUserStore } from './userStore';
import { speechRecognitionService } from '../services/speechRecognitionService';
import {
  api,
  EchoSignAnimationData,
  SpeechToSignApiResponse,
  SignToTextApiResponse,
  SignCapabilitiesResponse,
} from '../services/api';

export type BridgeMode = 'two-way-chat' | 'voice-to-sign' | 'sign-to-voice' | 'text-to-sign';

export interface BridgeMessage {
  id: string;
  sender: 'doctor' | 'user';
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  isSpokenToRoom?: boolean;
  confidence?: number;
}

const INITIAL_MESSAGES: BridgeMessage[] = [
  {
    id: 'b-1',
    sender: 'doctor',
    senderName: 'Dr. Patel',
    senderRole: 'Clinical Pharmacist',
    text: 'Please take one tablet twice daily with food. Do you have any questions about potential drowsiness or allergies?',
    timestamp: '10:14 AM',
    isSpokenToRoom: false,
  },
  {
    id: 'b-2',
    sender: 'user',
    senderName: 'Sarah (You)',
    senderRole: 'Patient Voice Synthesis',
    text: 'Will this medication interact with my daily allergy antihistamines? Also, can I pick up the refill on Tuesday afternoon?',
    timestamp: '10:15 AM',
    isSpokenToRoom: true,
  },
];

const QUICK_PHRASES = [
  'Yes, I understand clearly.',
  'Could you please speak a bit slower?',
  'Can you please write it down?',
  'For how many days should I continue this dosage?',
  'Does this cause drowsiness?',
  'I need to verify my insurance copay.',
];

interface BridgeState {
  // Mode selection
  bridgeMode: BridgeMode;
  setBridgeMode: (mode: BridgeMode) => void;

  messages: BridgeMessage[];
  quickPhrases: string[];
  isPartnerListening: boolean;
  isUserVoiceRecording: boolean;
  isCounterFlipped: boolean;
  showAslDrawer: boolean;
  typedVoiceText: string;
  bridgeSpeed: number;

  // Review & Approval state for speech recognition
  pendingTranscript: string | null;
  pendingConfidence: number | null;
  pendingSender: 'doctor' | 'user';
  isReviewingTranscript: boolean;

  // EchoSign 3D Avatar & Sign Animation state
  signAnimations: EchoSignAnimationData[];
  glossSequence: string[];
  originalSentence: string;
  missingVocabulary: string[];
  isTranslatingSign: boolean;
  signTranslationError: string | null;
  signAvatarSpeed: number;

  // EchoSign Sign to Text (Camera & Gesture Recognition) state
  isSignCameraActive: boolean;
  signCameraFacing: 'front' | 'back';
  isSignRecognizing: boolean;
  recognizedSignText: string | null;
  signConfidence: number | null;
  signModelStatus: any;
  signErrorMessage: string | null;
  signGestureSequence: string[];
  lastLandmarkCount: number;

  // Actions
  setBridgeSpeed: (speed: number) => void;
  setSignAvatarSpeed: (speed: number) => void;
  togglePartnerListening: () => Promise<void>;
  startUserVoiceInput: () => Promise<void>;
  stopUserVoiceInput: () => Promise<void>;
  toggleCounterFlipped: () => void;
  toggleAslDrawer: () => void;
  setTypedVoiceText: (text: string) => void;
  setPendingTranscript: (text: string) => void;
  approvePendingTranscript: () => Promise<void>;
  discardPendingTranscript: () => void;
  speakAloudText: (textToSpeak: string, isFromUser?: boolean) => Promise<void>;
  quickSpeakPill: (phrase: string) => Promise<void>;
  replayMessageAudio: (msg: BridgeMessage) => Promise<void>;
  simulateDoctorResponse: (promptText?: string) => Promise<void>;

  // EchoSign actions
  translateTextToSign: (text: string, language?: string) => Promise<boolean>;
  startVoiceToSignRecording: () => Promise<void>;
  stopVoiceToSignRecording: () => Promise<void>;
  recognizeSignFromFrame: (imageBase64: string) => Promise<void>;
  speakRecognizedSign: (customText?: string) => Promise<void>;
  toggleSignCameraFacing: () => void;
  toggleSignCameraActive: (active?: boolean) => void;
  clearSignAnimation: () => void;
  fetchSignCapabilities: () => Promise<SignCapabilitiesResponse | null>;
}

export const useBridgeStore = create<BridgeState>((set, get) => ({
  bridgeMode: 'two-way-chat',
  messages: INITIAL_MESSAGES,
  quickPhrases: QUICK_PHRASES,
  isPartnerListening: false,
  isUserVoiceRecording: false,
  isCounterFlipped: false,
  showAslDrawer: false,
  typedVoiceText: '',
  bridgeSpeed: 1.0,

  pendingTranscript: null,
  pendingConfidence: null,
  pendingSender: 'doctor',
  isReviewingTranscript: false,

  // EchoSign Animation State
  signAnimations: [],
  glossSequence: [],
  originalSentence: '',
  missingVocabulary: [],
  isTranslatingSign: false,
  signTranslationError: null,
  signAvatarSpeed: 1.0,

  // EchoSign Sign to Text State
  isSignCameraActive: false,
  signCameraFacing: 'front',
  isSignRecognizing: false,
  recognizedSignText: null,
  signConfidence: null,
  signModelStatus: null,
  signErrorMessage: null,
  signGestureSequence: [],
  lastLandmarkCount: 0,

  setBridgeMode: (mode) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    set({ bridgeMode: mode });
  },

  setBridgeSpeed: (speed) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    set({ bridgeSpeed: speed });
  },

  setSignAvatarSpeed: (speed) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    set({ signAvatarSpeed: speed });
  },

  togglePartnerListening: async () => {
    const isCurrentlyListening = get().isPartnerListening;

    if (!isCurrentlyListening) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      const userLang = useUserStore.getState().language || 'en-US';
      const started = await speechRecognitionService.startListening({
        language: userLang,
        continuous: false,
      });

      if (started) {
        set({ isPartnerListening: true, pendingSender: 'doctor' });
      }
    } else {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      set({ isPartnerListening: false });
      const res = await speechRecognitionService.stopListening();

      if (res && res.transcript && res.transcript.trim()) {
        set({
          pendingTranscript: res.transcript.trim(),
          pendingConfidence: res.confidence || 92,
          pendingSender: 'doctor',
          isReviewingTranscript: true,
        });
      } else {
        get().simulateDoctorResponse();
      }
    }
  },

  startUserVoiceInput: async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const userLang = useUserStore.getState().language || 'en-US';
    const started = await speechRecognitionService.startListening({
      language: userLang,
      continuous: false,
    });

    if (started) {
      set({ isUserVoiceRecording: true, pendingSender: 'user' });
    }
  },

  stopUserVoiceInput: async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    set({ isUserVoiceRecording: false });
    const res = await speechRecognitionService.stopListening();

    if (res && res.transcript && res.transcript.trim()) {
      set({
        pendingTranscript: res.transcript.trim(),
        pendingConfidence: res.confidence || 94,
        pendingSender: 'user',
        isReviewingTranscript: true,
      });
    }
  },

  setPendingTranscript: (text) => set({ pendingTranscript: text }),

  approvePendingTranscript: async () => {
    const { pendingTranscript, pendingSender, pendingConfidence } = get();
    if (!pendingTranscript || !pendingTranscript.trim()) {
      set({ isReviewingTranscript: false, pendingTranscript: null });
      return;
    }

    const isUser = pendingSender === 'user';
    const newMsg: BridgeMessage = {
      id: `b-${Date.now()}`,
      sender: pendingSender,
      senderName: isUser ? 'Sarah (You)' : 'Dr. Patel',
      senderRole: isUser ? 'Patient Voice' : 'Clinical Pharmacist',
      text: pendingTranscript.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSpokenToRoom: isUser,
      confidence: pendingConfidence || undefined,
    };

    set((state) => ({
      messages: [...state.messages, newMsg],
      isReviewingTranscript: false,
      pendingTranscript: null,
      pendingConfidence: null,
    }));

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    if (isUser) {
      get().speakAloudText(newMsg.text, false);
    }
  },

  discardPendingTranscript: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    set({
      isReviewingTranscript: false,
      pendingTranscript: null,
      pendingConfidence: null,
    });
  },

  toggleCounterFlipped: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    set((state) => ({ isCounterFlipped: !state.isCounterFlipped }));
  },

  toggleAslDrawer: () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    set((state) => ({ showAslDrawer: !state.showAslDrawer }));
  },

  setTypedVoiceText: (text) => set({ typedVoiceText: text }),

  speakAloudText: async (textToSpeak, isFromUser = true) => {
    if (!textToSpeak.trim()) return;

    const currentSpeed = get().bridgeSpeed || useUserStore.getState().speechRate || 1.0;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    if (isFromUser) {
      const newMsg: BridgeMessage = {
        id: `b-${Date.now()}`,
        sender: 'user',
        senderName: 'Sarah (You)',
        senderRole: 'Patient Voice Synthesis',
        text: textToSpeak.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSpokenToRoom: true,
      };
      set((state) => ({
        messages: [...state.messages, newMsg],
        typedVoiceText: '',
      }));
    }

    try {
      Speech.speak(textToSpeak, {
        rate: currentSpeed,
        pitch: 1.0,
        language: 'en-US',
      });
    } catch {}
  },

  quickSpeakPill: async (phrase) => {
    await get().speakAloudText(phrase, true);
  },

  replayMessageAudio: async (msg) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Speech.speak(msg.text, {
        rate: get().bridgeSpeed,
        pitch: 1.0,
      });
    } catch {}
  },

  simulateDoctorResponse: async () => {
    const responses = [
      'Your allergy antihistamine is completely safe to take with this antibiotic. No interactions detected.',
      'Yes, the pharmacy counter is open until 6:00 PM on Tuesday. Refill will be ready.',
      'Remember to drink a full glass of water with each dose to ensure optimal absorption.',
    ];
    const replyText = responses[Math.floor(Math.random() * responses.length)];

    const newMsg: BridgeMessage = {
      id: `b-${Date.now()}`,
      sender: 'doctor',
      senderName: 'Dr. Patel',
      senderRole: 'Clinical Pharmacist',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSpokenToRoom: false,
    };

    set((state) => ({
      messages: [...state.messages, newMsg],
      isPartnerListening: false,
    }));

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  },

  // EchoSign Actions Implementation
  translateTextToSign: async (text: string, language?: string) => {
    if (!text || !text.trim()) return false;

    set({ isTranslatingSign: true, signTranslationError: null });
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const lang = language || useUserStore.getState().language || 'english';
    try {
      const res = await api.bridge.textToSign({ text: text.trim(), language: lang });
      if (res && res.success && res.animation_data && res.animation_data.length > 0) {
        set({
          signAnimations: res.animation_data,
          glossSequence: res.gloss_sequence || [],
          originalSentence: res.original_text || text,
          missingVocabulary: res.missing_vocabulary || [],
          isTranslatingSign: false,
          signTranslationError: null,
        });
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        return true;
      } else {
        set({
          isTranslatingSign: false,
          signTranslationError: 'No sign motion data found for sentence. Words were spelled or unavailable.',
        });
        return false;
      }
    } catch (err: any) {
      set({
        isTranslatingSign: false,
        signTranslationError: err.message || 'Error communicating with sign translation engine.',
      });
      return false;
    }
  },

  startVoiceToSignRecording: async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const userLang = useUserStore.getState().language || 'en-US';
    const started = await speechRecognitionService.startListening({
      language: userLang,
      continuous: false,
    });

    if (started) {
      set({ isUserVoiceRecording: true, signTranslationError: null });
    }
  },

  stopVoiceToSignRecording: async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    set({ isUserVoiceRecording: false });
    const res = await speechRecognitionService.stopListening();

    if (res && res.transcript && res.transcript.trim()) {
      const text = res.transcript.trim();
      const userLang = useUserStore.getState().language || 'english';
      await get().translateTextToSign(text, userLang);
    } else {
      set({
        signTranslationError: 'No clear speech detected. Please speak clearly into the microphone.',
      });
    }
  },

  recognizeSignFromFrame: async (imageBase64: string) => {
    if (!imageBase64) return;
    set({ isSignRecognizing: true, signErrorMessage: null });

    try {
      const res = await api.bridge.signToText({ videoFrame: imageBase64 });
      if (res) {
        set({
          signModelStatus: res.model_status,
          recognizedSignText: res.predicted_text || null,
          signConfidence: res.confidence || null,
          signGestureSequence: res.gesture_sequence || [],
          lastLandmarkCount: res.landmarks ? res.landmarks.length : 0,
          isSignRecognizing: false,
          signErrorMessage: res.message || null,
        });
      }
    } catch (err: any) {
      set({
        isSignRecognizing: false,
        signErrorMessage: `Recognition failed: ${err.message}`,
      });
    }
  },

  speakRecognizedSign: async (customText?: string) => {
    const textToSpeak = customText || get().recognizedSignText;
    if (!textToSpeak || !textToSpeak.trim()) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Speech.speak(textToSpeak.trim(), {
        rate: get().bridgeSpeed,
        pitch: 1.0,
        language: 'en-US',
      });

      // Add to conversation dialogue
      const newMsg: BridgeMessage = {
        id: `b-${Date.now()}`,
        sender: 'user',
        senderName: 'ISL Signer (You)',
        senderRole: 'EchoSign Sign-to-Voice',
        text: textToSpeak.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSpokenToRoom: true,
      };

      set((state) => ({
        messages: [...state.messages, newMsg],
      }));
    } catch (err) {
      console.warn('[BridgeStore] speakRecognizedSign error:', err);
    }
  },

  toggleSignCameraFacing: () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    set((state) => ({
      signCameraFacing: state.signCameraFacing === 'front' ? 'back' : 'front',
    }));
  },

  toggleSignCameraActive: (active?: boolean) => {
    set((state) => ({
      isSignCameraActive: active !== undefined ? active : !state.isSignCameraActive,
    }));
  },

  clearSignAnimation: () => {
    set({
      signAnimations: [],
      glossSequence: [],
      originalSentence: '',
      missingVocabulary: [],
      signTranslationError: null,
    });
  },

  fetchSignCapabilities: async () => {
    const caps = await api.bridge.getSignCapabilities();
    if (caps && caps.gesture_model) {
      set({ signModelStatus: caps.gesture_model });
    }
    return caps;
  },
}));
