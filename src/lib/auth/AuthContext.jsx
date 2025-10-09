'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from './index';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { session, error } = await AuthService.getSession();
        if (error) {
          console.error('Error getting initial session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Unexpected error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { user, session, error } = await AuthService.signInWithPassword(email, password);
      if (error) {
        throw error;
      }
      return { user, session, error: null };
    } catch (error) {
      return { user: null, session: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    setLoading(true);
    try {
      const { user, session, error } = await AuthService.signUp(email, password, metadata);
      if (error) {
        throw error;
      }
      return { user, session, error: null };
    } catch (error) {
      return { user: null, session: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { user, session, error } = await AuthService.signInWithGoogle();
      if (error) {
        throw error;
      }
      return { user, session, error: null };
    } catch (error) {
      return { user: null, session: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await AuthService.signOut();
      if (error) {
        throw error;
      }
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await AuthService.resetPassword(email);
      if (error) {
        throw error;
      }
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const updatePassword = async (password) => {
    try {
      const { user, error } = await AuthService.updatePassword(password);
      if (error) {
        throw error;
      }
      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  };

  const value = {
    // State
    user,
    session,
    loading,

    // Actions
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,

    // Computed values
    isAuthenticated: !!user,
  };

  // Debug logging to validate context export
  console.log('AuthContext Debug - Exported value:', {
    user: !!user,
    session: !!session,
    loading,
    signOut: typeof signOut,
    hasAllFunctions: !!(signIn && signUp && signInWithGoogle && signOut && resetPassword && updatePassword)
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};