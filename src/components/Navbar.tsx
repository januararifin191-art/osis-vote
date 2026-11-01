import React, { useState } from 'react';
import {
  Vote,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  Award,
  BarChart3,
  HelpCircle,
  Clock,
  Sparkles,
  Lock
} from 'lucide-react';
import { Voter, ElectionSettings } from '../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentVoter: Voter | null;
  onLogoutVoter: () => void;
  settings: ElectionSettings | null;
  adminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentVoter,
  onLogoutVoter,
  settings,
  adminLoggedIn,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getStatusBadge = () => {
    if (!settings) return null;
    if (settings.status === 'ongoing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Sedang Berlangsung
        </span>
      );
    }
    if (settings.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
          <Clock className="w-3 h-3 text-blue-300" />
          Pemilihan Selesai
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <Clock className="w-3 h-3 text-amber-300" />
        Belum Dimulai
      </span>
    );
  };

  const navLinks = [
    { id: 'landing', label: 'Beranda' },
    { id: 'candidates', label: 'Pasangan Calon' },
    { id: 'results', label: 'Hasil Suara' },
    { id: 'guide', label: 'Panduan Voting' },
    { id: 'faq', label: 'Bantuan & FAQ' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0A192F]/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & School Name */}
          <div
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                <div className="w-full h-full bg-[#0B1A30] rounded-[10px] flex items-center justify-center overflow-hidden">
                  {settings?.schoolLogo ? (
                    <img
                      src={settings.schoolLogo}
                      alt={settings.schoolName || 'Logo Sekolah'}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Vote className="w-6 h-6 text-amber-400 group-hover:rotate-6 transition-transform" />
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[9px] font-black text-slate-950">
                ✓
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-amber-300 bg-clip-text text-transparent">
                  OSIS VOTE
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono tracking-tight bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {settings?.academicYear || '2026/2027'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
                {settings?.schoolName || 'SMA NEGERI 1 RAHAYU'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentView === link.id
                    ? 'text-amber-400 bg-amber-400/10 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <div className="hidden xl:block">{getStatusBadge()}</div>

            {currentVoter ? (
              <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5">
                <div className="text-right">
                  <p className="text-xs font-semibold text-white leading-tight">
                    {currentVoter.fullName}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
                    <span>{currentVoter.className}</span>
                    <span className="text-slate-600">•</span>
                    {currentVoter.hasVoted ? (
                      <span className="text-emerald-400 font-medium">Sudah Memilih</span>
                    ) : (
                      <span className="text-amber-400 font-medium">Belum Memilih</span>
                    )}
                  </p>
                </div>

                {!currentVoter.hasVoted && settings?.status === 'ongoing' && (
                  <button
                    onClick={() => onNavigate('voting')}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Vote className="w-3.5 h-3.5" />
                    Bilik Suara
                  </button>
                )}

                <button
                  onClick={onLogoutVoter}
                  title="Logout Pemilih"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" />
                Masuk Pemilih
              </button>
            )}

            {/* Admin Portal Shortcut */}
            <button
              onClick={() => onNavigate(adminLoggedIn ? 'admin-dashboard' : 'admin-login')}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                adminLoggedIn
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 hover:bg-amber-500/30 ring-2 ring-amber-400/20'
                  : 'bg-[#0B1E38] border-amber-500/40 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400'
              }`}
              title={adminLoggedIn ? 'Dashboard Admin OSIS' : 'Login Administrator (Panitia)'}
            >
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{adminLoggedIn ? 'Dashboard Admin' : 'Login Admin'}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {getStatusBadge()}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0A192F] border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentView === link.id
                    ? 'text-amber-400 bg-amber-400/10 font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            {currentVoter ? (
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-sm font-bold text-white">{currentVoter.fullName}</p>
                    <p className="text-xs text-slate-400">
                      {currentVoter.className} • NISN: {currentVoter.nisn}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      currentVoter.hasVoted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {currentVoter.hasVoted ? 'Sudah Memilih' : 'Belum Memilih'}
                  </span>
                </div>

                <div className="flex gap-2">
                  {!currentVoter.hasVoted && settings?.status === 'ongoing' && (
                    <button
                      onClick={() => {
                        onNavigate('voting');
                        setMobileMenuOpen(false);
                      }}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5"
                    >
                      <Vote className="w-4 h-4" />
                      Masuk Bilik Suara
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onLogoutVoter();
                      setMobileMenuOpen(false);
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs rounded-lg flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  onNavigate('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                Login Pemilih (Siswa)
              </button>
            )}

            <button
              onClick={() => {
                onNavigate(adminLoggedIn ? 'admin-dashboard' : 'admin-login');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              {adminLoggedIn ? 'Buka Dashboard Admin' : 'Login Administrator OSIS'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
