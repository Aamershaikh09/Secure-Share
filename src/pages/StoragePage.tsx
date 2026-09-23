import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  PieChart,
  FileText,
  FileCode,
  Image,
  Archive,
  File,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, FileItem } from '../types';

interface StoragePageProps {
  onNavigate: (route: string) => void;
}

export const StoragePage: React.FC<StoragePageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, filesData] = await Promise.all([
          api.getStats(),
          api.getFiles(),
        ]);
        setStats(statsData);
        setFiles(filesData);
      } catch {
        // Ignore
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const formatStorage = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const usedBytes = stats?.storageUsedBytes || 0;
  const limitBytes = stats?.storageLimitBytes ?? 0;
  const percentage = limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 0;

  // Categorize files by extension
  const categories = {
    pdf: { label: 'PDF Documents', bytes: 0, count: 0, color: '#ef4444' },
    images: { label: 'Images & Media', bytes: 0, count: 0, color: '#3b82f6' },
    code: { label: 'Source & SQL', bytes: 0, count: 0, color: '#8b5cf6' },
    text: { label: 'Text & Notes', bytes: 0, count: 0, color: '#10b981' },
    other: { label: 'Other Formats', bytes: 0, count: 0, color: '#64748b' },
  };

  files.forEach((f) => {
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') {
      categories.pdf.bytes += f.size;
      categories.pdf.count += 1;
    } else if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) {
      categories.images.bytes += f.size;
      categories.images.count += 1;
    } else if (['sql', 'js', 'ts', 'tsx', 'py', 'json', 'html', 'css'].includes(ext)) {
      categories.code.bytes += f.size;
      categories.code.count += 1;
    } else if (['txt', 'md', 'doc', 'docx'].includes(ext)) {
      categories.text.bytes += f.size;
      categories.text.count += 1;
    } else {
      categories.other.bytes += f.size;
      categories.other.count += 1;
    }
  });

  const sortedFiles = [...files].sort((a, b) => b.size - a.size).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Storage Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Detailed metrics on your server-side storage quota and file distribution
        </p>
      </div>

      {/* Main Quota Meter Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {formatStorage(limitBytes)} Personal Cloud Allocation
              </h2>
              <p className="text-xs text-slate-500">
                Ownership checks isolate your database records and filesystem objects
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {formatStorage(usedBytes)}
            </span>
            <span className="text-xs text-slate-400 font-mono"> / {formatStorage(limitBytes)}</span>
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div className="mt-6 h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
          {Object.entries(categories).map(([key, cat]) => {
            const segPercent = (cat.bytes / limitBytes) * 100;
            if (segPercent === 0) return null;
            return (
              <div
                key={key}
                title={`${cat.label}: ${formatStorage(cat.bytes)}`}
                style={{
                  width: `${Math.max(1, segPercent)}%`,
                  backgroundColor: cat.color,
                }}
                className="h-full transition-all duration-500"
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5 pt-4 border-t border-slate-100">
          {Object.entries(categories).map(([key, cat]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="truncate">{cat.label}</span>
              </div>
              <p className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                {formatStorage(cat.bytes)}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                {cat.count} {cat.count === 1 ? 'file' : 'files'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Largest Files Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Largest Stored Files</h3>
            <p className="text-xs text-slate-500">Documents consuming the most allocation</p>
          </div>
          <button
            onClick={() => onNavigate('/files')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Manage Files →
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading metrics...</div>
        ) : sortedFiles.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No files stored yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 uppercase">
                    {file.name.split('.').pop() || 'FILE'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{file.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Folder: {file.folderName || 'Root'}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono tabular-nums">
                  <span className="text-xs font-bold text-slate-900">
                    {formatStorage(file.size)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Storage Architecture Info */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-900 flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-600" />
          BSc Computer Science Semester 5 Project - Storage Policy
        </h4>
        <p>
          Files are stored with relational referential integrity. When a folder is deleted, its child documents automatically cascade to the root directory rather than being orphaned. When a file is permanently deleted, all active cryptographic share tokens associated with that file are immediately purged from the system.
        </p>
      </div>
    </div>
  );
};
