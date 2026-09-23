import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email verification required handling
  const [isUnverified, setIsUnverified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setIsUnverified(false);
    setResendMessage(null);

    try {
      await login(email.trim(), password);
      onNavigate('/dashboard');
    } catch (err: any) {
      setIsSubmitting(false);

      if (err.unverified || (err.message && err.message.toLowerCase().includes('verify your email'))) {
        setIsUnverified(true);
        setUnverifiedEmail(err.email || email.trim());
        setError('Please verify your email address before logging in.');
      } else {
        setError(err.message || 'Invalid email or password. Please try again.');
      }
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = unverifiedEmail || email.trim();
    if (!targetEmail) {
      setError('Please enter your email address to receive a verification link.');
      return;
    }

    setIsResending(true);
    setResendMessage(null);

    try {
      const res = await api.resendVerification(targetEmail);
      setResendMessage(res.message || 'If an unverified account exists, a link was sent.');
    } catch (err: any) {
      setResendMessage(err.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar onNavigate={onNavigate} />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Welcome Back
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Sign in to access your secure vault and shared files
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3.5 text-xs font-medium text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Verification Required Banner & Resend Action */}
            {isUnverified && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                <div className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900">
                      Email Verification Required
                    </p>
                    <p className="mt-1 text-amber-800 leading-relaxed">
                      We sent a verification link to <strong>{unverifiedEmail}</strong>. Please click the link in your inbox to unlock your account.
                    </p>
                    <button
                      type="button"
                      disabled={isResending}
                      onClick={handleResendVerification}
                      className="mt-3 inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3 w-3 ${isResending ? 'animate-spin' : ''}`} />
                      <span>{isResending ? 'Sending...' : 'Resend verification email'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {resendMessage && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-xs font-medium text-blue-700 border border-blue-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                <span>{resendMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 transition-all cursor-pointer"
              >
                {isSubmitting ? 'Authenticating...' : 'Login'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Bottom link */}
            <div className="mt-6 text-center text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Create an account
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
