/**
 * AccessOne AI — Database Type Definitions
 * Generated matching PostgreSQL foundation migration schema for Supabase JS v2.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type FontScale = 'sm' | 'std' | 'lg' | 'xl';
export type SensoryProfileType = 'vision' | 'hearing' | 'dual' | 'cognitive';
export type HapticIntensityType = 'light' | 'medium' | 'heavy';
export type VisionScanMode = 'ocr' | 'describe' | 'objects' | 'barcode';
export type EmergencySosStatus = 'dispatched' | 'acknowledged' | 'cancelled' | 'resolved';
export type BridgeSessionStatus = 'active' | 'paused' | 'completed';
export type BridgeMessageType = 'patient_voice' | 'provider_voice' | 'system' | 'asl_caption';
export type HearingSessionStatus = 'listening' | 'paused' | 'ended';
export type ActivityType = 'vision' | 'hearing' | 'bridge' | 'safety' | 'settings' | 'auth';
export type DeviceConnectionStatus = 'connected' | 'disconnected' | 'standby';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          email: string | null;
          avatar_url: string | null;
          preferred_mode: SensoryProfileType;
          font_size: FontScale;
          high_contrast: boolean;
          language: string;
          tts_voice: string;
          speech_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          email?: string | null;
          avatar_url?: string | null;
          preferred_mode?: SensoryProfileType;
          font_size?: FontScale;
          high_contrast?: boolean;
          language?: string;
          tts_voice?: string;
          speech_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          email?: string | null;
          avatar_url?: string | null;
          preferred_mode?: SensoryProfileType;
          font_size?: FontScale;
          high_contrast?: boolean;
          language?: string;
          tts_voice?: string;
          speech_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          sensory_profile: SensoryProfileType;
          visual_preferences: Json;
          hearing_preferences: Json;
          speech_preferences: Json;
          emergency_preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sensory_profile?: SensoryProfileType;
          visual_preferences?: Json;
          hearing_preferences?: Json;
          speech_preferences?: Json;
          emergency_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sensory_profile?: SensoryProfileType;
          visual_preferences?: Json;
          hearing_preferences?: Json;
          speech_preferences?: Json;
          emergency_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      emergency_contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string;
          relationship: string;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone: string;
          relationship: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string;
          relationship?: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      sos_events: {
        Row: {
          id: string;
          user_id: string;
          latitude: number;
          longitude: number;
          status: EmergencySosStatus;
          contacts_notified: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          latitude: number;
          longitude: number;
          status?: EmergencySosStatus;
          contacts_notified?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          latitude?: number;
          longitude?: number;
          status?: EmergencySosStatus;
          contacts_notified?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      bridge_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_status: BridgeSessionStatus;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_status?: BridgeSessionStatus;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_status?: BridgeSessionStatus;
          started_at?: string;
          ended_at?: string | null;
        };
        Relationships: [];
      };

      bridge_messages: {
        Row: {
          id: string;
          session_id: string;
          sender_id: string;
          message_type: BridgeMessageType;
          original_text: string;
          translated_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          sender_id: string;
          message_type: BridgeMessageType;
          original_text: string;
          translated_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          sender_id?: string;
          message_type?: BridgeMessageType;
          original_text?: string;
          translated_text?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      vision_scans: {
        Row: {
          id: string;
          user_id: string;
          scan_mode: VisionScanMode;
          extracted_text: string;
          confidence: number;
          processing_time_ms: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scan_mode: VisionScanMode;
          extracted_text: string;
          confidence: number;
          processing_time_ms?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          scan_mode?: VisionScanMode;
          extracted_text?: string;
          confidence?: number;
          processing_time_ms?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      hearing_sessions: {
        Row: {
          id: string;
          user_id: string;
          status: HearingSessionStatus;
          language: string;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: HearingSessionStatus;
          language?: string;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: HearingSessionStatus;
          language?: string;
          started_at?: string;
          ended_at?: string | null;
        };
        Relationships: [];
      };

      hearing_transcripts: {
        Row: {
          id: string;
          session_id: string;
          transcript: string;
          is_final: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          transcript: string;
          is_final?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          transcript?: string;
          is_final?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          activity_type: ActivityType;
          title: string;
          description: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: ActivityType;
          title: string;
          description: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: ActivityType;
          title?: string;
          description?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };

      device_status: {
        Row: {
          id: string;
          user_id: string;
          device_name: string;
          battery_level: number | null;
          connection_status: DeviceConnectionStatus;
          last_seen_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_name: string;
          battery_level?: number | null;
          connection_status?: DeviceConnectionStatus;
          last_seen_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_name?: string;
          battery_level?: number | null;
          connection_status?: DeviceConnectionStatus;
          last_seen_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
