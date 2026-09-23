import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  Ban,
  ExternalLink,
  Lock,
  Clock,
  Eye,
  Download,
  AlertTriangle,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api';
import { ShareLink } from '../types';
import { DeleteModal } from '../components/modals/FileActionModals';

interface SharesPageProps {
  onNavigate: (route: string) => void;
}

export const SharesPage: React.FC<SharesPageProps> = ({ onNavigate }) => {
  const [shares, setShares] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ShareLink | null>(null);

  const loadShares = async () => {
    setIsLoading(true);
    try {
      const data = await api.getShares();
      setShares(data);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShares();
  }, []);

  const handleCopy = (token: string) => {
    const fullUrl = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return;
    await api.revokeShare(revokeTarget.token);
    loadShares();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Shared Links
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor, copy, inspect, and revoke generated cryptographic access tokens
          </p>
        </div>

        <button
          onClick={() => onNavigate('/files')}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all shrink-0"
        >
          <Share2 className="h-4 w-4" />
          <span>Share a File</span>
        </button>
      </div>

      {/* Overview Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Ephemeral &amp; Controlled Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Each link is generated with a unique 128-bit CSPRNG token. Revoking a link terminates access on the next incoming HTTP request.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
          <span className="text-slate-500">
            Active:{' '}
            <strong className="text-emerald-700 font-bold">
              {shares.filter((s) => s.status === 'active').length}
            </strong>
          </span>
          <span>·</span>
          <span className="text-slate-500">
            Revoked:{' '}
            <strong className="text-rose-600 font-bold">
              {shares.filter((s) => s.status === 'revoked').length}
            </strong>
          </span>
          <span>·</span>
          <span className="text-slate-500">
            Expired:{' '}
            <strong className="text-amber-600 font-bold">
              {shares.filter((s) => s.status === 'expired').length}
            </strong>
          </span>
        </div>
      </div>

      {/* Shares List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading shared links...</div>
        ) : shares.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <Share2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No shared links created</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Go to My Files, select any document, and generate a password-protected or expiring link.
            </p>
            <button
              onClick={() => onNavigate('/files')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Select File to Share
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">File &amp; Token</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Password</th>
                  <th className="px-6 py-3.5">Expires</th>
                  <th className="px-6 py-3.5">Activity</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shares.map((share) => {
                  const isRevoked = share.status === 'revoked';
                  const isExpired = share.status === 'expired';
                  const isActive = share.status === 'active';

                  return (
                    <tr key={share.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* File & Token */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 truncate max-w-xs sm:max-w-sm">
                            {share.fileName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>token:</span>
                            <span className="text-slate-600 select-all truncate max-w-[140px]">
                              {share.token}
                            </span>
                            <span>·</span>
                            <span>{formatFileSize(share.fileSize)}</span>
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {isActive && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </span>
                        )}
                        {isExpired && (
                          <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            <span>Expired</span>
                          </span>
                        )}
                        {isRevoked && (
                          <span className="inline-flex items-center gap-1.5 text-rose-700 font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span>Revoked</span>
                          </span>
                        )}
                      </td>

                      {/* Password */}
                      <td className="px-6 py-4">
                        {share.hasPassword ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                            <Lock className="h-3.5 w-3.5 text-blue-600" />
                            <span>Protected</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>

                      {/* Expires */}
                      <td className="px-6 py-4 font-mono tabular-nums text-slate-600">
                        {share.expiresAt ? (
                          <div>
                            <p>{new Date(share.expiresAt).toLocaleDateString()}</p>
                            <p className="text-[11px] text-slate-400">
                              {new Date(share.expiresAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal">Permanent</span>
                        )}
                      </td>

                      {/* Activity */}
                      <td className="px-6 py-4 font-mono tabular-nums text-slate-600">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1" title="Page Views">
                            <Eye className="h-3 w-3 text-slate-400" />
                            <span>{share.viewsCount}</span>
                          </span>
                          <span className="flex items-center gap-1" title="Downloads">
                            <Download className="h-3 w-3 text-slate-400" />
                            <span>{share.downloadsCount}</span>
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopy(share.token)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Copy link"
                          >
                            {copiedToken === share.token ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-slate-500" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {/* Open Public Preview */}
                          <button
                            onClick={() => onNavigate(`/share/${share.token}`)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            title="Test public recipient view"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>

                          {/* Revoke */}
                          {isActive && (
                            <button
                              onClick={() => setRevokeTarget(share)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                              title="Revoke Link Access"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              <span>Revoke</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revoke Confirmation Modal */}
      <DeleteModal
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title="Revoke Share Link"
        message={`Are you sure you want to revoke access to "${revokeTarget?.fileName}"? Any recipient attempting to visit this link will immediately receive an Access Revoked status.`}
        onConfirm={handleRevokeConfirm}
      />
    </div>
  );
};
