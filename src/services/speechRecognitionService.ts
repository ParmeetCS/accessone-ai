/**
 * AccessOne AI - Centralized Speech Recognition & Microphone Service
 * Manages microphone capture lifecycle, audio permissions, and speech-to-text integration
 * Reused across Hearing Assist and Bridge Communication modules.
 */

import { Platform } from 'react-native';
import {
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from 'expo-audio';
import AudioModule from 'expo-audio/build/AudioModule';
import type { AudioRecorder } from 'expo-audio';
import { api, HearingTranscribeResponse, HearingSoundEvent } from './api';

export type RecognitionState = 'idle' | 'recording' | 'paused' | 'transcribing' | 'error';

export interface SpeechRecognitionEvent {
  type: 'transcript' | 'sound_event' | 'telemetry' | 'state_change' | 'error';
  state?: RecognitionState;
  transcript?: string;
  isFinal?: boolean;
  confidence?: number;
  timestamp?: string;
  language?: string;
  soundEvents?: HearingSoundEvent[];
  decibels?: number;
  error?: string;
}

export interface StartListeningOptions {
  language?: string;
  sessionId?: string;
  continuous?: boolean;
  intervalMs?: number;
  onEvent?: (event: SpeechRecognitionEvent) => void;
}

class SpeechRecognitionService {
  private recorder: AudioRecorder | null = null;
  private state: RecognitionState = 'idle';
  private currentLanguage = 'en-US';
  private currentSessionId: string | null = null;
  private continuous = false;
  private intervalMs = 4500;
  private sliceTimer: any = null;
  private listeners: Set<(event: SpeechRecognitionEvent) => void> = new Set();
  private isProcessingChunk = false;
  private webMediaRecorder: any = null;
  private webAudioChunks: Blob[] = [];

  constructor() {
    this.configureAudioSession();
  }

  /**
   * Safe audio mode configuration:
   * Explicitly disables background recording (shouldPlayInBackground: false)
   */
  private async configureAudioSession(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          interruptionMode: 'doNotMix',
        });
      }
    } catch (e: any) {
      console.warn('[SpeechService] Error setting audio mode:', e.message);
    }
  }

  /**
   * Check microphone permission status.
   */
  async checkPermissions(): Promise<{ granted: boolean; canAskAgain: boolean; status: string }> {
    try {
      if (Platform.OS === 'web') {
        if (!navigator?.mediaDevices?.getUserMedia) {
          return { granted: false, canAskAgain: false, status: 'unavailable' };
        }
        return { granted: true, canAskAgain: true, status: 'granted' };
      }

      const res = await getRecordingPermissionsAsync();
      return {
        granted: res.granted,
        canAskAgain: res.canAskAgain,
        status: res.status,
      };
    } catch (e: any) {
      console.warn('[SpeechService] checkPermissions error:', e.message);
      return { granted: false, canAskAgain: true, status: 'error' };
    }
  }

  /**
   * Request microphone permission explicitly from the user.
   */
  async requestPermissions(): Promise<{ granted: boolean; status: string }> {
    try {
      if (Platform.OS === 'web') {
        if (!navigator?.mediaDevices?.getUserMedia) {
          return { granted: false, status: 'unavailable' };
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return { granted: true, status: 'granted' };
      }

      const res = await requestRecordingPermissionsAsync();
      return {
        granted: res.granted,
        status: res.status,
      };
    } catch (e: any) {
      console.warn('[SpeechService] requestPermissions error:', e.message);
      return { granted: false, status: 'denied' };
    }
  }

  /**
   * Check if microphone hardware is available on the device.
   */
  async isMicrophoneAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return !!(navigator?.mediaDevices?.getUserMedia);
    }
    const perm = await this.checkPermissions();
    return perm.status !== 'unavailable';
  }

  /**
   * Current recognition state.
   */
  getState(): RecognitionState {
    return this.state;
  }

  /**
   * Current language.
   */
  getLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Set target transcription language.
   */
  setLanguage(lang: string): void {
    this.currentLanguage = lang;
  }

  /**
   * Subscribe to speech recognition events.
   */
  addListener(listener: (event: SpeechRecognitionEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: SpeechRecognitionEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (e) {
        console.error('[SpeechService] Listener error:', e);
      }
    }
  }

  private setState(next: RecognitionState): void {
    if (this.state === next) return;
    this.state = next;
    this.notify({ type: 'state_change', state: next });
  }

  /**
   * Starts microphone capture and speech recognition.
   * In continuous mode (Hearing Assist), cycles audio intervals and streams transcripts.
   * In single-shot mode (Bridge Communication), records until paused or stopped.
   */
  async startListening(options: StartListeningOptions = {}): Promise<boolean> {
    try {
      // 1. Permission check
      const perm = await this.checkPermissions();
      if (!perm.granted) {
        const req = await this.requestPermissions();
        if (!req.granted) {
          this.setState('error');
          this.notify({
            type: 'error',
            error: 'Microphone permission denied. Please grant microphone access in settings.',
          });
          return false;
        }
      }

      // 2. Configure audio settings
      await this.configureAudioSession();

      this.currentLanguage = options.language || this.currentLanguage;
      this.currentSessionId = options.sessionId || null;
      this.continuous = options.continuous ?? false;
      this.intervalMs = options.intervalMs || 4500;

      if (options.onEvent) {
        this.addListener(options.onEvent);
      }

      // 3. Initialize and start recording
      if (Platform.OS === 'web') {
        await this.startWebRecording();
      } else {
        await this.startNativeRecording();
      }

      this.setState('recording');

      // 4. Schedule continuous slices if continuous mode is active
      if (this.continuous) {
        this.scheduleNextSlice();
      }

      return true;
    } catch (e: any) {
      console.error('[SpeechService] startListening error:', e);
      this.setState('error');
      this.notify({
        type: 'error',
        error: `Failed to initialize microphone: ${e.message}`,
      });
      return false;
    }
  }

  private async startNativeRecording(): Promise<void> {
    try {
      if (this.recorder) {
        await this.stopNativeRecorder();
      }

      this.recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
      if (this.recorder) {
        await this.recorder.prepareToRecordAsync();
        this.recorder.record();
      }
    } catch (e: any) {
      console.error('[SpeechService] startNativeRecording error:', e);
      throw e;
    }
  }

  private async startWebRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.webAudioChunks = [];
    this.webMediaRecorder = new (window as any).MediaRecorder(stream);
    this.webMediaRecorder.ondataavailable = (e: any) => {
      if (e.data && e.data.size > 0) {
        this.webAudioChunks.push(e.data);
      }
    };
    this.webMediaRecorder.start();
  }

  /**
   * Pauses microphone listening.
   */
  async pauseListening(): Promise<void> {
    if (this.state !== 'recording') return;

    try {
      this.clearSliceTimer();

      if (Platform.OS === 'web') {
        if (this.webMediaRecorder && this.webMediaRecorder.state === 'recording') {
          this.webMediaRecorder.pause();
        }
      } else if (this.recorder) {
        this.recorder.pause();
      }

      this.setState('paused');
    } catch (e: any) {
      console.warn('[SpeechService] pauseListening error:', e.message);
    }
  }

  /**
   * Resumes microphone listening.
   */
  async resumeListening(): Promise<void> {
    if (this.state !== 'paused') return;

    try {
      await this.configureAudioSession();

      if (Platform.OS === 'web') {
        if (this.webMediaRecorder && this.webMediaRecorder.state === 'paused') {
          this.webMediaRecorder.resume();
        } else {
          await this.startWebRecording();
        }
      } else if (this.recorder) {
        this.recorder.record();
      } else {
        await this.startNativeRecording();
      }

      this.setState('recording');

      if (this.continuous) {
        this.scheduleNextSlice();
      }
    } catch (e: any) {
      console.error('[SpeechService] resumeListening error:', e.message);
      this.setState('error');
    }
  }

  /**
   * Stops microphone listening and returns final transcription result.
   */
  async stopListening(): Promise<HearingTranscribeResponse | null> {
    this.clearSliceTimer();

    if (this.state === 'idle') return null;

    this.setState('transcribing');

    let result: HearingTranscribeResponse | null = null;
    try {
      const audioBase64 = await this.stopAndExtractBase64();
      if (audioBase64 && audioBase64.length > 80) {
        result = await api.hearing.transcribe({
          audio: audioBase64,
          format: Platform.OS === 'web' ? 'webm' : 'm4a',
          language: this.currentLanguage,
          sessionId: this.currentSessionId || undefined,
          isFinal: true,
        });

        if (result) {
          this.emitTranscribeResult(result, true);
        }
      }
    } catch (e: any) {
      console.error('[SpeechService] stopListening transcription error:', e);
      this.notify({
        type: 'error',
        error: `Transcription failed: ${e.message}`,
      });
    } finally {
      this.setState('idle');
    }

    return result;
  }

  /**
   * Cycle a chunk slice in continuous mode.
   */
  private scheduleNextSlice(): void {
    this.clearSliceTimer();

    this.sliceTimer = setTimeout(async () => {
      if (this.state !== 'recording' || this.isProcessingChunk) {
        if (this.state === 'recording') {
          this.scheduleNextSlice();
        }
        return;
      }

      this.isProcessingChunk = true;
      try {
        const audioBase64 = await this.stopAndExtractBase64();

        // Immediately restart recorder so audio gap is near zero
        if (this.state === 'recording') {
          if (Platform.OS === 'web') {
            await this.startWebRecording();
          } else {
            await this.startNativeRecording();
          }
        }

        if (audioBase64 && audioBase64.length > 80) {
          const res = await api.hearing.transcribe({
            audio: audioBase64,
            format: Platform.OS === 'web' ? 'webm' : 'm4a',
            language: this.currentLanguage,
            sessionId: this.currentSessionId || undefined,
            isFinal: false,
          });

          this.emitTranscribeResult(res, false);
        }
      } catch (err: any) {
        console.warn('[SpeechService] Chunk processing error:', err.message);
      } finally {
        this.isProcessingChunk = false;
        if (this.state === 'recording') {
          this.scheduleNextSlice();
        }
      }
    }, this.intervalMs);
  }

  private emitTranscribeResult(res: HearingTranscribeResponse, isFinal: boolean): void {
    // 1. Emit telemetry
    this.notify({
      type: 'telemetry',
      decibels: res.decibels,
    });

    // 2. Emit detected environmental sound events
    if (res.sound_events && res.sound_events.length > 0) {
      this.notify({
        type: 'sound_event',
        soundEvents: res.sound_events,
        decibels: res.decibels,
      });
    }

    // 3. Emit recognized speech transcript if available
    if (res.transcript && res.transcript.trim()) {
      this.notify({
        type: 'transcript',
        transcript: res.transcript.trim(),
        isFinal: isFinal || res.is_final,
        confidence: res.confidence,
        timestamp: res.timestamp,
        language: res.language,
      });
    }
  }

  private async stopAndExtractBase64(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await this.extractWebAudioBase64();
      } else {
        return await this.extractNativeAudioBase64();
      }
    } catch (e: any) {
      console.warn('[SpeechService] Extract audio base64 error:', e.message);
      return null;
    }
  }

  private async extractNativeAudioBase64(): Promise<string | null> {
    if (!this.recorder) return null;

    try {
      await this.recorder.stop();
      const fileUri = this.recorder.uri;
      if (!fileUri) return null;

      // Read audio file bytes to base64 using universal fetch & FileReader
      const res = await fetch(fileUri);
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const resultStr = reader.result as string;
          resolve(resultStr);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e: any) {
      console.warn('[SpeechService] extractNativeAudioBase64 error:', e.message);
      return null;
    }
  }

  private async extractWebAudioBase64(): Promise<string | null> {
    if (!this.webMediaRecorder) return null;

    return await new Promise<string | null>((resolve) => {
      this.webMediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.webAudioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
      };
      this.webMediaRecorder.stop();
    });
  }

  private async stopNativeRecorder(): Promise<void> {
    if (this.recorder) {
      try {
        await this.recorder.stop();
      } catch {}
      this.recorder = null;
    }
  }

  private clearSliceTimer(): void {
    if (this.sliceTimer) {
      clearTimeout(this.sliceTimer);
      this.sliceTimer = null;
    }
  }

  /**
   * Complete cleanup when leaving a screen or terminating a session.
   */
  async cleanup(): Promise<void> {
    this.clearSliceTimer();
    this.continuous = false;

    if (Platform.OS === 'web') {
      if (this.webMediaRecorder) {
        try {
          this.webMediaRecorder.stop();
        } catch {}
        this.webMediaRecorder = null;
      }
    } else {
      await this.stopNativeRecorder();
    }

    this.setState('idle');
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
