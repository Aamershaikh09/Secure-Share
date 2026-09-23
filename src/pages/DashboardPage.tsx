import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  FileText,
  FolderTree,
  Share2,
  UploadCloud,
  FolderPlus,
  ArrowUpRight,
  Download,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardStats, FileItem, Folder } from '../types';
import { UploadModal } from '../components/modals/UploadModal';
import { CreateFolderModal } from '../components/modals/CreateFolderModal';
import { ShareModal } from '../components/modals/ShareModal';
import { DeleteModal } from '../components/modals/FileActionModals';

interface DashboardPageProps {
  onNavigate: (route: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [deleteFileItem, setDeleteFileItem] = useState<{ id: string; name: string } | null>(null);

  const loadData = async () => {
    try {
      const [statsData, foldersData] = await Promise.all([
        api.getStats(),
        api.getFolders(),
      ]);
      setStats(statsData);
      setFolders(foldersData);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatStorage = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const usedBytes = stats?.storageUsedBytes || 0;
  const limitBytes = stats?.storageLimitBytes ?? 0;
  const percentage = limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 0;

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      await api.downloadFile(fileId, fileName);
    } catch (err: any) {
      alert(err.message || 'Download failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteFileItem) return;
    await api.deleteFile(deleteFileItem.id);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-800">{user?.name}</span>. Here is your security vault status.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsFolderOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <FolderPlus className="h-4 w-4 text-blue-600" />
            <span>New Folder</span>
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Main Storage Bar Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-blue-600" />
              Storage Allocation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Isolated user quota with ownership-based file boundaries
            </p>
          </div>
          <div className="font-mono text-sm font-bold text-slate-800 tabular-nums">
            {formatStorage(usedBytes)} <span className="text-slate-400 font-normal">/ {formatStorage(limitBytes)}</span>
          </div>
        </div>

        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(2, percentage)}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
          <span>{percentage.toFixed(1)}% consumed</span>
          <span>{formatStorage(Math.max(0, limitBytes - usedBytes))} remaining</span>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          onClick={() => onNavigate('/files')}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs cursor-pointer hover:border-slate-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Stored Files</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {stats?.filesCount ?? 0}
            </span>
            <span className="text-xs font-semibold text-blue-600 flex items-center gap-0.5">
              View all <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('/folders')}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs cursor-pointer hover:border-slate-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Folders</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
              <FolderTree className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {stats?.foldersCount ?? 0}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              Manage <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('/shares')}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs cursor-pointer hover:border-slate-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Shared Links</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform">
              <Share2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                {stats?.activeSharesCount ?? 0}
              </span>
              <span className="text-xs text-slate-400 font-mono">active</span>
            </div>
            <span className="text-xs font-semibold text-purple-600 flex items-center gap-0.5">
              Review <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Recent Files Table / List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Files</h2>
            <p className="text-xs text-slate-500">Most recently modified documents</p>
          </div>
          <button
            onClick={() => onNavigate('/files')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            See all files →
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading files...</div>
        ) : stats?.recentFiles && stats.recentFiles.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {stats.recentFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-semibold text-xs text-slate-600 uppercase">
                    {file.name.split('.').pop() || 'FILE'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                      <span>{formatStorage(file.size)}</span>
                      <span>·</span>
                      <span>{new Date(file.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      setShareFile({
                        id: file.id,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        folderId: file.folderId,
                        createdAt: file.updatedAt,
                        updatedAt: file.updatedAt,
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Share File"
                  >
                    <Share2 className="h-3.5 w-3.5 text-blue-600" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                  <button
                    onClick={() => handleDownload(file.id, file.name)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteFileItem({ id: file.id, name: file.name })}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-slate-700">No files uploaded yet</p>
            <p className="text-xs text-slate-400 mt-1">Upload your first document to begin securing files.</p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Upload Now
            </button>
          </div>
        )}
      </div>

     

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        folders={folders}
        onUploadSuccess={loadData}
      />

      <CreateFolderModal
        isOpen={isFolderOpen}
        onClose={() => setIsFolderOpen(false)}
        onFolderCreated={loadData}
      />

      <ShareModal
        isOpen={!!shareFile}
        onClose={() => setShareFile(null)}
        file={shareFile}
        onShareCreated={loadData}
        onNavigate={onNavigate}
      />

      <DeleteModal
        isOpen={!!deleteFileItem}
        onClose={() => setDeleteFileItem(null)}
        title="Delete File"
        message={`Are you sure you want to permanently delete "${deleteFileItem?.name}"? Any active share links pointing to this file will be invalidated.`}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
