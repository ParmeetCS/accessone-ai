import { create } from 'zustand';
import { FontScale } from '../theme/typography';
import * as Haptics from '../utils/haptics';
import { User, Session } from '@supabase/supabase-js';
import { authService } from '../services/supabase/auth';
import { profilesService, Profile, ProfileUpdate, UserPreferences } from '../services/supabase/profiles';
import { activityService, ActivityLog } from '../services/supabase/activity';
import { emergencyService, EmergencyContact } from '../services/supabase/emergency';
import { getDeviceTelemetry, DeviceTelemetryData } from '../services/deviceTelemetry';

export type SensoryProfileType = 'vision' | 'hearing' | 'dual' | 'cognitive';
export type HapticIntensityType = 'light' | 'medium' | 'heavy';

interface UserState {
  // Auth state
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  isAuthModalVisible: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  // Profile data
  profile: Profile | null;
  userPreferences: UserPreferences | null;
  displayName: string;
  patientName: string; // compatibility alias
  email: string;
  avatarUrl: string | null;
  ttsVoice: string;
  language: string;

  // Preferences & Accessibility
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  setHighContrast: (val: boolean) => void;

  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  cycleFontScale: (direction: 'up' | 'down' | 'std') => void;

  speechRate: number;
  setSpeechRate: (rate: number) => void;

  sensoryProfile: SensoryProfileType;
  setSensoryProfile: (profile: SensoryProfileType) => void;

  hapticIntensity: HapticIntensityType;
  setHapticIntensity: (intensity: HapticIntensityType) => void;

  reduceMotion: boolean;
  toggleReduceMotion: () => void;

  sosCountdownSeconds: number;
  setSosCountdownSeconds: (sec: number) => void;

  careRingOnline: boolean;
  toggleCareRing: () => void;

  // Dashboard & Telemetry State
  recentActivities: ActivityLog[];
  isLoadingActivities: boolean;
  emergencyContactsCount: number;
  primaryContact: EmergencyContact | null;
  telemetry: DeviceTelemetryData;
  isRefreshingDashboard: boolean;

  // Actions
  initializeAuth: () => Promise<void>;
  refreshDashboardData: () => Promise<void>;
  loadRecentActivities: () => Promise<void>;
  loadEmergencySummary: () => Promise<void>;
  loadDeviceTelemetry: () => Promise<void>;

  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (updates: ProfileUpdate) => Promise<{ success: boolean; error?: string }>;
  updateSensoryPreferences: (type: 'visual' | 'hearing' | 'speech' | 'emergency', key: string, value: any) => Promise<void>;
}

const SCALE_CYCLE: FontScale[] = ['sm', 'std', 'lg', 'xl'];

const defaultTelemetry: DeviceTelemetryData = {
  batteryLevel: null,
  batteryState: 'Not Available',
  cameraPermission: 'Not Determined',
  micPermission: 'Not Determined',
  networkType: 'Online',
  isConnected: true,
  bluetoothStatus: 'Not Available',
  neuralEngineStatus: 'Not Available',
  lastSyncAt: 'Never',
};

export const useUserStore = create<UserState>((set, get) => ({
  // Auth defaults
  session: null,
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,
  authError: null,
  isAuthModalVisible: false,
  openAuthModal: () => set({ isAuthModalVisible: true }),
  closeAuthModal: () => set({ isAuthModalVisible: false, authError: null }),

  // Profile defaults
  profile: null,
  userPreferences: null,
  displayName: 'Guest Patient',
  patientName: 'Guest Patient',
  email: '',
  avatarUrl: null,
  ttsVoice: 'en-US-Neural2-F',
  language: 'en-US',

  // Accessibility defaults
  isHighContrast: false,
  toggleHighContrast: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    const nextVal = !get().isHighContrast;
    set({ isHighContrast: nextVal });

    const user = get().user;
    if (user?.id) {
      profilesService.updateProfile(user.id, { high_contrast: nextVal });
    }
  },
  setHighContrast: (val) => {
    if (get().isHighContrast === val) return;
    set({ isHighContrast: val });
    const user = get().user;
    if (user?.id) {
      profilesService.updateProfile(user.id, { high_contrast: val });
    }
  },

  fontScale: 'std',
  setFontScale: (scale) => {
    if (get().fontScale === scale) return;
    try {
      Haptics.selectionAsync();
    } catch {}
    set({ fontScale: scale });
    const user = get().user;
    if (user?.id) {
      profilesService.updateProfile(user.id, { font_size: scale });
    }
  },
  cycleFontScale: (direction) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    let nextScale: FontScale = 'std';
    if (direction !== 'std') {
      const current = get().fontScale;
      const currentIndex = SCALE_CYCLE.indexOf(current);
      if (direction === 'up') {
        const nextIndex = Math.min(SCALE_CYCLE.length - 1, currentIndex + 1);
        nextScale = SCALE_CYCLE[nextIndex];
      } else {
        const nextIndex = Math.max(0, currentIndex - 1);
        nextScale = SCALE_CYCLE[nextIndex];
      }
    }
    if (get().fontScale === nextScale) return;
    set({ fontScale: nextScale });
    const user = get().user;
    if (user?.id) {
      profilesService.updateProfile(user.id, { font_size: nextScale });
    }
  },

  speechRate: 1.0,
  setSpeechRate: (rate) => {
    if (get().speechRate === rate) return;
    set({ speechRate: rate });
    const user = get().user;
    if (user?.id) {
      profilesService.updateProfile(user.id, { speech_rate: rate });
    }
  },

  sensoryProfile: 'dual',
  setSensoryProfile: (profile) => {
    if (get().sensoryProfile === profile) return;
    try {
      Haptics.selectionAsync();
    } catch {}
    set({ sensoryProfile: profile });
    const user = get().user;
    if (user?.id) {
      profilesService.updateProfile(user.id, { preferred_mode: profile });
      profilesService.updatePreferences(user.id, { sensory_profile: profile });
    }
  },

  hapticIntensity: 'medium',
  setHapticIntensity: (intensity) => {
    set({ hapticIntensity: intensity });
    const user = get().user;
    if (user?.id) {
      get().updateSensoryPreferences('hearing', 'vibration_intensity', intensity);
    }
  },

  reduceMotion: false,
  toggleReduceMotion: () => {
    const nextVal = !get().reduceMotion;
    set({ reduceMotion: nextVal });
    const user = get().user;
    if (user?.id) {
      get().updateSensoryPreferences('visual', 'reduce_motion', nextVal);
    }
  },

  sosCountdownSeconds: 3,
  setSosCountdownSeconds: (sec) => {
    set({ sosCountdownSeconds: sec });
    const user = get().user;
    if (user?.id) {
      get().updateSensoryPreferences('emergency', 'hold_seconds', sec);
    }
  },

  careRingOnline: true,
  toggleCareRing: () => set((state) => ({ careRingOnline: !state.careRingOnline })),

  // Dashboard & Telemetry State
  recentActivities: [],
  isLoadingActivities: false,
  emergencyContactsCount: 0,
  primaryContact: null,
  telemetry: defaultTelemetry,
  isRefreshingDashboard: false,

  // 1. Session Restoration & Auth Listener
  initializeAuth: async () => {
    set({ isAuthLoading: true });
    try {
      const { session, error } = await authService.getSession();
      if (error || !session) {
        set({
          session: null,
          user: null,
          isAuthenticated: false,
          isAuthLoading: false,
        });
        await get().loadDeviceTelemetry();
        return;
      }

      const user = session.user;
      const { data: profile } = await profilesService.ensureProfile(
        user.id,
        user.email || null,
        user.user_metadata?.display_name || user.user_metadata?.full_name || 'Patient'
      );

      const { data: preferences } = await profilesService.getPreferences(user.id);

      const name = profile?.display_name || user.user_metadata?.display_name || user.email || 'Patient';

      set({
        session,
        user,
        profile,
        userPreferences: preferences,
        isAuthenticated: true,
        displayName: name,
        patientName: name,
        email: profile?.email || user.email || '',
        avatarUrl: profile?.avatar_url || null,
        fontScale: profile?.font_size || 'std',
        isHighContrast: profile?.high_contrast || false,
        sensoryProfile: profile?.preferred_mode || 'dual',
        speechRate: profile?.speech_rate || 1.0,
        ttsVoice: profile?.tts_voice || 'en-US-Neural2-F',
        language: profile?.language || 'en-US',
        isAuthLoading: false,
      });

      // Load dashboard data in background
      get().refreshDashboardData();
    } catch {
      set({ isAuthLoading: false });
    }

    // Subscribe to ongoing auth state transitions
    authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        set({
          session: null,
          user: null,
          profile: null,
          userPreferences: null,
          isAuthenticated: false,
          displayName: 'Guest Patient',
          patientName: 'Guest Patient',
          email: '',
          avatarUrl: null,
          fontScale: 'std',
          isHighContrast: false,
          sensoryProfile: 'dual',
          speechRate: 1.0,
          recentActivities: [],
          emergencyContactsCount: 0,
          primaryContact: null,
        });
        get().loadDeviceTelemetry();
      } else if (session?.user) {
        const u = session.user;
        const { data: p } = await profilesService.ensureProfile(
          u.id,
          u.email || null,
          u.user_metadata?.display_name || 'Patient'
        );
        const { data: pref } = await profilesService.getPreferences(u.id);

        const name = p?.display_name || u.user_metadata?.display_name || u.email || 'Patient';
        set({
          session,
          user: u,
          profile: p,
          userPreferences: pref,
          isAuthenticated: true,
          displayName: name,
          patientName: name,
          email: p?.email || u.email || '',
          fontScale: p?.font_size || 'std',
          isHighContrast: p?.high_contrast || false,
          sensoryProfile: p?.preferred_mode || 'dual',
          speechRate: p?.speech_rate || 1.0,
        });
        get().refreshDashboardData();
      }
    });
  },

  // 2. Fetch Recent Activities from activity_logs
  loadRecentActivities: async () => {
    const user = get().user;
    if (!user?.id) {
      set({ recentActivities: [], isLoadingActivities: false });
      return;
    }

    set({ isLoadingActivities: true });
    const { data } = await activityService.getRecentActivities(user.id, 10);
    set({
      recentActivities: data || [],
      isLoadingActivities: false,
    });
  },

  // 3. Fetch Emergency Contacts Summary
  loadEmergencySummary: async () => {
    const user = get().user;
    if (!user?.id) {
      set({ emergencyContactsCount: 0, primaryContact: null });
      return;
    }

    const { data } = await emergencyService.getContacts(user.id);
    const contacts = data || [];
    const primary = contacts.find((c) => c.is_primary) || contacts[0] || null;

    set({
      emergencyContactsCount: contacts.length,
      primaryContact: primary,
    });
  },

  // 4. Fetch Actual Device Telemetry
  loadDeviceTelemetry: async () => {
    const telemetry = await getDeviceTelemetry();
    set({ telemetry });
  },

  // 5. Refresh Entire Dashboard
  refreshDashboardData: async () => {
    set({ isRefreshingDashboard: true });
    await Promise.all([
      get().loadDeviceTelemetry(),
      get().loadRecentActivities(),
      get().loadEmergencySummary(),
    ]);
    set({ isRefreshingDashboard: false });
  },

  // 6. User Sign In
  signIn: async (email: string, password: string) => {
    set({ isAuthLoading: true, authError: null });
    const { user, session, error } = await authService.signIn(email, password);

    if (error || !user) {
      const errMsg = error?.message || 'Authentication failed. Please check credentials.';
      set({ isAuthLoading: false, authError: errMsg });
      return { success: false, error: errMsg };
    }

    const { data: profile } = await profilesService.ensureProfile(
      user.id,
      user.email || null,
      user.user_metadata?.display_name || 'Patient'
    );
    const { data: preferences } = await profilesService.getPreferences(user.id);

    const name = profile?.display_name || user.user_metadata?.display_name || user.email || 'Patient';

    set({
      session,
      user,
      profile,
      userPreferences: preferences,
      isAuthenticated: true,
      displayName: name,
      patientName: name,
      email: profile?.email || user.email || '',
      avatarUrl: profile?.avatar_url || null,
      fontScale: profile?.font_size || 'std',
      isHighContrast: profile?.high_contrast || false,
      sensoryProfile: profile?.preferred_mode || 'dual',
      speechRate: profile?.speech_rate || 1.0,
      ttsVoice: profile?.tts_voice || 'en-US-Neural2-F',
      language: profile?.language || 'en-US',
      isAuthLoading: false,
      isAuthModalVisible: false,
      authError: null,
    });

    get().refreshDashboardData();
    return { success: true };
  },

  // 7. User Registration
  signUp: async (email: string, password: string, displayName: string) => {
    set({ isAuthLoading: true, authError: null });
    const { user, session, error } = await authService.signUp(email, password, displayName);

    if (error) {
      set({ isAuthLoading: false, authError: error.message });
      return { success: false, error: error.message };
    }

    if (session && user) {
      const { data: profile } = await profilesService.ensureProfile(user.id, email, displayName);
      set({
        session,
        user,
        profile,
        isAuthenticated: true,
        displayName: displayName || 'Patient',
        patientName: displayName || 'Patient',
        email,
        isAuthLoading: false,
        isAuthModalVisible: false,
        authError: null,
      });
      get().refreshDashboardData();
      return { success: true };
    }

    set({ isAuthLoading: false });
    return {
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
    };
  },

  // 8. Sign Out
  signOut: async () => {
    set({ isAuthLoading: true });
    await authService.signOut();
    set({
      session: null,
      user: null,
      profile: null,
      userPreferences: null,
      isAuthenticated: false,
      displayName: 'Guest Patient',
      patientName: 'Guest Patient',
      email: '',
      avatarUrl: null,
      fontScale: 'std',
      isHighContrast: false,
      sensoryProfile: 'dual',
      speechRate: 1.0,
      recentActivities: [],
      emergencyContactsCount: 0,
      primaryContact: null,
      isAuthLoading: false,
    });
    get().loadDeviceTelemetry();
  },

  // 9. Password Reset
  resetPassword: async (email: string) => {
    const { error } = await authService.resetPasswordForEmail(email);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  // 10. Update Profile
  updateUserProfile: async (updates: ProfileUpdate) => {
    const user = get().user;
    if (!user?.id) {
      return { success: false, error: 'User is not authenticated' };
    }

    const { data, error } = await profilesService.updateProfile(user.id, updates);
    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to update profile' };
    }

    set({
      profile: data,
      displayName: data.display_name,
      patientName: data.display_name,
      email: data.email || get().email,
      avatarUrl: data.avatar_url,
      fontScale: data.font_size,
      isHighContrast: data.high_contrast,
      sensoryProfile: data.preferred_mode,
      speechRate: data.speech_rate,
      ttsVoice: data.tts_voice,
      language: data.language,
    });

    return { success: true };
  },

  // 11. Update Granular User Preferences (JSON fields)
  updateSensoryPreferences: async (type, key, value) => {
    const user = get().user;
    if (!user?.id) return;

    const currentPrefs = (get().userPreferences || {}) as Record<string, any>;
    const fieldName = `${type}_preferences`;
    const currentSub = (currentPrefs[fieldName] as Record<string, any>) || {};

    // Don't update if value hasn't changed
    if (currentSub[key] === value) return;

    const updatedSub = { ...currentSub, [key]: value };
    const { data } = await profilesService.updatePreferences(user.id, {
      [fieldName]: updatedSub,
    });

    if (data) {
      set({ userPreferences: data });
    }
  },
}));
