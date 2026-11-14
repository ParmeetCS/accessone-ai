import { create } from 'zustand';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useUserStore } from './userStore';

export interface BridgeMessage {
  id: string;
  sender: 'doctor' | 'user';
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  isSpokenToRoom?: boolean;
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
  messages: BridgeMessage[];
  quickPhrases: string[];
  isPartnerListening: boolean;
  isCounterFlipped: boolean;
  showAslDrawer: boolean;
  typedVoiceText: string;
  bridgeSpeed: number;

  setBridgeSpeed: (speed: number) => void;
  togglePartnerListening: () => void;
  toggleCounterFlipped: () => void;
  toggleAslDrawer: () => void;
  setTypedVoiceText: (text: string) => void;
  speakAloudText: (textToSpeak: string, isFromUser?: boolean) => Promise<void>;
  quickSpeakPill: (phrase: string) => Promise<void>;
  replayMessageAudio: (msg: BridgeMessage) => Promise<void>;
  simulateDoctorResponse: (promptText?: string) => Promise<void>;
}

export const useBridgeStore = create<BridgeState>((set, get) => ({
  messages: INITIAL_MESSAGES,
  quickPhrases: QUICK_PHRASES,
  isPartnerListening: false,
  isCounterFlipped: false,
  showAslDrawer: false,
  typedVoiceText: '',
  bridgeSpeed: 1.0,

  setBridgeSpeed: (speed) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    set({ bridgeSpeed: speed });
  },

  togglePartnerListening: () => {
    const next = !get().isPartnerListening;
    try {
      if (next) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {}
    set({ isPartnerListening: next });

    if (next) {
      setTimeout(() => {
        get().simulateDoctorResponse();
      }, 2500);
    }
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
}));
