import { User, FileItem, Folder, ShareLink, DashboardStats, PublicShareData } from '../types';

const TOKEN_KEY = 'secureshare_auth_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.error || data.message || `Request failed with status ${res.status}`) as any;
      err.unverified = Boolean(data.unverified);
      err.email = data.email;
      err.status = res.status;
      throw err;
    }

    return data as T;
  },

  // Auth API
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  },

  async register(name: string, email: string, password: string): Promise<{ message: string; email: string }> {
    return this.request<{ message: string; email: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  async verifyEmail(token: string): Promise<{ message: string; verified: boolean }> {
    return this.request<{ message: string; verified: boolean }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearToken();
    }
  },

  // Stats
  async getStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/api/stats');
  },

  // Folders
  async getFolders(): Promise<Folder[]> {
    return this.request<Folder[]>('/api/folders');
  },

  async createFolder(name: string, color?: string): Promise<Folder> {
    return this.request<Folder>('/api/folders', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    });
  },

  async renameFolder(id: string, name: string): Promise<Folder> {
    return this.request<Folder>(`/api/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  async deleteFolder(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/folders/${id}`, {
      method: 'DELETE',
    });
  },

  // Files
  async getFiles(folderId?: string | null, search?: string): Promise<FileItem[]> {
    const params = new URLSearchParams();
    if (folderId !== undefined) {
      params.append('folderId', folderId === null ? 'root' : folderId);
    }
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<FileItem[]>(`/api/files${query}`);
  },

  async uploadFile(file: File, folderId?: string | null): Promise<FileItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId && folderId !== 'root') {
      formData.append('folderId', folderId);
    }

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/files/upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || `Upload failed (${res.status})`);
    }

    return data as FileItem;
  },

  async renameFile(id: string, name: string): Promise<FileItem> {
    return this.request<FileItem>(`/api/files/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  async moveFile(id: string, folderId: string | null): Promise<FileItem> {
    return this.request<FileItem>(`/api/files/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ folderId: folderId ?? 'null' }),
    });
  },

  async downloadFile(id: string, fileName?: string): Promise<void> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/files/${id}/download`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Download failed' }));
      throw new Error(err.error || 'Failed to download file.');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  },

  async deleteFile(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/files/${id}`, {
      method: 'DELETE',
    });
  },

  // Shares
  async getShares(): Promise<ShareLink[]> {
    return this.request<ShareLink[]>('/api/shares');
  },

  async createShare(fileId: string, password?: string, expiresInHours?: number): Promise<ShareLink> {
    return this.request<ShareLink>('/api/shares', {
      method: 'POST',
      body: JSON.stringify({ fileId, password, expiresInHours }),
    });
  },

  async revokeShare(token: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/shares/${token}`, {
      method: 'DELETE',
    });
  },

  // Public Share Access
  async getPublicShare(token: string): Promise<PublicShareData> {
    const res = await fetch(`/api/public/share/${token}`);
    const data = await res.json();
    return data;
  },

  async verifySharePassword(token: string, password: string): Promise<{ status: string; file?: any; error?: string }> {
    const res = await fetch(`/api/public/share/${token}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return res.json();
  },

};
