import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle2, AlertCircle, Clock, ArrowRight, RefreshCw, Mail } from 'lucide-react';
import { api } from '../services/api';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface VerifyEmailPageProps {
  onNavigate: (route: string) => void;
}

type VerificationStatus = 'verifying' | 'success' | 'expired' | 'already_used' | 'invalid' | 'error';

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [message, setMessage] = useState<string>('Verifying your email token...');
  const [resendEmail, setResendEmail] = useState<string>('');
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token || !token.trim()) {
      setStatus('invalid');
      setMessage('No verification token was provided in the link.');
      return;
    }

    const executeVerification = async () => {
      try {
        const res = await api.verifyEmail(token.trim());
        setStatus('success');
        setMessage(res.message || 'Email verified successfully.');
      } catch (err: any) {
        const errMsg = err.message || '';
        const lower = errMsg.toLowerCase();

        if (lower.includes('expired')) {
          setStatus('expired');
          setMessage('This verification link has expired. Verification links are valid for 24 hours.');
        } else if (lower.includes('already') || lower.includes('used')) {
          setStatus('already_used');
          setMessage('This verification link has already been used. Your account is ready for login.');
        } else if (lower.includes('invalid') || lower.includes('unrecognized')) {
          setStatus('invalid');
          setMessage('Invalid or malformed verification link. Please request a new one.');
        } else {
          setStatus('error');
          setMessage(errMsg || 'An unexpected error occurred while verifying your email.');
        }
      }
    };

    executeVerification();
  }, []);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setIsResending(true);
    setResendFeedback(null);

    try {
      const res = await api.resendVerification(resendEmail.trim());
      setResendFeedback(res.message || 'If an account exists, a new verification link was sent.');
    } catch (err: any) {
      setResendFeedback(err.message || 'Failed to request new verification link.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar onNavigate={onNavigate} />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            {/* Header Icon */}
            <div className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
                <Shield className="h-6 w-6" />
              </div>

              {/* Status: Verifying */}
              {status === 'verifying' && (
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Verifying Email
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">
                    Checking cryptographic token validity...
                  </p>
                  <div className="mt-8 flex justify-center">
                    <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                </div>
              )}

              {/* Status: Success */}
              {status === 'success' && (
                <div className="animate-fade-in">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Email Verified!
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed font-medium">
                    Email verified successfully.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Your account has been activated. You can now log in to upload and share files securely.
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => onNavigate('/login')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <span>Continue to Login</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Status: Already Used */}
              {status === 'already_used' && (
                <div className="animate-fade-in">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 border border-blue-100">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Already Verified
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {message}
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => onNavigate('/login')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <span>Continue to Login</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Status: Expired */}
              {status === 'expired' && (
                <div className="animate-fade-in">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4 border border-amber-100">
                    <Clock className="h-7 w-7" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Link Expired
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {message}
                  </p>

                  <div className="mt-6 text-left">
                    <form onSubmit={handleResend} className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-700">
                        Request a new verification link:
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={resendEmail}
                          onChange={(e) => setResendEmail(e.target.value)}
                          placeholder="Your account email..."
                          className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isResending}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        <RefreshCw className={`h-3 w-3 ${isResending ? 'animate-spin' : ''}`} />
                        <span>{isResending ? 'Sending...' : 'Send New Link'}</span>
                      </button>
                    </form>
                    {resendFeedback && (
                      <p className="mt-2 text-[11px] text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-200">
                        {resendFeedback}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => onNavigate('/login')}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Return to Login
                    </button>
                  </div>
                </div>
              )}

              {/* Status: Invalid or Error */}
              {(status === 'invalid' || status === 'error') && (
                <div className="animate-fade-in">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 border border-rose-100">
                    <AlertCircle className="h-7 w-7" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Verification Failed
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {message}
                  </p>

                  <div className="mt-6 space-y-3">
                    <button
                      type="button"
                      onClick={() => onNavigate('/login')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <span>Go to Login</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('/register')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <span>Create a New Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
