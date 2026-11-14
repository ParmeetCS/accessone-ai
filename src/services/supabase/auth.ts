import { supabase } from './client';
import { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export const authService = {
  /**
   * Register a new user with Email and Password.
   * Supabase automatically creates an auth user and triggers `handle_new_user_registration`
   * on the `profiles` and `user_preferences` tables.
   */
  signUp: async (email: string, password: string, displayName: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: displayName.trim(),
            display_name: displayName.trim(),
          },
        },
      });
      return { user: data.user, session: data.session, error };
    } catch (e: any) {
      return { user: null, session: null, error: e };
    }
  },

  /**
   * Sign in an existing user with Email and Password.
   */
  signIn: async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      return { user: data.user, session: data.session, error };
    } catch (e: any) {
      return { user: null, session: null, error: e };
    }
  },

  /**
   * Sign out current user and clear local SecureStore session.
   */
  signOut: async (): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (e: any) {
      return { error: e };
    }
  },

  /**
   * Send password reset email to user's registered address.
   */
  resetPasswordForEmail: async (email: string): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      return { error };
    } catch (e: any) {
      return { error: e };
    }
  },

  /**
   * Update password for the currently logged-in user.
   */
  updatePassword: async (newPassword: string): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error };
    } catch (e: any) {
      return { error: e };
    }
  },

  /**
   * Retrieve active session from Expo SecureStore.
   */
  getSession: async (): Promise<{ session: Session | null; error: AuthError | null }> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      return { session: data.session, error };
    } catch (e: any) {
      return { session: null, error: e };
    }
  },

  /**
   * Retrieve currently authenticated user.
   */
  getUser: async (): Promise<{ user: User | null; error: AuthError | null }> => {
    try {
      const { data, error } = await supabase.auth.getUser();
      return { user: data.user, error };
    } catch (e: any) {
      return { user: null, error: e };
    }
  },

  /**
   * Listen to authentication state transitions (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED).
   */
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};
