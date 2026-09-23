import React from 'react';
import {
  User,
  Shield,
  KeyRound,
  Lock,
  LogOut,
  CheckCircle2,
  Server,
  Layers,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SettingsPageProps {
  onNavigate: (route: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onNavigate('/');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Account &amp; Security Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your profile and the security controls used by SecureShare
        </p>
      </div>

      {/* User Profile Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-blue-600" />
          Profile Information
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-500">Full Name</label>
            <p className="mt-1 text-sm font-bold text-slate-900">{user?.name || 'User'}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500">Email Address</label>
            <p className="mt-1 text-sm font-bold text-slate-900 font-mono">{user?.email || 'user@example.com'}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500">Email Verification Status</label>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Verified Account</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500">Account ID</label>
            <p className="mt-1 text-xs font-mono text-slate-600 truncate">{user?.id}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500">Account Created</label>
            <p className="mt-1 text-xs font-mono text-slate-600">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Not available'}
            </p>
          </div>
        </div>
      </div>

      {/* Cryptographic Architecture Card (CS Semester 5 Project) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
          <KeyRound className="h-4 w-4 text-blue-600" />
          Cryptographic Parameters &amp; Invariants
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Detailed technical specifications for academic demonstration
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs font-semibold text-slate-500">Key Derivation</span>
            <p className="text-sm font-bold text-slate-900 mt-1 font-mono">PBKDF2-HMAC-SHA512</p>
            <p className="text-[11px] text-slate-500 mt-1">100,000 iterations per hash</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs font-semibold text-slate-500">Token Generation</span>
            <p className="text-sm font-bold text-slate-900 mt-1 font-mono">128-bit CSPRNG</p>
            <p className="text-[11px] text-slate-500 mt-1">Cryptographically secure hex string</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs font-semibold text-slate-500">Timing Attack Defense</span>
            <p className="text-sm font-bold text-slate-900 mt-1 font-mono">Constant-Time Eq</p>
            <p className="text-[11px] text-slate-500 mt-1">crypto.timingSafeEqual comparison</p>
          </div>
        </div>

        <div className="mt-5 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Passwords, verification tokens, and share passwords are stored only as protected hashes; uploaded file binaries remain on the server filesystem.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Server-side route protection strictly verifies tokens before returning resources.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Link revocation takes effect atomically without caching leaks.</span>
          </div>
        </div>
      </div>

      {/* Danger Zone / Logout */}
      <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-rose-900">Sign Out of Session</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Terminates active session token and returns to public Home Page.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
