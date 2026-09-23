import React from 'react';
import { Shield } from 'lucide-react';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand info */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                <Shield className="h-4 w-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                SecureShare
              </span>
            </div>
            <p className="max-w-md text-sm text-slate-400 leading-relaxed">
              Secure file storage, folder organization, and controlled file sharing with database-backed authentication, expiry controls, and instant link revocation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/')}
                  className="text-slate-400 transition-colors hover:text-white cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/');
                    setTimeout(() => {
                      document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className="text-slate-400 transition-colors hover:text-white cursor-pointer"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/');
                    setTimeout(() => {
                      document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className="text-slate-400 transition-colors hover:text-white cursor-pointer"
                >
                  About
                </a>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/login')}
                  className="text-slate-400 transition-colors hover:text-white cursor-pointer"
                >
                  Login
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/register')}
                  className="text-slate-400 transition-colors hover:text-white cursor-pointer"
                >
                  Get Started
                </button>
              </li>
            </ul>
          </div>

          {/* Project Details */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Project Details
            </h3>
            <div className="mt-4 space-y-2 text-sm text-slate-400">
              <p className="font-medium text-slate-300">BSc Computer Science</p>
              <p>Semester 5 Project</p>
              <div className="pt-2">
                <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-1 text-xs text-blue-400 border border-slate-700">
                  Secure File Storage &amp; Sharing
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© SecureShare · BSc CS Semester 5 Project</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Filesystem Storage</span>
            <span>·</span>
            <span>PostgreSQL Metadata</span>
            <span>·</span>
            <span>Controlled Sharing</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
