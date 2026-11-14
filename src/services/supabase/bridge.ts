import { supabase } from './client';
import { Database } from '../../types/database';
import { RealtimeChannel } from '@supabase/supabase-js';

export type BridgeSession = Database['public']['Tables']['bridge_sessions']['Row'];
export type BridgeMessage = Database['public']['Tables']['bridge_messages']['Row'];
export type BridgeMessageInsert = Database['public']['Tables']['bridge_messages']['Insert'];

export const bridgeService = {
  /**
   * Get currently active bridge session for user if one exists.
   */
  async getActiveSession(userId: string): Promise<{ data: BridgeSession | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bridge_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('session_status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Start a new bridge communication session.
   */
  async startSession(userId: string): Promise<{ data: BridgeSession | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bridge_sessions')
        .insert({
          user_id: userId,
          session_status: 'active',
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
   * End an active bridge session.
   */
  async endSession(sessionId: string): Promise<{ data: BridgeSession | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bridge_sessions')
        .update({
          session_status: 'completed',
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
   * Fetch all messages for a bridge session in chronological order.
   */
  async getMessages(sessionId: string): Promise<{ data: BridgeMessage[]; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bridge_messages')
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
   * Send a bridge message (speech-to-text, typed, or translation).
   */
  async sendMessage(message: BridgeMessageInsert): Promise<{ data: BridgeMessage | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bridge_messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Realtime subscription for incoming bridge messages in a session.
   */
  subscribeToMessages(
    sessionId: string,
    onMessage: (message: BridgeMessage) => void
  ): { unsubscribe: () => void } {
    const channel: RealtimeChannel = supabase
      .channel(`bridge_messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bridge_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new) {
            onMessage(payload.new as BridgeMessage);
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
