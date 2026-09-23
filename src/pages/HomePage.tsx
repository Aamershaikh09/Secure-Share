import React from 'react';
import {
  Shield,
  FolderTree,
  Search,
  Share2,
  Lock,
  Clock,
  Ban,
  HardDrive,
  CheckCircle2,
  ArrowRight,
  Server,
  UserCheck,
  LayoutDashboard,
  FileCheck2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  onNavigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      title: 'Secure File Storage',
      desc: 'Store files on the server filesystem while PostgreSQL stores file metadata.',
      icon: Shield,
    },
    {
      title: 'File Organization',
      desc: 'Organize files into folders and manage them easily.',
      icon: FolderTree,
    },
    {
      title: 'Secure Sharing',
      desc: 'Generate controlled share links with cryptographically secure random tokens.',
      icon: Share2,
    },
    {
      title: 'Password Protection',
      desc: 'Protect sensitive shared files with an additional password.',
      icon: Lock,
    },
    {
      title: 'Link Expiry',
      desc: 'Automatically expire shared links after a configured period.',
      icon: Clock,
    },
    {
      title: 'Revocation',
      desc: 'Revoke a previously created share at any time.',
      icon: Ban,
    },
    {
      title: 'Search',
      desc: 'Find files quickly across your entire vault.',
      icon: Search,
    },
    {
      title: 'Storage Management',
      desc: 'Monitor used and available storage in real time against your account quota.',
      icon: HardDrive,
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Create an Account',
      desc: 'Register with your name, email, and password, then verify your email address to activate your vault.',
    },
    {
      step: '02',
      title: 'Upload and Organize',
      desc: 'Upload files to the secure server filesystem and organize them neatly into custom folders.',
    },
    {
      step: '03',
      title: 'Create a Secure Link',
      desc: 'Generate a controlled share link with optional passphrase protection and expiration time.',
    },
    {
      step: '04',
      title: 'Share or Revoke',
      desc: 'Distribute your secure link to recipients and revoke access instantly whenever needed.',
    },
  ];

  const securityFeatures = [
    {
      title: 'PBKDF2 Password Hashing',
      desc: 'Passwords are salted with 16 cryptographic random bytes and hashed with 100,000 iterations using PBKDF2-SHA512.',
      icon: KeyRound,
    },
    {
      title: 'Email Verification',
      desc: 'Accounts require cryptographic email verification with 256-bit hashed tokens that expire in 24 hours.',
      icon: UserCheck,
    },
    {
      title: 'Database-Backed Sessions',
      desc: 'Stateful sessions are stored securely in PostgreSQL with time-to-live expiration and instant logout revocation.',
      icon: Server,
    },
    {
      title: 'Ownership-Based Authorization',
      desc: 'Every file, folder, and share operation strictly verifies ownership to prevent unauthorized access across users.',
      icon: ShieldCheck,
    },
    {
      title: 'Path Traversal Protection',
      desc: 'Storage paths are resolved within a strictly isolated server directory, preventing directory traversal attacks.',
      icon: FileCheck2,
    },
    {
      title: 'Streamed File Delivery',
      desc: 'Files are streamed directly from server filesystem storage with content validation, avoiding Base64 overhead.',
      icon: HardDrive,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar onNavigate={onNavigate} />

      <main className="flex-1">
        {/* Compact, Text-Focused Hero Section (NO AI IMAGES) */}
        <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Project Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-xs mb-6">
              <Shield className="h-3.5 w-3.5" />
              <span>SECURESHARE · BSc CS Semester 5 Project</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Your Files.{' '}
              <span className="text-blue-600">Your Control.</span>{' '}
              Your Security.
            </h1>

            {/* Supporting Text */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              SecureShare provides secure file storage, organization and controlled sharing with features such as authentication, protected file access, password-protected sharing, expiry and revocation.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              {isAuthenticated ? (
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('/register')}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onNavigate('/login')}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Login
                  </button>
                </>
              )}
            </div>

            {/* 3 Pillars */}
            <div className="mt-12 pt-8 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Secure Storage</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>File Organization</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Controlled Sharing</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 sm:py-20 bg-white border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Core Capabilities
              </h2>
              <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Engineered for File Privacy and Control
              </h3>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                Real features built with server-side filesystem storage, PostgreSQL metadata, and controlled sharing with optional password protection, expiry and revocation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mb-2">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Simple Workflow
              </h2>
              <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                How SecureShare Works
              </h3>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                A streamlined 4-step workflow to store, organize, share, and protect your digital files.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs relative"
                >
                  <span className="text-2xl font-black text-blue-600/30 font-mono block mb-3">
                    {item.step}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mb-2">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section (Factual, No Hype) */}
        <section className="py-16 sm:py-20 bg-white border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Architecture &amp; Hardening
              </h2>
              <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Implemented Security Architecture
              </h3>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                Every layer of the application is designed to protect user identity, credentials, file binaries, and public share links.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {securityFeatures.map((sec, idx) => {
                const IconComponent = sec.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 transition-all hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100/70 text-blue-700 mb-4">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">
                      {sec.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {sec.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    About SecureShare
                  </h3>
                  <p className="text-xs text-blue-600 font-medium">
                    BSc Computer Science Semester 5 Project
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                SecureShare is a BSc CS Semester 5 project focused on secure file storage, organization and controlled file sharing.
              </p>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                The application decouples file metadata from binary storage: PostgreSQL stores user credentials, session states, folder hierarchies, and share parameters, while actual file binaries reside in an isolated server directory with cryptographic random filenames. Public file access is gated by expiring tokens, optional passphrases, and instant owner revocation.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Ready to manage your files securely?
            </h3>
            <p className="mt-3 text-sm text-slate-600 max-w-xl mx-auto">
              Create an account to upload, organize, and share documents with complete privacy and control.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('/register')}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onNavigate('/login')}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Login
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
