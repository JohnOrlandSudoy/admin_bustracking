import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

export const EmailConfirmation: React.FC = () => {
  const { confirmEmail, error, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleConfirmation = async () => {
      console.log('🔐 EmailConfirmation component: Starting confirmation process');

      const token = searchParams.get('token');
      const type = searchParams.get('type') || 'signup';

      console.log('📧 URL parameters:', {
        token: token ? `${token.substring(0, 10)}...` : 'No token',
        type
      });

      if (!token) {
        console.error('❌ No token found in URL parameters');
        setStatus('error');
        setMessage('Invalid confirmation link. The link appears to be incomplete. Please check your email and try clicking the link again.');
        return;
      }

      console.log('✅ Token found, attempting confirmation');
      setMessage('Verifying your email confirmation...');

      try {
        const success = await confirmEmail(token, type);

        console.log('📨 Confirmation result:', { success });

        if (success) {
          console.log('✅ Email confirmation successful');
          setStatus('success');
          setMessage('🎉 Your email has been confirmed successfully! You are now signed in. Redirecting to dashboard...');

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            console.log('🚀 Redirecting to dashboard');
            navigate('/dashboard');
          }, 3000);
        } else {
          console.error('❌ Email confirmation failed');
          setStatus('error');
          const errorMsg = error || 'Email confirmation failed. The link may have expired or already been used.';
          setMessage(errorMsg);
        }
      } catch (err: any) {
        console.error('❌ Confirmation error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred during confirmation. Please try again or contact support if the problem persists.');
      }
    };

    handleConfirmation();
  }, [searchParams, confirmEmail, error, navigate]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader className="h-16 w-16 text-pink-500 mx-auto mb-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />;
      case 'error':
        return <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Confirming Your Email...';
      case 'success':
        return 'Email Confirmed!';
      case 'error':
        return 'Confirmation Failed';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-auto text-center">
        {getIcon()}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{getTitle()}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        
        {status === 'error' && (
          <div className="space-y-4">
            {/* Troubleshooting tips */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-red-900 mb-2">🔧 Troubleshooting Tips:</h3>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Check if the confirmation link has expired</li>
                <li>• Make sure you clicked the complete link from your email</li>
                <li>• Try requesting a new confirmation email</li>
                <li>• Clear your browser cache and try again</li>
              </ul>
            </div>

            <div className="flex flex-col space-y-2">
              <button
                onClick={() => navigate('/auth')}
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 px-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Back to Sign In
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full text-pink-600 hover:text-pink-700 transition-colors py-2"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {status === 'loading' && isLoading && (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-500 border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
};
