-- ====================================================================
-- AccessOne AI — Fix Auth Trigger (Database error saving new user)
-- Run this in Supabase SQL Editor to resolve the signup failure
-- ====================================================================

-- 1. Ensure public schema permissions for Supabase Auth roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;

-- 2. Resilient handle_new_user_registration function with explicit search_path and exception handling
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  extracted_name TEXT;
BEGIN
  -- Extract name safely from metadata or email
  extracted_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    split_part(NEW.email, '@', 1),
    'Patient'
  );

  -- 1. Insert Profile safely with conflict resolution
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

  -- 2. Insert User Preferences safely
  INSERT INTO public.user_preferences (
    user_id,
    sensory_profile
  ) VALUES (
    NEW.id,
    'dual'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Insert Activity Log safely
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
    -- Prevent signup failure if trigger encounters any error
    RAISE WARNING 'handle_new_user_registration encountered error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Re-attach trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();
