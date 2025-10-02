import { supabase } from '../supabaseClient';

/**
 * Authentication utilities for ORCAFLOW
 * Handles user authentication with Supabase Auth
 */

export class AuthService {
  /**
   * Sign in with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<{user: any, session: any, error: any}>}
   */
  static async signInWithPassword(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { user: null, session: null, error };
      }

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return { user: null, session: null, error };
    }
  }

  /**
   * Sign up with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {Object} metadata - Additional user metadata
   * @returns {Promise<{user: any, session: any, error: any}>}
   */
  static async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        return { user: null, session: null, error };
      }

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('Unexpected error during sign up:', error);
      return { user: null, session: null, error };
    }
  }

  /**
   * Sign in with Google OAuth
   * @returns {Promise<{user: any, session: any, error: any}>}
   */
  static async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Google sign in error:', error);
        return { user: null, session: null, error };
      }

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('Unexpected error during Google sign in:', error);
      return { user: null, session: null, error };
    }
  }

  /**
   * Sign out the current user
   * @returns {Promise<{error: any}>}
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      return { error };
    }
  }

  /**
   * Get the current user session
   * @returns {Promise<{session: any, error: any}>}
   */
  static async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Get session error:', error);
        return { session: null, error };
      }

      return { session: data.session, error: null };
    } catch (error) {
      console.error('Unexpected error getting session:', error);
      return { session: null, error };
    }
  }

  /**
   * Get the current user
   * @returns {Promise<{user: any, error: any}>}
   */
  static async getUser() {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Get user error:', error);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Unexpected error getting user:', error);
      return { user: null, error };
    }
  }

  /**
   * Listen to authentication state changes
   * @param {Function} callback - Callback function to handle auth state changes
   * @returns {Object} - Unsubscribe function
   */
  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Reset password for a user
   * @param {string} email - User's email
   * @returns {Promise<{error: any}>}
   */
  static async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('Reset password error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected error resetting password:', error);
      return { error };
    }
  }

  /**
   * Update user password
   * @param {string} password - New password
   * @returns {Promise<{user: any, error: any}>}
   */
  static async updatePassword(password) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error('Update password error:', error);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Unexpected error updating password:', error);
      return { user: null, error };
    }
  }
}

// Export the supabase client for direct access if needed
export { supabase };