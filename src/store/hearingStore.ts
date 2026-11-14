import { create } from 'zustand';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import {
  speechRecognitionService,
  RecognitionState,
  SpeechRecognitionEvent,
} from '../services/speechRecognitionService';
import { hearingService } from '../services/supabase/hearing';
import { activityService } from '../services/supabase/activity';
import { useUserStore } from './userStore';

export interface CaptionMessage {
  id: string;
  speaker: string;
  role: 'doctor' | 'nurse' | 'patient' | 'system';
  avatarInitials: string;
  text: string;
  timestamp: string;
  isFinal?: boolean;
  confidence?: number;
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
  confidence?: number;
}

interface HearingState {
  isListening: boolean;
  isPaused: boolean;
  recordingStatus: RecognitionState;
  sessionId: string | null;
  selectedLanguage: string;
  ambientDb: number;
  transcripts: CaptionMessage[];
  soundEvents: SoundRadarEvent[];
  activeAlert: string | null;
  selectedCaptionSize: 'md' | 'lg' | 'xl';
  errorMessage: string | null;
  liveInterimText: string | null;

  // Actions
  setCaptionSize: (size: 'md' | 'lg' | 'xl') => void;
  setLanguage: (lang: string) => void;
  startListening: () => Promise<boolean>;
  pauseListening: () => Promise<void>;
  resumeListening: () => Promise<void>;
  stopSession: () => Promise<void>;
  toggleListening: () => Promise<void>;
  clearTranscripts: () => void;
  copyTranscript: () => Promise<boolean>;
  saveTranscript: () => Promise<boolean>;
  triggerMockSoundEvent: (category: SoundRadarEvent['category']) => void;
  addTranscript: (msg: CaptionMessage) => void;
  dismissAlert: () => void;
  cleanup: () => Promise<void>;
}

export const useHearingStore = create<HearingState>((set, get) => {
  // Listen to centralized speech recognition events
  speechRecognitionService.addListener((event: SpeechRecognitionEvent) => {
    switch (event.type) {
      case 'state_change':
        if (event.state) {
          set({
            recordingStatus: event.state,
            isListening: event.state === 'recording',
            isPaused: event.state === 'paused',
          });
        }
        break;

      case 'telemetry':
        if (event.decibels !== undefined) {
          set({ ambientDb: event.decibels });
        }
        break;

      case 'transcript':
        if (event.transcript && event.transcript.trim()) {
          const timestamp = event.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const newMsg: CaptionMessage = {
            id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            speaker: 'Live Speaker',
            role: 'doctor',
            avatarInitials: 'LS',
            text: event.transcript.trim(),
            timestamp,
            isFinal: event.isFinal ?? true,
            confidence: event.confidence,
          };

          get().addTranscript(newMsg);
          set({ liveInterimText: null });

          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {}
        }
        break;

      case 'sound_event':
        if (event.soundEvents && event.soundEvents.length > 0) {
          const radarEvents: SoundRadarEvent[] = event.soundEvents.map((se) => ({
            id: se.id || `se-${Date.now()}`,
            title: se.title,
            category: se.category,
            direction: se.direction,
            angleDeg: se.angleDeg,
            db: se.db,
            time: se.time || 'Live',
            confidence: se.confidence,
          }));

          const primaryEvent = radarEvents[0];
          set((state) => ({
            soundEvents: [...radarEvents, ...state.soundEvents.slice(0, 10)],
            activeAlert: primaryEvent ? primaryEvent.title : state.activeAlert,
            ambientDb: event.decibels !== undefined ? event.decibels : state.ambientDb,
          }));

          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch {}
        }
        break;

      case 'error':
        if (event.error) {
          set({ errorMessage: event.error });
        }
        break;
    }
  });

  return {
    isListening: false,
    isPaused: false,
    recordingStatus: 'idle',
    sessionId: null,
    selectedLanguage: 'en-US',
    ambientDb: 38,
    transcripts: [],
    soundEvents: [],
    activeAlert: null,
    selectedCaptionSize: 'lg',
    errorMessage: null,
    liveInterimText: null,

    setCaptionSize: (size) => {
      try {
        Haptics.selectionAsync();
      } catch {}
      set({ selectedCaptionSize: size });
    },

    setLanguage: (lang) => {
      speechRecognitionService.setLanguage(lang);
      set({ selectedLanguage: lang });
    },

    startListening: async () => {
      set({ errorMessage: null });
      const user = useUserStore.getState().user;
      let sessionId = get().sessionId;

      // Start Supabase hearing session if logged in
      if (user?.id && !sessionId) {
        try {
          const { data } = await hearingService.startSession(user.id, get().selectedLanguage);
          if (data?.id) {
            sessionId = data.id;
            set({ sessionId: data.id });
          }
        } catch (e: any) {
          console.warn('[HearingStore] Supabase session start error:', e.message);
        }
      }

      const started = await speechRecognitionService.startListening({
        language: get().selectedLanguage,
        sessionId: sessionId || undefined,
        continuous: true,
        intervalMs: 4500,
      });

      if (started) {
        set({ isListening: true, isPaused: false, recordingStatus: 'recording' });
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }
      return started;
    },

    pauseListening: async () => {
      await speechRecognitionService.pauseListening();
      set({ isListening: false, isPaused: true, recordingStatus: 'paused' });
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    },

    resumeListening: async () => {
      await speechRecognitionService.resumeListening();
      set({ isListening: true, isPaused: false, recordingStatus: 'recording' });
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    },

    stopSession: async () => {
      const sessionId = get().sessionId;
      await speechRecognitionService.stopListening();

      // End session in Supabase and log activity
      if (sessionId) {
        try {
          await hearingService.endSession(sessionId);
        } catch (e: any) {
          console.warn('[HearingStore] End session error:', e.message);
        }
      }

      const user = useUserStore.getState().user;
      if (user?.id) {
        try {
          await activityService.logActivity({
            user_id: user.id,
            activity_type: 'hearing',
            title: 'Hearing Assist Session Completed',
            description: `Session finalized with ${get().transcripts.length} transcript segments captured.`,
            metadata: {
              sessionId,
              transcriptCount: get().transcripts.length,
              language: get().selectedLanguage,
              endedAt: new Date().toISOString(),
            },
          });
        } catch (e) {}
      }

      set({
        isListening: false,
        isPaused: false,
        recordingStatus: 'idle',
        sessionId: null,
      });

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    },

    toggleListening: async () => {
      const { isListening, isPaused } = get();
      if (isListening) {
        await get().pauseListening();
      } else if (isPaused) {
        await get().resumeListening();
      } else {
        await get().startListening();
      }
    },

    addTranscript: (msg) => {
      set((state) => ({
        transcripts: [...state.transcripts, msg],
      }));

      // Persist to Supabase if session active
      const sessionId = get().sessionId;
      if (sessionId) {
        hearingService
          .logTranscript({
            session_id: sessionId,
            transcript: msg.text,
            is_final: msg.isFinal ?? true,
          })
          .catch((err) => console.warn('[HearingStore] Transcript persistence error:', err.message));
      }
    },

    clearTranscripts: () => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      set({ transcripts: [], liveInterimText: null });
    },

    copyTranscript: async () => {
      const list = get().transcripts;
      if (list.length === 0) return false;

      const fullText = list
        .map((t) => `[${t.timestamp}] ${t.speaker} (${t.role}): ${t.text}`)
        .join('\n\n');

      try {
        await Clipboard.setStringAsync(fullText);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return true;
      } catch (e: any) {
        console.warn('[HearingStore] Copy failed:', e.message);
        return false;
      }
    },

    saveTranscript: async () => {
      const list = get().transcripts;
      if (list.length === 0) return false;

      // Copy transcript to clipboard and log to activities
      await get().copyTranscript();

      const user = useUserStore.getState().user;
      if (user?.id) {
        try {
          await activityService.logActivity({
            user_id: user.id,
            activity_type: 'hearing',
            title: 'Transcript Saved to Records',
            description: `Copied and recorded ${list.length} transcript lines to clinical history.`,
            metadata: {
              savedAt: new Date().toISOString(),
              totalLines: list.length,
              language: get().selectedLanguage,
            },
          });
        } catch (e) {}
      }

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      return true;
    },

    triggerMockSoundEvent: (category) => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}
      const newEvent: SoundRadarEvent = {
        id: `s-${Date.now()}`,
        title:
          category === 'door'
            ? 'Door Knock Alert'
            : category === 'siren'
            ? 'Emergency Siren (82dB)'
            : category === 'alarm'
            ? 'Fire / Smoke Alarm (3.1 kHz)'
            : 'Speech Detected',
        category,
        direction: category === 'door' ? 'Corridor (280°)' : category === 'siren' ? 'Street (45°)' : 'Ceiling (0°)',
        angleDeg: category === 'door' ? 280 : category === 'siren' ? 45 : 0,
        db: category === 'siren' ? 82 : category === 'alarm' ? 86 : 64,
        time: 'Just now',
        confidence: 0.95,
      };
      set((state) => ({
        soundEvents: [newEvent, ...state.soundEvents],
        activeAlert: newEvent.title,
      }));
    },

    dismissAlert: () => set({ activeAlert: null }),

    cleanup: async () => {
      await speechRecognitionService.cleanup();
      set({ isListening: false, isPaused: false, recordingStatus: 'idle' });
    },
  };
});
