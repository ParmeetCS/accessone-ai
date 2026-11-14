import { create } from 'zustand';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  status: 'linked' | 'alerted' | 'standby';
}

export interface DispatchProfile {
  name: string;
  age: number;
  bloodType: string;
  allergies: string[];
  conditions: string[];
  emergencyNotes: string;
  cadIntegration: string;
}

interface SafetyState {
  isArmed: boolean;
  sosTriggered: boolean;
  isHolding: boolean;
  holdProgress: number; // 0 to 1
  activeDistressType: string | null;

  location: {
    latitude: number;
    longitude: number;
    address: string;
    accuracyMeters: number;
    facilityName: string;
  } | null;
  locationLoading: boolean;

  contacts: EmergencyContact[];
  dispatchProfile: DispatchProfile;

  fetchCurrentLocation: () => Promise<void>;
  startHold: () => void;
  updateHoldProgress: (progress: number) => void;
  triggerSos: (category?: string) => void;
  cancelSos: () => void;
  cancelHold: () => void;
  triggerDistressCategory: (category: string) => void;
}

const DEFAULT_PROFILE: DispatchProfile = {
  name: 'Sarah Jenkins',
  age: 34,
  bloodType: 'O-Positive',
  allergies: ['Penicillin (Moderate Anaphylaxis)', 'Sulfa Drugs'],
  conditions: ['Low Vision (Acuity 20/200)', 'Bilateral Moderate Hearing Loss'],
  emergencyNotes: 'Communicates via AccessOne Dual-Channel Speech Synthesis and ASL. Carries rapid-acting inhaler.',
  cadIntegration: 'Direct 911 PSAP Digital Payload v4.2',
};

const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    id: 'c-1',
    name: 'Dr. Evans',
    relation: 'Primary Physician',
    phone: '+1 (555) 234-8901',
    status: 'linked',
  },
  {
    id: 'c-2',
    name: 'Mark Jenkins',
    relation: 'Spouse & Primary Caregiver',
    phone: '+1 (555) 987-6543',
    status: 'linked',
  },
  {
    id: 'c-3',
    name: 'St. Jude Emergency Dispatch',
    relation: 'Hospital Rapid Response',
    phone: 'Direct CAD Link',
    status: 'linked',
  },
];

export const useSafetyStore = create<SafetyState>((set, get) => ({
  isArmed: true,
  sosTriggered: false,
  isHolding: false,
  holdProgress: 0,
  activeDistressType: null,

  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    address: 'Room 304, West Wing, St. Jude Health Center',
    accuracyMeters: 1.4,
    facilityName: 'St. Jude Medical Center, San Francisco, CA',
  },
  locationLoading: false,

  contacts: DEFAULT_CONTACTS,
  dispatchProfile: DEFAULT_PROFILE,

  fetchCurrentLocation: async () => {
    set({ locationLoading: true });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        set({
          location: {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            address: 'Verified GPS Coords Pin',
            accuracyMeters: Math.round(loc.coords.accuracy || 2),
            facilityName: 'St. Jude Medical Center, San Francisco, CA',
          },
          locationLoading: false,
        });
      } else {
        set({ locationLoading: false });
      }
    } catch {
      set({ locationLoading: false });
    }
  },

  startHold: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    set({ isHolding: true, holdProgress: 0 });
  },

  updateHoldProgress: (progress) => {
    set({ holdProgress: progress });
    if (progress > 0.3 && progress < 0.35) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    } else if (progress > 0.7 && progress < 0.75) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    }
  },

  triggerSos: (category = 'General Emergency') => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}
    set({
      sosTriggered: true,
      isHolding: false,
      holdProgress: 1,
      activeDistressType: category,
      contacts: get().contacts.map((c) => ({ ...c, status: 'alerted' })),
    });
  },

  cancelSos: () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    set({
      sosTriggered: false,
      isHolding: false,
      holdProgress: 0,
      activeDistressType: null,
      contacts: get().contacts.map((c) => ({ ...c, status: 'linked' })),
    });
  },

  cancelHold: () => {
    set({ isHolding: false, holdProgress: 0 });
  },

  triggerDistressCategory: (category) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    get().triggerSos(category);
  },
}));
