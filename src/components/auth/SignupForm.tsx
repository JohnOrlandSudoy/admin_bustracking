import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Mail, CheckCircle } from 'lucide-react';

interface SignupFormProps {
  onSuccess?: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSuccess }) => {
  const { signup, resendConfirmation, error, isLoading, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client' as 'client' | 'admin' | 'employee',
    fullName: '',
    phone: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear errors when user types
    if (error) clearError();
    if (passwordError) setPasswordError(null);
  };

  const validateForm = () => {
    // Check required fields
    if (!formData.username.trim()) {
      setPasswordError('Username is required');
      return false;
    }

    if (!formData.email.trim()) {
      setPasswordError('Email is required');
      return false;
    }

    if (!formData.fullName.trim()) {
      setPasswordError('Full name is required');
      return false;
    }

    if (!formData.phone.trim()) {
      setPasswordError('Phone number is required');
      return false;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }

    // Check password strength (at least 8 characters)
    if (formData.password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }

    // Validate phone number format (basic validation for Philippine numbers)
    const phoneRegex = /^(09|\+639)\d{9}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s+/g, ''))) {
      setPasswordError('Please enter a valid Philippine phone number (e.g., 09171234567)');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log('🚀 Starting signup process from form');

    const { username, email, password, role } = formData;

    console.log('📝 Form data validated, calling signup service');

    const result = await signup({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      profile: {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim()
      }
    });

    console.log('📨 Signup result:', result);

    if (result.success) {
      if (result.needsConfirmation) {
        console.log('✅ Signup successful, showing confirmation screen');
        setShowConfirmation(true);
      } else if (onSuccess) {
        console.log('✅ Signup successful, calling onSuccess callback');
        onSuccess();
      }
    } else {
      console.log('❌ Signup failed, error should be displayed via context');
    }
  };

  const handleResendConfirmation = async () => {
    setIsResending(true);
    await resendConfirmation(formData.email);
    setIsResending(false);
  };

  // Show confirmation message if email confirmation is needed
  if (showConfirmation) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-auto">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
          <p className="text-gray-600 mb-4">
            We've sent a confirmation link to <strong>{formData.email}</strong>.
            Please check your email and click the link to activate your account.
          </p>

          {/* Troubleshooting tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">📧 Email not received?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Check your spam/junk folder</li>
              <li>• Look for emails from <code className="bg-blue-100 px-1 rounded">noreply@mail.supabase.io</code></li>
              <li>• Wait a few minutes - emails can take time to arrive</li>
              <li>• Make sure you entered the correct email address</li>
            </ul>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleResendConfirmation}
              disabled={isResending}
              className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 px-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isResending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Resending...
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5 mr-2" />
                  Resend Confirmation Email
                </>
              )}
            </button>

            <button
              onClick={() => setShowConfirmation(false)}
              className="w-full text-pink-600 hover:text-pink-700 transition-colors"
            >
              Back to Sign Up
            </button>
          </div>

          {/* Success message after resending */}
          {isResending === false && (
            <div className="mt-4 text-sm text-green-600">
              If you still don't receive the email, please contact support.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create Account</h2>

      {(error || passwordError) && (
        <div className="mb-4 bg-pink-50 border border-pink-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-pink-600 mr-2" />
          <span className="text-pink-800">{passwordError || error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={formData.username}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Choose a username"
          />
        </div>
        
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

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            value={formData.fullName}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Enter your phone number (e.g., 09171234567)"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Create a password (min. 8 characters)"
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Confirm your password"
          />
        </div>
        
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Account Type
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="client">Client</option>
            <option value="employee">Employee</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 px-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              Creating Account...
            </>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>
    </div>
  );
};