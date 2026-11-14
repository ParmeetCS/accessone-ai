import { supabase } from './client';
import { Database } from '../../types/database';
import { RealtimeChannel } from '@supabase/supabase-js';

export type HearingSession = Database['public']['Tables']['hearing_sessions']['Row'];
export type HearingTranscript = Database['public']['Tables']['hearing_transcripts']['Row'];
export type HearingTranscriptInsert = Database['public']['Tables']['hearing_transcripts']['Insert'];

export const hearingService = {
  /**
   * Start a live hearing caption session.
   */
  async startSession(userId: string, language = 'en-US'): Promise<{ data: HearingSession | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('hearing_sessions')
        .insert({
          user_id: userId,
          language,
          status: 'listening',
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * End a hearing session.
   */
  async endSession(sessionId: string): Promise<{ data: HearingSession | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('hearing_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Add a real-time transcript slice.
   */
  async logTranscript(
    transcript: HearingTranscriptInsert
  ): Promise<{ data: HearingTranscript | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('hearing_transcripts')
        .insert(transcript)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Fetch all transcripts for a given session.
   */
  async getTranscripts(sessionId: string): Promise<{ data: HearingTranscript[]; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('hearing_transcripts')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err };
    }
  },

  /**
   * Realtime subscription for live caption updates.
   */
  subscribeToTranscripts(
    sessionId: string,
    onTranscript: (transcript: HearingTranscript) => void
  ): { unsubscribe: () => void } {
    const channel: RealtimeChannel = supabase
      .channel(`hearing_transcripts:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hearing_transcripts',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new) {
            onTranscript(payload.new as HearingTranscript);
          }
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },
};
