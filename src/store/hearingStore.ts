import { create } from 'zustand';
import * as Haptics from 'expo-haptics';

export interface CaptionMessage {
  id: string;
  speaker: string;
  role: 'doctor' | 'nurse' | 'patient' | 'system';
  avatarInitials: string;
  text: string;
  timestamp: string;
  isHighPriority?: boolean;
}

export interface SoundRadarEvent {
  id: string;
  title: string;
  category: 'door' | 'alarm' | 'siren' | 'speech' | 'medical';
  direction: string;
  angleDeg: number;
  db: number;
  time: string;
}

const INITIAL_TRANSCRIPTS: CaptionMessage[] = [
  {
    id: 't-1',
    speaker: 'Dr. Evans',
    role: 'doctor',
    avatarInitials: 'DE',
    text: 'Good morning Sarah, your biometric vitals from the past 48 hours show steady recovery. Blood pressure is 122 over 78.',
    timestamp: '10:12 AM',
  },
  {
    id: 't-2',
    speaker: 'Dr. Evans',
    role: 'doctor',
    avatarInitials: 'DE',
    text: 'We are continuing the Amoxicillin for five more days. Have you noticed any side effects or gastrointestinal discomfort?',
    timestamp: '10:13 AM',
  },
  {
    id: 't-3',
    speaker: 'Sarah (You)',
    role: 'patient',
    avatarInitials: 'SJ',
    text: 'No stomach upset, but mild fatigue in the afternoon. The audio visual alerts on AccessOne have been immensely helpful.',
    timestamp: '10:14 AM',
  },
  {
    id: 't-4',
    speaker: 'Nurse Chloe',
    role: 'nurse',
    avatarInitials: 'NC',
    text: 'I will log your refill schedule in the pharmacy dispatch queue for Tuesday 2 PM pick up.',
    timestamp: '10:15 AM',
  },
];

const INITIAL_RADAR_EVENTS: SoundRadarEvent[] = [
  {
    id: 's-1',
    title: 'Dr. Evans (Physician)',
    category: 'speech',
    direction: 'Front Right (45°)',
    angleDeg: 45,
    db: 62,
    time: 'Live',
  },
  {
    id: 's-2',
    title: 'Door Knock (Corridor)',
    category: 'door',
    direction: 'Left Peripheral (280°)',
    angleDeg: 280,
    db: 58,
    time: '20s ago',
  },
  {
    id: 's-3',
    title: 'IV Pump Chime',
    category: 'medical',
    direction: 'Right (110°)',
    angleDeg: 110,
    db: 46,
    time: '1m ago',
  },
];

interface HearingState {
  isListening: boolean;
  ambientDb: number;
  transcripts: CaptionMessage[];
  soundEvents: SoundRadarEvent[];
  activeAlert: string | null;
  selectedCaptionSize: 'md' | 'lg' | 'xl';
  setCaptionSize: (size: 'md' | 'lg' | 'xl') => void;
  toggleListening: () => void;
  addTranscript: (msg: CaptionMessage) => void;
  triggerMockSoundEvent: (category: SoundRadarEvent['category']) => void;
  clearTranscripts: () => void;
}

export const useHearingStore = create<HearingState>((set, get) => ({
  isListening: true,
  ambientDb: 38,
  transcripts: INITIAL_TRANSCRIPTS,
  soundEvents: INITIAL_RADAR_EVENTS,
  activeAlert: 'Door Knock (Left)',
  selectedCaptionSize: 'lg',
  setCaptionSize: (size) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    set({ selectedCaptionSize: size });
  },

  toggleListening: () => {
    const nextState = !get().isListening;
    try {
      if (nextState) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {}
    set({ isListening: nextState });
  },

  addTranscript: (msg) => {
    set((state) => ({
      transcripts: [...state.transcripts, msg],
    }));
  },

  triggerMockSoundEvent: (category) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    const newEvent: SoundRadarEvent = {
      id: `s-${Date.now()}`,
      title: category === 'door' ? 'Door Knock Alert' : category === 'siren' ? 'High Decibel Siren (82dB)' : 'Speech Detected',
      category,
      direction: 'Left Corridor (270°)',
      angleDeg: 270,
      db: 74,
      time: 'Just now',
    };
    set((state) => ({
      soundEvents: [newEvent, ...state.soundEvents],
      activeAlert: newEvent.title,
    }));
  },

  clearTranscripts: () => set({ transcripts: [] }),
}));
