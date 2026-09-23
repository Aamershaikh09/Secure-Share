import React, { useState } from 'react';
import { Shield, Lock, Mail, User as UserIcon, ArrowRight, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface RegisterPageProps {
  onNavigate: (route: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success state after registration
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Please provide your full name (at least 2 characters).');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await register(name.trim(), email.trim(), password);
      setIsRegistered(true);
      setRegisteredEmail(res.email || email.trim());
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again with valid credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      const res = await api.resendVerification(registeredEmail);
      setResendStatus(res.message || 'Verification link sent!');
    } catch (err: any) {
      setResendStatus(err.message || 'Failed to resend verification email.');
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
            {isRegistered ? (
              /* Verification Email Notice Screen */
              <div className="text-center animate-fade-in">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Account Created!
                </h1>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Please check your email to verify your account.
                </p>

                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-left">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-blue-900">
                        Verification email sent to:
                      </p>
                      <p className="text-xs font-mono text-blue-700 break-all mt-0.5">
                        {registeredEmail}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Click the link in the email to activate your account. The link will expire in <strong>24 hours</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {resendStatus && (
                  <p className="mt-3 text-xs text-blue-700 bg-blue-50 py-2 px-3 rounded-lg border border-blue-200">
                    {resendStatus}
                  </p>
                )}

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
                    disabled={isResending}
                    onClick={handleResend}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    <span>{isResending ? 'Sending...' : "Didn't receive email? Resend"}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Registration Form Screen */
              <div>
                {/* Header */}
                <div className="text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Create Your Account
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Start storing, organizing and securely sharing your files
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3.5 text-xs font-medium text-rose-700 border border-rose-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Elena Rostova"
                        className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address
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
                        placeholder="name@university.edu"
                        className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Must contain a minimum of 8 characters.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 transition-all cursor-pointer"
                    >
                      {isSubmitting ? 'Creating Account...' : 'Create Account'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>

                {/* Bottom link */}
                <div className="mt-6 text-center text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('/login')}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
