import React, { useState } from 'react';
import { X, Share2, Lock, Clock, Copy, Check, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { FileItem, ShareLink } from '../../types';
import { api } from '../../services/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
  onShareCreated?: () => void;
  onNavigate?: (route: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  file,
  onShareCreated,
  onNavigate,
}) => {
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [expiryOption, setExpiryOption] = useState<string>('24'); // default 24h
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedShare, setGeneratedShare] = useState<ShareLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !file) return null;

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requirePassword && !password.trim()) {
      setError('Please provide a password or uncheck password protection.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    let expiresInHours: number | undefined;
    if (expiryOption === '1') expiresInHours = 1;
    else if (expiryOption === '24') expiresInHours = 24;
    else if (expiryOption === '168') expiresInHours = 168; // 7 days
    else if (expiryOption === '720') expiresInHours = 720; // 30 days
    else expiresInHours = undefined; // Never

    try {
      const share = await api.createShare(
        file.id,
        requirePassword ? password.trim() : undefined,
        expiresInHours
      );
      setGeneratedShare(share);
      setIsGenerating(false);
      onShareCreated?.();
    } catch (err: any) {
      setIsGenerating(false);
      setError(err.message || 'Failed to generate secure share link.');
    }
  };

  const getShareUrl = () => {
    if (!generatedShare) return '';
    return `${window.location.origin}/share/${generatedShare.token}`;
  };

  const copyToClipboard = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAndClose = () => {
    setGeneratedShare(null);
    setPassword('');
    setRequirePassword(false);
    setExpiryOption('24');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Secure Sharing Link</h3>
              <p className="text-xs text-slate-500">Configure controlled access permissions</p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selected file snippet */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 font-semibold text-xs uppercase">
            {file.name.split('.').pop() || 'FILE'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
            <p className="text-xs text-slate-500">
              {(file.size / 1024 < 1024
                ? `${(file.size / 1024).toFixed(1)} KB`
                : `${(file.size / (1024 * 1024)).toFixed(2)} MB`)}
              {' · '}
              <span>Folder: {file.folderName || 'Root'}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!generatedShare ? (
          <form onSubmit={handleGenerateLink} className="mt-4 space-y-4">
            {/* Password protection option */}
            <div className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-300">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePassword}
                  onChange={(e) => setRequirePassword(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <Lock className="h-4 w-4 text-slate-500" />
                    <span>Password Protection</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Require visitors to enter a security passphrase before accessing or downloading this file.
                  </p>
                </div>
              </label>

              {requirePassword && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Set Passphrase
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter link password..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Hashed with salted PBKDF2-HMAC-SHA512 on backend
                  </p>
                </div>
              )}
            </div>

            {/* Link Expiry Option */}
            <div className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-300">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span>Link Expiration</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Automatically invalidate access after the selected duration.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { id: '1', label: '1 Hour' },
                  { id: '24', label: '24 Hours' },
                  { id: '168', label: '7 Days' },
                  { id: 'never', label: 'No Expiry' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setExpiryOption(item.id)}
                    className={`rounded-lg py-2 px-3 text-xs font-semibold border transition-all ${
                      expiryOption === item.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                {isGenerating ? 'Generating Token...' : 'Generate Secure Link'}
              </button>
            </div>
          </form>
        ) : (
          /* Generated Link Screen */
          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-emerald-50/70 p-4 border border-emerald-200 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900">Secure Share Link Created!</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  128-bit CSPRNG cryptographic token generated. You can revoke this link anytime from the Shared Links tab.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Shareable URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl()}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 outline-none select-all"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shrink-0 shadow-sm transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
              <div className="flex justify-between">
                <span>Password Protected:</span>
                <span className="font-semibold text-slate-800">
                  {generatedShare.hasPassword ? 'Yes (Password Protected)' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Expiration:</span>
                <span className="font-semibold text-slate-800">
                  {generatedShare.expiresAt
                    ? new Date(generatedShare.expiresAt).toLocaleString()
                    : 'Permanent (Until revoked)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Token ID:</span>
                <span className="font-mono text-slate-500 truncate max-w-[200px]">
                  {generatedShare.token}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (onNavigate) {
                    resetAndClose();
                    onNavigate(`/share/${generatedShare.token}`);
                  } else {
                    window.open(`/share/${generatedShare.token}`, '_blank');
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                <span>Test Public Recipient View</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
