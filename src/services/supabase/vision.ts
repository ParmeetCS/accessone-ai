import { supabase } from './client';
import { Database } from '../../types/database';

export type VisionScan = Database['public']['Tables']['vision_scans']['Row'];
export type VisionScanInsert = Database['public']['Tables']['vision_scans']['Insert'];

export const visionService = {
  /**
   * Log an AI Vision scan (metadata, detected OCR text or scene summary).
   * Note: Raw images are intentionally not stored by default to preserve bandwidth and privacy.
   */
  async logScan(scan: VisionScanInsert): Promise<{ data: VisionScan | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('vision_scans')
        .insert(scan)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Fetch recent vision scans for the user.
   */
  async getScanHistory(userId: string, limit = 20): Promise<{ data: VisionScan[]; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('vision_scans')
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
