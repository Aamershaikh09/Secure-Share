import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Download,
  FileText,
  Clock,
  Ban,
  AlertCircle,
  CheckCircle2,
  FileCode,
  File,
  Eye,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { PublicShareData } from '../types';

interface PublicSharePageProps {
  token: string;
  onNavigate: (route: string) => void;
}

export const PublicSharePage: React.FC<PublicSharePageProps> = ({ token, onNavigate }) => {
  const [shareData, setShareData] = useState<PublicShareData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [unlockedFile, setUnlockedFile] = useState<any>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fetchShareInfo = async () => {
    setIsLoading(false);
    try {
      const data = await api.getPublicShare(token);
      setShareData(data);
      if (data.status === 'active' && data.file) {
        setUnlockedFile(data.file);
      }
    } catch {
      setShareData({ status: 'not_found', message: 'Unable to load share link' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShareInfo();
  }, [token]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setVerifyError('Please enter the access password.');
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const res = await api.verifySharePassword(token, password);
      if (res.error) {
        setVerifyError(res.error);
        setIsVerifying(false);
      } else if (res.file) {
        setUnlockedFile(res.file);
        setShareData((prev) => (prev ? { ...prev, status: 'unlocked', file: res.file } : null));
        setIsVerifying(false);
      }
    } catch (err: any) {
      setIsVerifying(false);
      setVerifyError(err.message || 'Verification failed. Please check password.');
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `/api/public/share/${token}/download`;
    link.download = shareData?.fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Public Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              SecureShare
            </span>
          </button>

          <button
            onClick={() => onNavigate('/')}
            className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Go to Home
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg">
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <div className="animate-spin inline-block h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full mb-4" />
              <p className="text-xs font-semibold text-slate-500">
                Verifying cryptographic token...
              </p>
            </div>
          ) : shareData?.status === 'revoked' ? (
            /* Revoked State */
            <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xs animate-fade-in">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
                <Ban className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Share Link Revoked
              </h2>
              <p className="mt-2 text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                The owner of this file has revoked this access token. The resource is no longer accessible via this link.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => onNavigate('/')}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Return to Home
                </button>
              </div>
            </div>
          ) : shareData?.status === 'expired' ? (
            /* Expired State */
            <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-xs animate-fade-in">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
                <Clock className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Share Link Expired
              </h2>
              <p className="mt-2 text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                This secure sharing link had a configured time-to-live (TTL) expiration that has now passed. Access has automatically expired.
              </p>
              {shareData.expiresAt && (
                <p className="mt-3 text-[11px] font-mono text-slate-400">
                  Expired on {new Date(shareData.expiresAt).toLocaleString()}
                </p>
              )}
              <div className="mt-6">
                <button
                  onClick={() => onNavigate('/')}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Return to Home
                </button>
              </div>
            </div>
          ) : shareData?.status === 'not_found' || shareData?.status === 'file_missing' ? (
            /* Not Found State */
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs animate-fade-in">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Link Not Found
              </h2>
              <p className="mt-2 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                This link is invalid or may have been deleted by the owner.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => onNavigate('/')}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Return to Home
                </button>
              </div>
            </div>
          ) : shareData?.status === 'password_required' && !unlockedFile ? (
            /* Password Challenge Screen */
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm animate-fade-in">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-3">
                  <Lock className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Password Protected File
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  The owner has protected this document with an access passphrase.
                </p>
              </div>

              {/* File Info Snippet */}
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-xs font-bold uppercase text-slate-700">
                  {shareData.fileName?.split('.').pop() || 'FILE'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {shareData.fileName}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    {formatFileSize(shareData.fileSize)}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {verifyError && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              {/* Password Form */}
              <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Enter Passphrase
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      autoFocus
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter file password..."
                      className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    Protected by server-side PBKDF2 constant-time verification
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || !password.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isVerifying ? 'Verifying Key...' : 'Unlock & Access File'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : (
            /* Unlocked / Active File View Screen */
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm animate-fade-in">
              <div className="flex items-start justify-between pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 font-extrabold text-sm uppercase">
                    {(unlockedFile?.name || shareData?.fileName || '').split('.').pop() || 'FILE'}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 break-all">
                      {unlockedFile?.name || shareData?.fileName}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                      <span>{formatFileSize(unlockedFile?.size || shareData?.fileSize)}</span>
                      <span>·</span>
                      <span className="text-emerald-700 font-medium">Verified Active</span>
                    </div>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Ready
                </span>
              </div>

              {/* Expiry note */}
              {shareData?.expiresAt && (
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Valid until: {new Date(shareData.expiresAt).toLocaleString()}</span>
                </div>
              )}

              {/* File Info Container */}
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {unlockedFile?.name || shareData?.fileName}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Size: {formatFileSize(unlockedFile?.size || shareData?.fileSize)} · MIME: {unlockedFile?.type || shareData?.fileType || 'application/octet-stream'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Storage: Secure Server Filesystem</span>
                  <span className="text-emerald-700 font-medium font-mono">Stream Ready</span>
                </div>
              </div>

              {/* Download Action */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-400 font-mono">
                  {downloadSuccess ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Download started!
                    </span>
                  ) : (
                    <span>Click below to save locally</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download File</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Public Footer note */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <p>Protected by SecureShare Controlled Sharing · BSc Computer Science Semester 5</p>
      </footer>
    </div>
  );
};
