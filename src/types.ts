export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  createdAt?: number;
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  folderId: string | null;
  folderName?: string;
  folderColor?: string | null;
  createdAt: number;
  updatedAt: number;
  isShared?: boolean;
  shareToken?: string | null;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  fileCount?: number;
  totalSize?: number;
}

export interface ShareLink {
  id: string;
  token: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  hasPassword: boolean;
  expiresAt: number | null;
  isRevoked: boolean;
  isExpired: boolean;
  status: 'active' | 'expired' | 'revoked';
  viewsCount: number;
  downloadsCount: number;
  createdAt: number;
}

export interface DashboardStats {
  storageUsedBytes: number;
  storageLimitBytes: number;
  filesCount: number;
  foldersCount: number;
  sharesCount: number;
  activeSharesCount: number;
  recentFiles: {
    id: string;
    name: string;
    size: number;
    type: string;
    folderId: string | null;
    updatedAt: number;
  }[];
}

export interface PublicShareData {
  status: 'active' | 'password_required' | 'expired' | 'revoked' | 'not_found' | 'file_missing' | 'unlocked';
  token?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  expiresAt?: number | null;
  hasPassword?: boolean;
  message?: string;
  file?: {
    name: string;
    size: number;
    type: string;
  };
}
