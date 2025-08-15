import React, { useState } from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export const InlineLoginOverlay: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      console.log('Starting Google OAuth sign-in...');
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Sign in failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur effect */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />
      
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-lg mx-4 animate-slide-up">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft-lg border border-gray-100 p-6 sm:p-8">
          {/* Logo and Branding */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-soft">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Welcome to Invoicce.to
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Create professional invoices for free in seconds. Simple, fast invoice generator for freelancers, creators, and founders.
            </p>
          </div>

          {/* Features Preview */}
          <div className="space-y-3 mb-6 sm:mb-8">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              Professional invoice templates
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              Client management system
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              PDF generation & sharing
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              Multi-currency support
            </div>
          </div>

          {/* Sign In Button */}
          <Button
            onClick={handleGoogleSignIn}
            loading={isLoading}
            disabled={isLoading}
            variant="primary"
            className="w-full"
            size="md"
          >
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium text-sm sm:text-base">Continue with Google</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Button>

          {/* Terms */}
          <p className="text-center text-xs text-gray-500 mt-6 leading-relaxed">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};