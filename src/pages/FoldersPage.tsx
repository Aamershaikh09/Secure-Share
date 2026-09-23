import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  Folder,
  FolderOpen,
  Edit2,
  Trash2,
  FileText,
  ArrowRight,
  HardDrive,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { Folder as FolderType, FileItem } from '../types';
import { CreateFolderModal } from '../components/modals/CreateFolderModal';
import { DeleteModal } from '../components/modals/FileActionModals';

interface FoldersPageProps {
  onNavigate: (route: string) => void;
}

export const FoldersPage: React.FC<FoldersPageProps> = ({ onNavigate }) => {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Rename folder inline state
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Delete folder state
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderType | null>(null);

  // Active viewing folder
  const [viewingFolder, setViewingFolder] = useState<FolderType | null>(null);
  const [folderFiles, setFolderFiles] = useState<FileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const loadFolders = async () => {
    setIsLoading(true);
    try {
      const data = await api.getFolders();
      setFolders(data);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const openFolderDrillDown = async (folder: FolderType) => {
    setViewingFolder(folder);
    setIsLoadingFiles(true);
    try {
      const files = await api.getFiles(folder.id);
      setFolderFiles(files);
    } catch {
      // Ignore
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleStartRename = (f: FolderType, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(f.id);
    setRenameValue(f.name);
  };

  const handleSaveRename = async (id: string) => {
    if (!renameValue.trim()) return;
    try {
      await api.renameFolder(id, renameValue.trim());
      setEditingFolderId(null);
      loadFolders();
    } catch (err: any) {
      alert(err.message || 'Failed to rename folder');
    }
  };

  const handleDeleteFolderConfirm = async () => {
    if (!deleteFolderTarget) return;
    await api.deleteFolder(deleteFolderTarget.id);
    if (viewingFolder?.id === deleteFolderTarget.id) {
      setViewingFolder(null);
    }
    loadFolders();
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
            Folders
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize documents into structured directories
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all shrink-0"
        >
          <FolderPlus className="h-4 w-4" />
          <span>New Folder</span>
        </button>
      </div>

      {/* Folder Drill-down banner if active */}
      {viewingFolder && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: viewingFolder.color }}
              />
              <h2 className="text-sm font-bold text-slate-900">
                Viewing Folder: {viewingFolder.name}
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                ({folderFiles.length} files)
              </span>
            </div>
            <button
              onClick={() => setViewingFolder(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Close folder preview ✕
            </button>
          </div>

          <div className="mt-3 divide-y divide-blue-100/80 max-h-56 overflow-y-auto">
            {isLoadingFiles ? (
              <p className="text-xs text-slate-500 py-2">Loading files in folder...</p>
            ) : folderFiles.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No files inside this folder.</p>
            ) : (
              folderFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between py-2 text-xs"
                >
                  <span className="font-medium text-slate-800 truncate">{file.name}</span>
                  <div className="flex items-center gap-3 text-slate-500 font-mono">
                    <span>{formatFileSize(file.size)}</span>
                    <button
                      onClick={() => onNavigate('/files')}
                      className="text-blue-600 hover:underline text-[11px]"
                    >
                      Manage in My Files →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Folders Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading folders...</div>
      ) : folders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <Folder className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No folders created</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Organize assignments, source code, research notes, and contracts into folders.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            Create First Folder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => {
            const isEditing = editingFolderId === folder.id;
            return (
              <div
                key={folder.id}
                onClick={() => openFolderDrillDown(folder)}
                className={`rounded-2xl border bg-white p-5 shadow-xs transition-all cursor-pointer hover:shadow-md ${
                  viewingFolder?.id === folder.id
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white font-bold"
                      style={{ backgroundColor: folder.color || '#3b82f6' }}
                    >
                      <FolderOpen className="h-5 w-5" />
                    </div>

                    <div>
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(folder.id);
                              if (e.key === 'Escape') setEditingFolderId(null);
                            }}
                            className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-900 outline-none"
                          />
                          <button
                            onClick={() => handleSaveRename(folder.id)}
                            className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <h3 className="text-sm font-bold text-slate-900 truncate max-w-[160px]">
                          {folder.name}
                        </h3>
                      )}
                      <p className="text-[11px] text-slate-400 font-mono">
                        Created {new Date(folder.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => handleStartRename(folder, e)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Rename"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteFolderTarget(folder);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="Delete Folder"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono tabular-nums font-semibold text-slate-800">
                      {folder.fileCount ?? 0}
                    </span>
                    <span className="text-slate-400">files</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono tabular-nums text-slate-500">
                    <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatFileSize(folder.totalSize ?? 0)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateFolderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onFolderCreated={loadFolders}
      />

      <DeleteModal
        isOpen={!!deleteFolderTarget}
        onClose={() => setDeleteFolderTarget(null)}
        title="Delete Folder"
        message={`Are you sure you want to delete "${deleteFolderTarget?.name}"? Any files inside will safely remain and be moved to the Root directory.`}
        onConfirm={handleDeleteFolderConfirm}
      />
    </div>
  );
};
