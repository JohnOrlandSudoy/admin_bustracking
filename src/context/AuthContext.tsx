import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types';
import { getCurrentUser, login, logout, signup, confirmEmail, resendConfirmation, AuthCredentials, SignupData } from '../services/authService';
import { useAppContext } from './AppContext';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  needsConfirmation: boolean;
  pendingEmail: string | null;
  login: (credentials: AuthCredentials) => Promise<boolean>;
  signup: (data: SignupData) => Promise<{ success: boolean; needsConfirmation?: boolean }>;
  confirmEmail: (token: string, type: string) => Promise<boolean>;
  resendConfirmation: (email?: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state, dispatch } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      dispatch({ type: 'SET_LOADING', resource: 'auth', payload: true });
      
      try {
        const { user, error } = await getCurrentUser();
        
        if (error) {
          setError(error);
          dispatch({ type: 'SET_ERROR', resource: 'auth', payload: error });
        } else {
          dispatch({ type: 'SET_USER', payload: user });
          dispatch({ type: 'SET_AUTHENTICATED', payload: !!user });
        }
      } catch (err: any) {
        setError(err.message);
        dispatch({ type: 'SET_ERROR', resource: 'auth', payload: err.message });
      } finally {
        setIsLoading(false);
        dispatch({ type: 'SET_LOADING', resource: 'auth', payload: false });
      }
    };

    initAuth();
  }, [dispatch]);

  const handleLogin = async (credentials: AuthCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    dispatch({ type: 'SET_LOADING', resource: 'auth', payload: true });
    dispatch({ type: 'SET_ERROR', resource: 'auth', payload: null });
    
    try {
      const { user, error } = await login(credentials);
      
      if (error) {
        setError(error);
        dispatch({ type: 'SET_ERROR', resource: 'auth', payload: error });
        return false;
      }
      
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_AUTHENTICATED', payload: !!user });
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      dispatch({ type: 'SET_ERROR', resource: 'auth', payload: errorMsg });
      return false;
    } finally {
      setIsLoading(false);
      dispatch({ type: 'SET_LOADING', resource: 'auth', payload: false });
    }
  };

  const handleSignup = async (data: SignupData): Promise<{ success: boolean; needsConfirmation?: boolean }> => {
    setIsLoading(true);
    setError(null);
    setNeedsConfirmation(false);
    setPendingEmail(null);
    dispatch({ type: 'SET_LOADING', resource: 'auth', payload: true });
    dispatch({ type: 'SET_ERROR', resource: 'auth', payload: null });

    try {
      const { user, error, needsConfirmation: requiresConfirmation } = await signup(data);

      if (error) {
        setError(error);
        dispatch({ type: 'SET_ERROR', resource: 'auth', payload: error });
        return { success: false };
      }

      if (requiresConfirmation) {
        setNeedsConfirmation(true);
        setPendingEmail(data.email);
        return { success: true, needsConfirmation: true };
      }

      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_AUTHENTICATED', payload: !!user });
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Signup failed';
      setError(errorMsg);
      dispatch({ type: 'SET_ERROR', resource: 'auth', payload: errorMsg });
      return { success: false };
    } finally {
      setIsLoading(false);
      dispatch({ type: 'SET_LOADING', resource: 'auth', payload: false });
    }
  };

  const handleLogout = async (): Promise<boolean> => {
    setIsLoading(true);
    dispatch({ type: 'SET_LOADING', resource: 'auth', payload: true });
    
    try {
      const { error } = await logout();
      
      if (error) {
        setError(error);
        dispatch({ type: 'SET_ERROR', resource: 'auth', payload: error });
        return false;
      }
      
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_AUTHENTICATED', payload: false });
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Logout failed';
      setError(errorMsg);
      dispatch({ type: 'SET_ERROR', resource: 'auth', payload: errorMsg });
      return false;
    } finally {
      setIsLoading(false);
      dispatch({ type: 'SET_LOADING', resource: 'auth', payload: false });
    }
  };

  const handleConfirmEmail = async (token: string, type: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    dispatch({ type: 'SET_LOADING', resource: 'auth', payload: true });
    dispatch({ type: 'SET_ERROR', resource: 'auth', payload: null });

    try {
      const { success, error, user } = await confirmEmail(token, type);

      if (error || !success) {
        setError(error || 'Email confirmation failed');
        dispatch({ type: 'SET_ERROR', resource: 'auth', payload: error || 'Email confirmation failed' });
        return false;
      }

      if (user) {
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        setNeedsConfirmation(false);
        setPendingEmail(null);
        return true;
      }

      return false;
    } catch (err: any) {
      const errorMsg = err.message || 'Email confirmation failed';
      setError(errorMsg);
      dispatch({ type: 'SET_ERROR', resource: 'auth', payload: errorMsg });
      return false;
    } finally {
      setIsLoading(false);
      dispatch({ type: 'SET_LOADING', resource: 'auth', payload: false });
    }
  };

  const handleResendConfirmation = async (email?: string): Promise<boolean> => {
    const emailToUse = email || pendingEmail;
    if (!emailToUse) {
      setError('No email address available for resending confirmation');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { success, error } = await resendConfirmation(emailToUse);

      if (error || !success) {
        setError(error || 'Failed to resend confirmation email');
        return false;
      }

      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to resend confirmation email';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
    dispatch({ type: 'SET_ERROR', resource: 'auth', payload: null });
  };

  const value = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading,
    error,
    needsConfirmation,
    pendingEmail,
    login: handleLogin,
    signup: handleSignup,
    confirmEmail: handleConfirmEmail,
    resendConfirmation: handleResendConfirmation,
    logout: handleLogout,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};