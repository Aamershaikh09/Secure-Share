import React, { useState } from 'react';
import { Shield, Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onNavigate: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, route?: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (route) {
      onNavigate(route);
    } else if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        onNavigate('/');
        setTimeout(() => {
          document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      onNavigate(href);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single element wordmark linking to / */}
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/', '/')}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            SecureShare
          </span>
        </a>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, '/', '/')}
            className="text-slate-900 transition-colors hover:text-blue-600"
          >
            Home
          </a>
          <a
            href="#features"
            onClick={(e) => handleLinkClick(e, '#features')}
            className="text-slate-600 transition-colors hover:text-blue-600"
          >
            Features
          </a>
          <a
            href="#about"
            onClick={(e) => handleLinkClick(e, '#about')}
            className="text-slate-600 transition-colors hover:text-blue-600"
          >
            About
          </a>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => onNavigate('/dashboard')}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => onNavigate('/login')}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Login
              </button>
              <button
                onClick={() => onNavigate('/register')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 pt-3 pb-6 md:hidden">
          <nav className="flex flex-col gap-2">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, '/', '/')}
              className="rounded-md px-3 py-2 text-base font-medium text-slate-900 hover:bg-slate-50"
            >
              Home
            </a>
            <a
              href="#features"
              onClick={(e) => handleLinkClick(e, '#features')}
              className="rounded-md px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50"
            >
              Features
            </a>
            <a
              href="#about"
              onClick={(e) => handleLinkClick(e, '#about')}
              className="rounded-md px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50"
            >
              About
            </a>

            <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-slate-100">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('/dashboard');
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('/login');
                    }}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('/register');
                    }}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
