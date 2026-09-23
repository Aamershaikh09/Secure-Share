import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Search,
  Filter,
  Download,
  Share2,
  Trash2,
  Edit2,
  FolderInput,
  File,
  FolderTree,
  Shield,
  Clock,
  Sparkles,
  Check,
  Lock,
} from 'lucide-react';
import { api } from '../services/api';
import { FileItem, Folder } from '../types';
import { UploadModal } from '../components/modals/UploadModal';
import { ShareModal } from '../components/modals/ShareModal';
import { RenameModal, MoveModal, DeleteModal } from '../components/modals/FileActionModals';

interface FilesPageProps {
  onNavigate: (route: string) => void;
}

export const FilesPage: React.FC<FilesPageProps> = ({ onNavigate }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [shareTargetFile, setShareTargetFile] = useState<FileItem | null>(null);
  const [renameTargetFile, setRenameTargetFile] = useState<FileItem | null>(null);
  const [moveTargetFile, setMoveTargetFile] = useState<FileItem | null>(null);
  const [deleteTargetFile, setDeleteTargetFile] = useState<FileItem | null>(null);

  const loadFilesAndFolders = async () => {
    setIsLoading(true);
    try {
      const [filesData, foldersData] = await Promise.all([
        api.getFiles(selectedFolderId, searchQuery),
        api.getFolders(),
      ]);
      setFiles(filesData);
      setFolders(foldersData);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFilesAndFolders();
  }, [selectedFolderId, searchQuery]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = async (file: FileItem) => {
    try {
      await api.downloadFile(file.id, file.name);
    } catch (err: any) {
      alert(err.message || 'Download failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetFile) return;
    await api.deleteFile(deleteTargetFile.id);
    loadFilesAndFolders();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            My Files
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store, search, categorize, and securely share your private documents
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all shrink-0"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload File</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files by filename..."
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
          />
        </div>

        {/* Folder filter dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={selectedFolderId === null ? 'all' : selectedFolderId}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'all') setSelectedFolderId(null);
              else if (val === 'root') setSelectedFolderId('root');
              else setSelectedFolderId(val);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="all">All Folders</option>
            <option value="root">Root Directory Only</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Files Grid / Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <File className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No files found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No documents match "${searchQuery}". Try clearing search.`
                : 'Upload files to your server-side personal storage to get started.'}
            </p>
            <div className="mt-4">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                Upload Document
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Folder</th>
                  <th className="px-6 py-3.5">Size</th>
                  <th className="px-6 py-3.5">Modified</th>
                  <th className="px-6 py-3.5">Sharing</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold text-xs uppercase border border-blue-100">
                          {file.name.split('.').pop() || 'FILE'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {file.type}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Folder */}
                    <td className="px-6 py-4">
                      {file.folderName && file.folderName !== 'Root' ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: file.folderColor || '#3b82f6' }}
                          />
                          <span className="font-medium">{file.folderName}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">Root</span>
                      )}
                    </td>

                    {/* Size */}
                    <td className="px-6 py-4 font-mono tabular-nums text-slate-600">
                      {formatFileSize(file.size)}
                    </td>

                    {/* Modified */}
                    <td className="px-6 py-4 font-mono tabular-nums text-slate-500">
                      {new Date(file.updatedAt).toLocaleDateString()}
                    </td>

                    {/* Sharing status */}
                    <td className="px-6 py-4">
                      {file.isShared ? (
                        <button
                          onClick={() => onNavigate('/shares')}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          <Shield className="h-3.5 w-3.5 text-blue-600" />
                          <span>Shared (Active)</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">Private</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setShareTargetFile(file)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Generate Share Link"
                        >
                          <Share2 className="h-3.5 w-3.5 text-blue-600" />
                          <span>Share</span>
                        </button>

                        <button
                          onClick={() => handleDownload(file)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setRenameTargetFile(file)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          title="Rename"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setMoveTargetFile(file)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          title="Move to Folder"
                        >
                          <FolderInput className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setDeleteTargetFile(file)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        folders={folders}
        initialFolderId={selectedFolderId === 'all' || selectedFolderId === 'root' ? null : selectedFolderId}
        onUploadSuccess={loadFilesAndFolders}
      />

      <ShareModal
        isOpen={!!shareTargetFile}
        onClose={() => setShareTargetFile(null)}
        file={shareTargetFile}
        onShareCreated={loadFilesAndFolders}
        onNavigate={onNavigate}
      />

      <RenameModal
        isOpen={!!renameTargetFile}
        onClose={() => setRenameTargetFile(null)}
        file={renameTargetFile}
        onSuccess={loadFilesAndFolders}
      />

      <MoveModal
        isOpen={!!moveTargetFile}
        onClose={() => setMoveTargetFile(null)}
        file={moveTargetFile}
        folders={folders}
        onSuccess={loadFilesAndFolders}
      />

      <DeleteModal
        isOpen={!!deleteTargetFile}
        onClose={() => setDeleteTargetFile(null)}
        title="Delete File"
        message={`Are you sure you want to permanently delete "${deleteTargetFile?.name}"?`}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
