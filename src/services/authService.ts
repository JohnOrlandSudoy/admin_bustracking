import { User } from '../types';
import { supabase } from '../lib/supabase';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignupData extends AuthCredentials {
  username: string;
  role?: 'client' | 'admin' | 'employee';
  profile?: {
    fullName?: string;
    phone?: string;
  };
}

export interface AuthResponse {
  user: User | null;
  error: string | null;
  needsConfirmation?: boolean;
}

export interface ConfirmationResponse {
  success: boolean;
  error: string | null;
  user?: User | null;
}

/**
 * Sign up a new user with email confirmation
 */
export const signup = async (data: SignupData): Promise<AuthResponse> => {
  try {
    console.log('🚀 Starting signup process for:', data.email);
    console.log('📧 Redirect URL will be:', `${window.location.origin}/auth/confirm`);

    // Validate input data
    if (!data.email || !data.password || !data.username) {
      const error = 'Missing required fields: email, password, and username are required';
      console.error('❌ Validation error:', error);
      return { user: null, error };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      const error = 'Please enter a valid email address';
      console.error('❌ Email validation error:', error);
      return { user: null, error };
    }

    // Validate password strength
    if (data.password.length < 8) {
      const error = 'Password must be at least 8 characters long';
      console.error('❌ Password validation error:', error);
      return { user: null, error };
    }

    console.log('✅ Input validation passed');

    // Use Supabase directly for signup with email confirmation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        data: {
          username: data.username.trim(),
          role: data.role || 'client',
          ...(data.profile && {
            fullName: data.profile.fullName,
            phone: data.profile.phone
          })
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm`
      }
    });

    console.log('📨 Supabase signup response:', {
      user: authData?.user ? {
        id: authData.user.id,
        email: authData.user.email,
        emailConfirmedAt: authData.user.email_confirmed_at,
        confirmationSentAt: authData.user.confirmation_sent_at,
        userMetadata: authData.user.user_metadata
      } : null,
      session: authData?.session ? 'Session exists' : 'No session',
      error: authError
    });

    if (authError) {
      console.error('❌ Supabase signup error:', authError);

      // Handle specific error cases
      if (authError.message.includes('User already registered')) {
        return { user: null, error: 'An account with this email already exists. Please try logging in instead.' };
      }

      if (authError.message.includes('Invalid email')) {
        return { user: null, error: 'Please enter a valid email address.' };
      }

      if (authError.message.includes('Password')) {
        return { user: null, error: 'Password does not meet requirements. Please use at least 8 characters.' };
      }

      return { user: null, error: authError.message };
    }

    // Check if user was created
    if (!authData?.user) {
      console.error('❌ No user data returned from signup');
      return { user: null, error: 'Signup failed - no user created. Please try again.' };
    }

    console.log('✅ User created successfully:', {
      id: authData.user.id,
      email: authData.user.email,
      emailConfirmedAt: authData.user.email_confirmed_at,
      confirmationSentAt: authData.user.confirmation_sent_at,
      hasSession: !!authData.session
    });

    // If user is created but not confirmed (this is expected with email confirmation)
    if (authData.user && !authData.session) {
      console.log('📧 User created successfully, email confirmation required');

      // Check if confirmation email was sent
      if (authData.user.confirmation_sent_at) {
        console.log('✅ Confirmation email sent at:', authData.user.confirmation_sent_at);
      } else {
        console.warn('⚠️ User created but no confirmation_sent_at timestamp');
      }

      return {
        user: null,
        error: null,
        needsConfirmation: true
      };
    }

    // If user is immediately confirmed (shouldn't happen with email confirmation enabled)
    if (authData.user && authData.session) {
      console.log('🎉 User immediately confirmed and signed in');
      localStorage.setItem('auth_token', authData.session.access_token);

      const userData: User = {
        id: authData.user.id,
        username: authData.user.user_metadata?.username || data.username,
        email: authData.user.email || data.email,
        role: authData.user.user_metadata?.role || data.role || 'client',
        profile: authData.user.user_metadata || {}
      };

      return { user: userData, error: null };
    }

    console.error('❌ Unexpected signup response state');
    return { user: null, error: 'Unexpected signup response. Please try again.' };
  } catch (error: any) {
    console.error('❌ Signup error:', error);

    // Handle network errors
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return { user: null, error: 'Network error. Please check your internet connection and try again.' };
    }

    const errorMessage = error.message || 'Signup failed. Please try again.';
    return { user: null, error: errorMessage };
  }
};

/**
 * Confirm email with token from URL
 */
export const confirmEmail = async (token: string, type: string): Promise<ConfirmationResponse> => {
  try {
    console.log('🔐 Starting email confirmation process');
    console.log('📧 Token hash:', token ? `${token.substring(0, 10)}...` : 'No token');
    console.log('📝 Type:', type);

    if (!token || !type) {
      const error = 'Missing confirmation token or type';
      console.error('❌ Validation error:', error);
      return { success: false, error };
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as any
    });

    console.log('📨 Supabase confirmation response:', {
      user: data?.user ? {
        id: data.user.id,
        email: data.user.email,
        emailConfirmedAt: data.user.email_confirmed_at,
        userMetadata: data.user.user_metadata
      } : null,
      session: data?.session ? 'Session created' : 'No session',
      error: error
    });

    if (error) {
      console.error('❌ Email confirmation error:', error);

      // Handle specific error cases
      if (error.message.includes('expired')) {
        return { success: false, error: 'Confirmation link has expired. Please request a new one.' };
      }

      if (error.message.includes('invalid')) {
        return { success: false, error: 'Invalid confirmation link. Please check your email for the correct link.' };
      }

      return { success: false, error: error.message };
    }

    if (data?.user && data?.session) {
      console.log('✅ Email confirmed successfully, user signed in');
      // Store the session token
      localStorage.setItem('auth_token', data.session.access_token);

      // Convert to our User format
      const userData: User = {
        id: data.user.id,
        username: data.user.user_metadata?.username || 'User',
        email: data.user.email || '',
        role: data.user.user_metadata?.role || 'client',
        profile: data.user.user_metadata || {}
      };

      console.log('👤 User data created:', {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role
      });

      return { success: true, error: null, user: userData };
    }

    console.error('❌ Email confirmation failed - no user or session data');
    return { success: false, error: 'Email confirmation failed. Please try again or request a new confirmation email.' };
  } catch (error: any) {
    console.error('❌ Email confirmation error:', error);

    // Handle network errors
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return { success: false, error: 'Network error. Please check your internet connection and try again.' };
    }

    return { success: false, error: error.message || 'Email confirmation failed. Please try again.' };
  }
};

/**
 * Resend confirmation email
 */
export const resendConfirmation = async (email: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    console.log('📧 Resending confirmation email to:', email);

    if (!email) {
      const error = 'Email address is required to resend confirmation';
      console.error('❌ Validation error:', error);
      return { success: false, error };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = 'Please enter a valid email address';
      console.error('❌ Email validation error:', error);
      return { success: false, error };
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`
      }
    });

    console.log('📨 Resend confirmation response:', { error });

    if (error) {
      console.error('❌ Resend confirmation error:', error);

      // Handle specific error cases
      if (error.message.includes('rate limit')) {
        return { success: false, error: 'Please wait a moment before requesting another confirmation email.' };
      }

      if (error.message.includes('not found')) {
        return { success: false, error: 'No account found with this email address.' };
      }

      return { success: false, error: error.message };
    }

    console.log('✅ Confirmation email resent successfully');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('❌ Resend confirmation error:', error);

    // Handle network errors
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return { success: false, error: 'Network error. Please check your internet connection and try again.' };
    }

    return { success: false, error: error.message || 'Failed to resend confirmation email. Please try again.' };
  }
};

/**
 * Log in a user
 */
export const login = async (credentials: AuthCredentials): Promise<AuthResponse> => {
  try {
    // Use Supabase directly for login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (error) {
      console.error('Supabase login error:', error);
      return { user: null, error: error.message };
    }

    if (data.user && data.session) {
      localStorage.setItem('auth_token', data.session.access_token);

      const userData: User = {
        id: data.user.id,
        username: data.user.user_metadata?.username || 'User',
        email: data.user.email || credentials.email,
        role: data.user.user_metadata?.role || 'client',
        profile: data.user.user_metadata || {}
      };

      return { user: userData, error: null };
    }

    return { user: null, error: 'Login failed: No session received' };
  } catch (error: any) {
    console.error('Login error:', error);
    const errorMessage = error.message || 'Login failed';
    return { user: null, error: errorMessage };
  }
};

/**
 * Log out the current user
 */
export const logout = async (): Promise<{ error: string | null }> => {
  try {
    // Use Supabase to sign out
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase logout error:', error);
    }

    // Always remove token from localStorage regardless of Supabase response
    localStorage.removeItem('auth_token');
    return { error: null };
  } catch (error: any) {
    console.error('Logout error:', error);
    // Still remove token even if logout fails
    localStorage.removeItem('auth_token');
    return { error: error.message };
  }
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    // Get current session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Get session error:', error);
      localStorage.removeItem('auth_token');
      return { user: null, error: error.message };
    }

    if (!session || !session.user) {
      localStorage.removeItem('auth_token');
      return { user: null, error: null }; // No error, just no active session
    }

    // Update token in localStorage if it exists
    if (session.access_token) {
      localStorage.setItem('auth_token', session.access_token);
    }

    // Convert Supabase user format to our app's User format
    const userData: User = {
      id: session.user.id,
      username: session.user.user_metadata?.username || 'User',
      email: session.user.email || '',
      role: session.user.user_metadata?.role || 'client',
      profile: session.user.user_metadata || {}
    };

    return { user: userData, error: null };
  } catch (error: any) {
    console.error('Get current user error:', error);
    localStorage.removeItem('auth_token');
    return { user: null, error: error.message };
  }
};

// Set up Supabase auth state listener for automatic token management
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.access_token) {
    localStorage.setItem('auth_token', session.access_token);
  } else {
    localStorage.removeItem('auth_token');
  }
});