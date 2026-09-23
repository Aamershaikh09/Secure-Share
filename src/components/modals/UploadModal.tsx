import React, { useState, useRef } from 'react';
import { X, UploadCloud, File, AlertCircle } from 'lucide-react';
import { Folder } from '../../types';
import { api } from '../../services/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  initialFolderId?: string | null;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  folders,
  initialFolderId = null,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolderId);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select or drop a file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await api.uploadFile(file, selectedFolderId);
      setIsUploading(false);
      onUploadSuccess();
      onClose();
    } catch (err: any) {
      setIsUploading(false);
      setError(err.message || 'Failed to upload file to SecureShare vault');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload to Secure Vault</h3>
              <p className="text-xs text-slate-500">
                Server-side filesystem storage with instant access
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
              : file
              ? 'border-blue-400 bg-blue-50/30'
              : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />

          {file ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <File className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 break-all max-w-xs">{file.name}</p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024 < 1024
                  ? `${(file.size / 1024).toFixed(1)} KB`
                  : `${(file.size / (1024 * 1024)).toFixed(2)} MB`)}
              </p>
              <span className="text-xs text-blue-600 underline mt-1">Change file</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <File className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Drag and drop your file here, or <span className="text-blue-600">browse</span>
              </p>
              <p className="text-xs text-slate-400">
                Supports PDF, Images, Documents, Code, Archives (Max 50MB)
              </p>
            </div>
          )}
        </div>

        {/* Folder Destination Selector */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Destination Folder
          </label>
          <select
            value={selectedFolderId || ''}
            onChange={(e) => setSelectedFolderId(e.target.value ? e.target.value : null)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">Root (No folder)</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all ${
              !file || isUploading
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Confirm Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};
