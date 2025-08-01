import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pink-600">Bus Tracker Admin</h1>
          <p className="text-gray-600 mt-2">Manage your bus tracking system with ease</p>
        </div>

        {isLoginView ? (
          <LoginForm onSuccess={() => {}} />
        ) : (
          <SignupForm onSuccess={() => setIsLoginView(true)} />
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