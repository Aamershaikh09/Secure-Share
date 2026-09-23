import React, { useState, useEffect } from 'react';
import {
  Shield,
  LayoutDashboard,
  FolderOpen,
  FolderTree,
  Share2,
  HardDrive,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardStats } from '../types';

interface AuthenticatedLayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  currentRoute,
  onNavigate,
  children,
}) => {
  const { user, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const fetchStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    await logout();
    onNavigate('/');
  };

  const navItems = [
    { label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
    { label: 'My Files', route: '/files', icon: FolderOpen },
    { label: 'Folders', route: '/folders', icon: FolderTree },
    { label: 'Shared Links', route: '/shares', icon: Share2 },
    { label: 'Storage', route: '/storage', icon: HardDrive },
    { label: 'Settings', route: '/settings', icon: Settings },
  ];

  const formatStorage = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const usedBytes = stats?.storageUsedBytes || 0;
  const limitBytes = stats?.storageLimitBytes ?? 0;
  const storagePercentage = limitBytes > 0 ? Math.min(100, Math.max(0, (usedBytes / limitBytes) * 100)) : 0;

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 antialiased overflow-hidden font-sans">
      {/* Desktop Sidebar (260px) */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white shrink-0">
        {/* Brand header */}
        <div className="flex h-16 items-center gap-2.5 px-6 border-b border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <Shield className="h-4 w-4" />
          </div>
          <button
            onClick={() => onNavigate('/dashboard')}
            className="text-lg font-bold tracking-tight text-slate-900 hover:text-blue-600 transition-colors"
          >
            SecureShare
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => onNavigate(item.route)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.route === '/shares' && stats && stats.activeSharesCount > 0 && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-xs font-mono tabular-nums ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {stats.activeSharesCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Storage Widget Card */}
        <div className="p-4 mx-3 mb-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-blue-600" />
              Storage
            </span>
            <span className="font-mono tabular-nums text-slate-500 text-[11px]">
              {storagePercentage.toFixed(1)}%
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, storagePercentage)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums mt-1.5">
            <span>{formatStorage(usedBytes)}</span>
            <span>{limitBytes > 0 ? `${formatStorage(limitBytes)} Quota` : 'Quota unavailable'}</span>
          </div>
        </div>

        {/* User Quick Info & Logout */}
        <div className="border-t border-slate-200 p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex w-72 flex-col bg-white border-r border-slate-200 z-10">
            <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Shield className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold text-slate-900">SecureShare</span>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.route;
                return (
                  <button
                    key={item.route}
                    onClick={() => {
                      setMobileSidebarOpen(false);
                      onNavigate(item.route);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="cursor-pointer hover:text-slate-800" onClick={() => onNavigate('/')}>
                SecureShare
              </span>
              <span>/</span>
              <span className="font-semibold text-slate-900 capitalize">
                {currentRoute.replace('/', '') || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3">
            {/* Quick search button */}
            <button
              onClick={() => onNavigate('/files')}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search vault...</span>
            </button>

            {/* Notification indicator */}
            <div className="relative">
              <button
                title="System Notifications"
                onClick={() => onNavigate('/shares')}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors relative"
              >
                <Bell className="h-4 w-4" />
                {stats && stats.activeSharesCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                )}
              </button>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    {user?.name || 'User'}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight truncate max-w-[120px]">
                    {user?.email || ''}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg z-50 animate-fade-in"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</p>
                  </div>

                  <button
                    onClick={() => onNavigate('/settings')}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Settings className="h-3.5 w-3.5 text-slate-400" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={() => onNavigate('/storage')}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                    <span>Storage Usage</span>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
