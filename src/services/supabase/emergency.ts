import { supabase } from './client';
import { Database } from '../../types/database';

export type EmergencyContact = Database['public']['Tables']['emergency_contacts']['Row'];
export type EmergencyContactInsert = Database['public']['Tables']['emergency_contacts']['Insert'];
export type EmergencyContactUpdate = Database['public']['Tables']['emergency_contacts']['Update'];
export type SosEvent = Database['public']['Tables']['sos_events']['Row'];
export type SosEventInsert = Database['public']['Tables']['sos_events']['Insert'];

export const emergencyService = {
  /**
   * Fetch all emergency contacts for a user ordered by primary status and creation date.
   */
  async getContacts(userId: string): Promise<{ data: EmergencyContact[]; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err };
    }
  },

  /**
   * Add a new emergency contact.
   */
  async addContact(contact: EmergencyContactInsert): Promise<{ data: EmergencyContact | null; error: Error | null }> {
    try {
      // If setting this one as primary, unset other primaries first
      if (contact.is_primary) {
        await supabase
          .from('emergency_contacts')
          .update({ is_primary: false })
          .eq('user_id', contact.user_id);
      }

      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert(contact)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Update an emergency contact.
   */
  async updateContact(
    contactId: string,
    userId: string,
    updates: EmergencyContactUpdate
  ): Promise<{ data: EmergencyContact | null; error: Error | null }> {
    try {
      if (updates.is_primary) {
        await supabase
          .from('emergency_contacts')
          .update({ is_primary: false })
          .eq('user_id', userId);
      }

      const { data, error } = await supabase
        .from('emergency_contacts')
        .update(updates)
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Delete an emergency contact.
   */
  async deleteContact(contactId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err };
    }
  },

  /**
   * Record a new emergency SOS event.
   */
  async triggerSos(event: SosEventInsert): Promise<{ data: SosEvent | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('sos_events')
        .insert(event)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  /**
   * Fetch recent SOS history.
   */
  async getSosEvents(userId: string, limit = 10): Promise<{ data: SosEvent[]; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('sos_events')
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
