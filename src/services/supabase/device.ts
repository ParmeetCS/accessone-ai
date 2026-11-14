import { supabase } from './client';
import { Database } from '../../types/database';

export type DeviceStatus = Database['public']['Tables']['device_status']['Row'];
export type DeviceStatusInsert = Database['public']['Tables']['device_status']['Insert'];
export type DeviceStatusUpdate = Database['public']['Tables']['device_status']['Update'];

export const deviceService = {
  /**
   * Fetch current hardware/telemetry status for user.
   */
  async getDeviceStatus(userId: string): Promise<{ data: DeviceStatus | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('device_status')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Update or insert hardware telemetry (battery, connection status).
   */
  async upsertDeviceStatus(status: DeviceStatusInsert): Promise<{ data: DeviceStatus | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('device_status')
        .upsert(status, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },
};
