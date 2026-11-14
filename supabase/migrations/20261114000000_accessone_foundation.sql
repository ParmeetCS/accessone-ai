-- ====================================================================
-- ACCESS ONE AI: CLINICAL ASSISTIVE PLATFORM
-- DATABASE FOUNDATION MIGRATION
-- Migration: 20261114000000_accessone_foundation.sql
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. HELPER FUNCTIONS & TRIGGERS
-- ====================================================================

-- Trigger function to automatically update `updated_at` timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 3. CORE TABLES
-- ====================================================================

-- Table 1: Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  preferred_mode TEXT DEFAULT 'dual' CHECK (preferred_mode IN ('vision', 'hearing', 'dual', 'cognitive')),
  font_size TEXT DEFAULT 'std' CHECK (font_size IN ('sm', 'std', 'lg', 'xl')),
  high_contrast BOOLEAN DEFAULT FALSE,
  language TEXT DEFAULT 'en-US',
  tts_voice TEXT DEFAULT 'clinical-neutral',
  speech_rate NUMERIC(3, 2) DEFAULT 1.00 CHECK (speech_rate BETWEEN 0.85 AND 1.50),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Table 2: User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sensory_profile TEXT DEFAULT 'dual' CHECK (sensory_profile IN ('vision', 'hearing', 'dual', 'cognitive')),
  visual_preferences JSONB DEFAULT '{"contrast_boost": 40, "magnification": 1.0, "color_filter": "none"}'::jsonb NOT NULL,
  hearing_preferences JSONB DEFAULT '{"anc_enabled": true, "vibration_alerts": true, "radar_range_meters": 10}'::jsonb NOT NULL,
  speech_preferences JSONB DEFAULT '{"speed": 1.0, "pitch": 1.0, "auto_speak_typed": true}'::jsonb NOT NULL,
  emergency_preferences JSONB DEFAULT '{"hold_seconds": 3, "auto_share_gps": true, "silent_sms": false}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

CREATE TRIGGER set_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Table 3: Emergency Contacts
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_emergency_contacts_updated_at
BEFORE UPDATE ON public.emergency_contacts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Partial unique index to strictly guarantee only one primary contact per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_primary_emergency_contact_per_user 
ON public.emergency_contacts(user_id) 
WHERE is_primary = TRUE;

-- Table 4: SOS Events
CREATE TABLE IF NOT EXISTS public.sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  status TEXT DEFAULT 'dispatched' CHECK (status IN ('dispatched', 'acknowledged', 'cancelled', 'resolved')) NOT NULL,
  contacts_notified INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 5: Bridge Sessions
CREATE TABLE IF NOT EXISTS public.bridge_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_status TEXT DEFAULT 'active' CHECK (session_status IN ('active', 'paused', 'completed')) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ
);

-- Table 6: Bridge Messages
CREATE TABLE IF NOT EXISTS public.bridge_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.bridge_sessions(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('patient_voice', 'provider_voice', 'system', 'asl_caption')),
  original_text TEXT NOT NULL,
  translated_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 7: Vision Scans
CREATE TABLE IF NOT EXISTS public.vision_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scan_mode TEXT NOT NULL CHECK (scan_mode IN ('ocr', 'describe', 'objects', 'barcode')),
  extracted_text TEXT NOT NULL,
  confidence NUMERIC(5, 2) NOT NULL,
  processing_time_ms INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 8: Hearing Sessions
CREATE TABLE IF NOT EXISTS public.hearing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'listening' CHECK (status IN ('listening', 'paused', 'ended')) NOT NULL,
  language TEXT DEFAULT 'en-US' NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ
);

-- Table 9: Hearing Transcripts
CREATE TABLE IF NOT EXISTS public.hearing_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.hearing_sessions(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  is_final BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 10: Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('vision', 'hearing', 'bridge', 'safety', 'settings', 'auth')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 11: Device Status
CREATE TABLE IF NOT EXISTS public.device_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  battery_level INT CHECK (battery_level BETWEEN 0 AND 100),
  connection_status TEXT DEFAULT 'connected' CHECK (connection_status IN ('connected', 'disconnected', 'standby')) NOT NULL,
  last_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_device UNIQUE (user_id, device_name)
);

CREATE TRIGGER set_device_status_updated_at
BEFORE UPDATE ON public.device_status
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- 4. PERFORMANCE INDEXES
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON public.emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_events_user ON public.sos_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bridge_sessions_user ON public.bridge_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_bridge_messages_session ON public.bridge_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_vision_scans_user ON public.vision_scans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hearing_sessions_user ON public.hearing_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_hearing_transcripts_session ON public.hearing_transcripts(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_status_user ON public.device_status(user_id);

-- ====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bridge_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bridge_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearing_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_status ENABLE ROW LEVEL SECURITY;

-- Profiles: Only authenticated user can access their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User Preferences
CREATE POLICY "preferences_select_own" ON public.user_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "preferences_insert_own" ON public.user_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "preferences_update_own" ON public.user_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Emergency Contacts
CREATE POLICY "contacts_all_own" ON public.emergency_contacts
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SOS Events
CREATE POLICY "sos_all_own" ON public.sos_events
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Bridge Sessions
CREATE POLICY "bridge_sessions_all_own" ON public.bridge_sessions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Bridge Messages: Check parent session ownership
CREATE POLICY "bridge_messages_select_own" ON public.bridge_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.bridge_sessions 
      WHERE id = bridge_messages.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "bridge_messages_insert_own" ON public.bridge_messages
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bridge_sessions 
      WHERE id = bridge_messages.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "bridge_messages_delete_own" ON public.bridge_messages
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.bridge_sessions 
      WHERE id = bridge_messages.session_id AND user_id = auth.uid()
    )
  );

-- Vision Scans
CREATE POLICY "vision_scans_all_own" ON public.vision_scans
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Hearing Sessions
CREATE POLICY "hearing_sessions_all_own" ON public.hearing_sessions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Hearing Transcripts: Check parent hearing session ownership
CREATE POLICY "hearing_transcripts_select_own" ON public.hearing_transcripts
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.hearing_sessions 
      WHERE id = hearing_transcripts.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "hearing_transcripts_insert_own" ON public.hearing_transcripts
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hearing_sessions 
      WHERE id = hearing_transcripts.session_id AND user_id = auth.uid()
    )
  );

-- Activity Logs
CREATE POLICY "activity_logs_all_own" ON public.activity_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Device Status
CREATE POLICY "device_status_all_own" ON public.device_status
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- 6. AUTH AUTOMATION TRIGGER (NEW SIGNUPS)
-- ====================================================================

-- Automatically create a profile and default preferences when a new user registers
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  extracted_name TEXT;
BEGIN
  extracted_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    split_part(NEW.email, '@', 1),
    'Patient'
  );

  -- Insert profile
  INSERT INTO public.profiles (
    id,
    display_name,
    email,
    preferred_mode,
    font_size,
    high_contrast,
    language,
    tts_voice,
    speech_rate
  ) VALUES (
    NEW.id,
    extracted_name,
    NEW.email,
    'dual',
    'std',
    FALSE,
    'en-US',
    'en-US-Neural2-F',
    1.00
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(NULLIF(EXCLUDED.display_name, ''), public.profiles.display_name),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    updated_at = NOW();

  -- Insert default user preferences
  INSERT INTO public.user_preferences (
    user_id,
    sensory_profile
  ) VALUES (
    NEW.id,
    'dual'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert initial onboarding activity log
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    title,
    description,
    metadata
  ) VALUES (
    NEW.id,
    'auth',
    'Account Initialized',
    'Clinical accessibility profile configured with default sensory preferences.',
    jsonb_build_object('event', 'user_signup', 'email', NEW.email)
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user_registration encountered error: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- ====================================================================
-- 7. REALTIME PUBLICATION CONFIGURATION
-- ====================================================================

-- Enable realtime streaming on bridge_messages, hearing_transcripts, and sos_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.bridge_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hearing_transcripts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_events;
