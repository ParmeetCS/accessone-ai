import { supabase } from './client';
import { Database } from '../../types/database';

export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
export type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert'];

export const activityService = {
  /**
   * Record a new user or clinical activity event.
   */
  async logActivity(activity: ActivityLogInsert): Promise<{ data: ActivityLog | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert(activity)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Fetch recent activity events for the user.
   */
  async getRecentActivities(userId: string, limit = 20): Promise<{ data: ActivityLog[]; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err };
    }
  },
};
