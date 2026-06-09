import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmailCode, sendEmailVerificationCode } = useAuth();
  const { success: showSuccess, error: showError } = useNotification();

  const [email] = useState(location.state?.email || localStorage.getItem('pendingVerificationEmail') || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await verifyEmailCode(email, code);
      localStorage.removeItem('pendingVerificationEmail');
      showSuccess('Email verified successfully. You can now sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await sendEmailVerificationCode(email);
      showSuccess('A new verification code has been sent to your email');
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to resend verification code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-amber-100 p-8">
        <p className="text-sm font-semibold text-amber-700 mb-2">Email verification</p>
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Confirm your email</h1>
        <p className="text-gray-600 mb-6">
          We sent a 6-digit code to <span className="font-semibold text-gray-800">{email}</span>. Enter it below to activate your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 tracking-[0.3em] text-center text-lg font-bold"
              placeholder="123456"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600 transition disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button onClick={handleResend} disabled={resending} className="text-amber-700 font-semibold hover:text-amber-800">
            {resending ? 'Sending...' : 'Resend code'}
          </button>
          <button onClick={() => navigate('/login')} className="text-gray-600 hover:text-gray-800 font-semibold">
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;