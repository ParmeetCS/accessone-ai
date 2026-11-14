import { supabase } from './client';
import { Database } from '../../types/database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];

export const profilesService = {
  /**
   * Fetch user profile by user UUID.
   */
  async getProfile(userId: string): Promise<{ data: Profile | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Ensure a profile exists for an authenticated user.
   * If the PostgreSQL registration trigger already created it, returns it.
   * Otherwise, provisions a default profile record.
   */
  async ensureProfile(
    userId: string,
    email: string | null,
    displayName: string
  ): Promise<{ data: Profile | null; error: Error | null }> {
    try {
      // 1. Check existing
      const { data: existing, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      if (existing) return { data: existing, error: null };

      // 2. Insert new profile if missing
      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          display_name: displayName || 'User',
          email: email,
          preferred_mode: 'dual',
          font_size: 'std',
          high_contrast: false,
          language: 'en-US',
          tts_voice: 'en-US-Neural2-F',
          speech_rate: 1.0,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      return { data: inserted, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Update user profile fields (font size, high contrast, sensory mode, TTS voice, etc.).
   */
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<{ data: Profile | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Fetch granular sensory/accessibility preferences.
   */
  async getPreferences(userId: string): Promise<{ data: UserPreferences | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Update granular sensory/accessibility preferences.
   */
  async updatePreferences(
    userId: string,
    updates: UserPreferencesUpdate
  ): Promise<{ data: UserPreferences | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },
};
