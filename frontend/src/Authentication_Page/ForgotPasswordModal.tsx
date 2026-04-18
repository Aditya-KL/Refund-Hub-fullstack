import { useState, useRef } from 'react';
import { Mail, Lock, X, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:8000';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<'EMAIL' | 'OTP' | 'RESET' | 'SUCCESS'>('EMAIL');
  const [email, setEmail] = useState('');
  
  // OTP State: Array of 6 strings
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Reset everything when closing
  const handleClose = () => {
    setStep('EMAIL');
    setEmail('');
    setOtp(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError('');
    onClose();
  };

  const handleSendOTP = async () => {
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      });
      const data = await res.json();
      
      if (res.ok) {
        setStep('OTP');
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setError('Network error. Cannot reach server.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- OTP Input Handlers ---
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if a number was typed
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on Backspace if current box is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, ''); // Get only numbers
    
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      
      // Auto-focus the next empty box or the last box
      const focusIndex = Math.min(pastedData.length, 5);
      otpRefs.current[focusIndex]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please fill in all 6 digits.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), otp: fullOtp })
      });
      const data = await res.json();
      
      if (res.ok) {
        setStep('RESET');
      } else {
        setError(data.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      setError('Network error. Cannot reach server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordRegex.test(newPassword)) {
      setError('Password must be at least 8 characters and include an uppercase letter, a number, and a special character.');
      return;
    }

    setError('');
    setIsLoading(true);

    const fullOtp = otp.join('');

    try {
      const res = await fetch(`${BASE_URL}/api/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), otp: fullOtp, newPassword })
      });
      const data = await res.json();
      
      if (res.ok) {
        setStep('SUCCESS');
      } else {
        setError(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError('Network error. Cannot reach server.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
        
        {step !== 'SUCCESS' && (
          <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
            <X size={24} />
          </button>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {step === 'EMAIL' && (
          <>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h3>
            <p className="text-sm text-gray-600 mb-6">Enter your email and we'll send you a 6-digit verification code valid for 2 minutes.</p>
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="Enter your registered email"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                onClick={handleSendOTP}
                disabled={isLoading || !email}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-xl font-semibold transition-all"
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </>
        )}

        {step === 'OTP' && (
          <>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Enter OTP</h3>
            <p className="text-sm text-gray-600 mb-6">We sent a 6-digit code to <span className="font-semibold">{email}</span>.</p>
            <div className="space-y-6">
              
              {/* 6 Box OTP Input */}
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold text-blue-900 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500 transition-all"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-xl font-semibold transition-all"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </>
        )}

        {step === 'RESET' && (
          <>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Create New Password</h3>
            <p className="text-sm text-gray-600 mb-6">Your new password must be at least 8 characters long.</p>
            <div className="space-y-4">
              
              {/* New Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                  placeholder="New Password"
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  placeholder="Confirm New Password"
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                onClick={handleResetPassword}
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-xl font-semibold transition-all"
              >
                {isLoading ? 'Saving...' : 'Save New Password'}
              </button>
            </div>
          </>
        )}

        {step === 'SUCCESS' && (
          <div className="text-center py-4">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Password Updated!</h3>
            <p className="text-sm text-gray-600 mb-6">Your password has been changed successfully. You can now log in with your new password.</p>
            <button
              onClick={handleClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-all"
            >
              Back to Login
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
}