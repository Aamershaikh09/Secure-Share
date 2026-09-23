import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AuthenticatedLayout } from './components/AuthenticatedLayout';
import { DashboardPage } from './pages/DashboardPage';
import { FilesPage } from './pages/FilesPage';
import { FoldersPage } from './pages/FoldersPage';
import { SharesPage } from './pages/SharesPage';
import { StoragePage } from './pages/StoragePage';
import { SettingsPage } from './pages/SettingsPage';
import { PublicSharePage } from './pages/PublicSharePage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  // Listen for browser popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Initializing SecureShare...</p>
        </div>
      </div>
    );
  }

  // 1. Check for Public Share Link route: /share/:token
  if (currentPath.startsWith('/share/')) {
    const token = currentPath.replace('/share/', '');
    return <PublicSharePage token={token} onNavigate={navigate} />;
  }

  // 2. Email verification route: /verify-email
  if (currentPath.startsWith('/verify-email')) {
    return <VerifyEmailPage onNavigate={navigate} />;
  }

  // 3. Unauthenticated Public Routes
  if (currentPath === '/login') {
    if (isAuthenticated) {
      navigate('/dashboard');
      return null;
    }
    return <LoginPage onNavigate={navigate} />;
  }

  if (currentPath === '/register') {
    if (isAuthenticated) {
      navigate('/dashboard');
      return null;
    }
    return <RegisterPage onNavigate={navigate} />;
  }

  // 3. Home / Landing Page: /
  if (currentPath === '/' || currentPath === '') {
    return <HomePage onNavigate={navigate} />;
  }

  // 4. Protected Routes
  const protectedRoutes = ['/dashboard', '/files', '/folders', '/shares', '/storage', '/settings'];
  if (protectedRoutes.some((route) => currentPath.startsWith(route))) {
    if (!isAuthenticated) {
      // Redirect to /login if attempting to access protected route while unauthenticated
      return <LoginPage onNavigate={navigate} />;
    }

    return (
      <AuthenticatedLayout currentRoute={currentPath} onNavigate={navigate}>
        {currentPath === '/dashboard' && <DashboardPage onNavigate={navigate} />}
        {currentPath === '/files' && <FilesPage onNavigate={navigate} />}
        {currentPath === '/folders' && <FoldersPage onNavigate={navigate} />}
        {currentPath === '/shares' && <SharesPage onNavigate={navigate} />}
        {currentPath === '/storage' && <StoragePage onNavigate={navigate} />}
        {currentPath === '/settings' && <SettingsPage onNavigate={navigate} />}
      </AuthenticatedLayout>
    );
  }

  // Fallback: 404 -> redirect to Home
  return <HomePage onNavigate={navigate} />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
