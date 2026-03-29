import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

/**
 * EmailVerifyPage
 * 
 * This page lives at the route: /verify
 * 
 * HOW IT WORKS:
 *   1. User clicks verification link in email → goes to http://127.0.0.1:8000/api/verify/:token
 *   2. Backend verifies the token in MongoDB, sets isVerified=true
 *   3. Backend redirects to http://localhost:5173/verify?status=success (or ?status=invalid)
 *   4. THIS component reads the ?status param and shows the right UI
 * 
 * SETUP IN YOUR ROUTER (App.tsx or wherever you handle routes):
 *   import { EmailVerifyPage } from './EmailVerifyPage';
 *   // Add this route:
 *   { path: '/verify', element: <EmailVerifyPage onGoToLogin={() => navigate('/login')} /> }
 */

interface EmailVerifyPageProps {
  onGoToLogin: () => void;
}

type VerifyStatus = 'loading' | 'success' | 'invalid' | 'unknown';

export function EmailVerifyPage({ onGoToLogin }: EmailVerifyPageProps) {
  const [status, setStatus] = useState<VerifyStatus>('loading');

  useEffect(() => {
    // Read ?status=success or ?status=invalid from the URL query params
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');

    if (statusParam === 'success') {
      setStatus('success');
    } else if (statusParam === 'invalid') {
      setStatus('invalid');
    } else {
      // No status param — user navigated here directly without a proper redirect
      setStatus('unknown');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 text-center">

          {/* Loading state — shown for a brief moment while useEffect runs */}
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <Loader2 className="text-gray-400 animate-spin" size={40} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying...</h2>
              <p className="text-gray-500 text-sm">Please wait a moment.</p>
            </>
          )}

          {/* ✅ Success state */}
          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-green-600" size={44} />
                  </div>
                  <div className="absolute inset-0 w-20 h-20 bg-green-200 rounded-full animate-ping opacity-20 pointer-events-none" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified! ✅</h2>
              <p className="text-gray-500 text-sm mb-8">
                Your account is now active. You can log in with your roll number and password.
              </p>
              <button
                onClick={onGoToLogin}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-base shadow-lg shadow-green-200 transition-all hover:shadow-xl"
              >
                Go to Login →
              </button>
            </>
          )}

          {/* ❌ Invalid / expired token */}
          {status === 'invalid' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="text-red-500" size={44} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Invalid or Expired</h2>
              <p className="text-gray-500 text-sm mb-2">
                This verification link has already been used or has expired.
              </p>
              <p className="text-gray-400 text-xs mb-8">
                If your account is already verified, you can log in directly.
              </p>
              <button
                onClick={onGoToLogin}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base transition-all"
              >
                Go to Login
              </button>
            </>
          )}

          {/* ❓ Unknown — user navigated here directly */}
          {status === 'unknown' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                  <Mail className="text-blue-400" size={40} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-gray-500 text-sm mb-8">
                Click the verification link sent to your email to activate your account.
              </p>
              <button
                onClick={onGoToLogin}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base transition-all"
              >
                Back to Login
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
