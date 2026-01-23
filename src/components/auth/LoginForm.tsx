import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle } from 'lucide-react';
import { otpAPI } from '../../utils/api';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, error, isLoading, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isResetMode, setIsResetMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) clearError();
    if (localError) setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isResetMode) {
      const success = await login(formData);
      if (success && onSuccess) {
        onSuccess();
      }
      return;
    }
    if (!otpSent) {
      if (!formData.email) {
        setLocalError('Enter your email');
        return;
      }
      try {
        setSubmitting(true);
        await otpAPI.sendOtp(formData.email);
        setOtpSent(true);
        setLocalError(null);
      } catch (err: any) {
        setLocalError(err?.message || 'Failed to send code');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (!otpVerified) {
      if (!code || code.length !== 6) {
        setLocalError('Enter the 6-digit code');
        return;
      }
      try {
        setSubmitting(true);
        await otpAPI.verifyOtp(formData.email, code);
        setOtpVerified(true);
        setLocalError(null);
      } catch (err: any) {
        setLocalError(err?.message || 'Invalid or expired code');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    try {
      setSubmitting(true);
      await otpAPI.updatePasswordWithOtp(formData.email, code, newPassword);
      setIsResetMode(false);
      setOtpSent(false);
      setOtpVerified(false);
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setLocalError(null);
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{isResetMode ? 'Reset Password' : 'Login'}</h2>
      
      {(error || localError) && (
        <div className="mb-4 bg-pink-50 border border-pink-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-pink-600 mr-2" />
          <span className="text-pink-800">{localError || error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>
        
        {!isResetMode && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>
        )}

        {isResetMode && !otpSent && (
          <p className="text-sm text-gray-600">Click the button to send a 6-digit code to your email.</p>
        )}

        {isResetMode && otpSent && !otpVerified && (
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Enter 6-digit code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="123456"
            />
          </div>
        )}

        {isResetMode && otpVerified && (
          <>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Enter new password"
                minLength={6}
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Re-enter new password"
                minLength={6}
                required
              />
            </div>
          </>
        )}
        
        <button
          type="submit"
          disabled={isResetMode ? submitting : isLoading}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 px-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              {isResetMode ? (otpVerified ? 'Updating...' : otpSent ? 'Verifying...' : 'Sending...') : 'Logging in...'}
            </>
          ) : (
            isResetMode ? (submitting ? (otpVerified ? 'Updating...' : otpSent ? 'Verifying...' : 'Sending...') : (otpVerified ? 'Update Password' : otpSent ? 'Verify Code' : 'Send OTP')) : 'Login'
          )}
        </button>

        <div className="text-center">
          {!isResetMode ? (
            <button
              type="button"
              onClick={() => { setIsResetMode(true); setOtpSent(false); setOtpVerified(false); setCode(''); setNewPassword(''); setConfirmPassword(''); setLocalError(null); }}
              className="text-pink-600 font-medium hover:text-pink-700 transition-colors mt-3"
            >
              Forgot password?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setIsResetMode(false); setOtpSent(false); setOtpVerified(false); setCode(''); setNewPassword(''); setConfirmPassword(''); setLocalError(null); }}
              className="text-gray-600 hover:text-gray-700 transition-colors mt-3"
            >
              Back to login
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
