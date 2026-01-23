import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  } 

  const handleSignupSuccess = (email: string) => {
    setUserEmail(email);
    setShowSignupSuccess(true);
  };

  const handleBackToLogin = () => {
    setShowSignupSuccess(false);
    setIsLoginView(true);
  };

  // Show signup success message
  if (showSignupSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Check Your Email!</h1>
              <p className="text-gray-600 text-lg">
                We've sent a confirmation link to
              </p>
              <p className="text-pink-600 font-semibold text-lg break-all">
                {userEmail}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">📧 Next Steps:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Check your email inbox (and spam folder)</li>
                <li>• Click the confirmation link in the email</li>
                <li>• Return here to log in with your new account</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleBackToLogin}
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 px-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Back to Login
              </button>
              
              <button
                onClick={() => setShowSignupSuccess(false)}
                className="w-full text-pink-600 hover:text-pink-700 transition-colors py-2"
              >
                Create Another Account
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setShowSignupSuccess(false)}
                  className="text-pink-600 hover:text-pink-700 font-medium"
                >
                  try signing up again
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pink-600">Auro Ride Admin</h1>
          <p className="text-gray-600 mt-2">Manage your bus tracking system with ease</p>
        </div>

        {isLoginView ? (
          <LoginForm onSuccess={() => {}} />
        ) : (
          <SignupForm onSuccess={handleSignupSuccess} />
        )}

        <div className="mt-6 text-center">
          {isLoginView ? (
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => setIsLoginView(false)}
                className="text-pink-600 font-medium hover:text-pink-700 transition-colors"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => setIsLoginView(true)}
                className="text-pink-600 font-medium hover:text-pink-700 transition-colors"
              >
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};