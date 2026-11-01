import React, { useState } from 'react';
import { User, Key, Shield, ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import { Voter, ElectionSettings } from '../types';
import { electionStore } from '../services/store';

interface VoterLoginViewProps {
  currentVoter: Voter | null;
  settings: ElectionSettings | null;
  onLoginSuccess: (voter: Voter) => void;
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

export const VoterLoginView: React.FC<VoterLoginViewProps> = ({
  currentVoter,
  settings,
  onLoginSuccess,
  onLogout,
  onNavigate,
}) => {
  const [nisn, setNisn] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisn.trim()) {
      setError('Silakan masukkan NISN Anda.');
      return;
    }
    if (!passcode.trim()) {
      setError('Silakan masukkan PIN / Kode Akses Anda.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await electionStore.authenticateVoter(nisn, passcode);
      if (res.success && res.voter) {
        onLoginSuccess(res.voter);
      } else {
        setError(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat login.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Account Clicker
  const fillDemoAccount = (demoNisn: string, demoPass: string) => {
    setNisn(demoNisn);
    setPasscode(demoPass);
    setError(null);
  };

  // If already logged in, show Voter Profile & Status
  if (currentVoter) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-[#0B1A30] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">Profil Pemilih Aktif</h2>
            <p className="text-xs text-slate-400">Terdaftar di Daftar Pemilih Tetap (DPT)</p>
          </div>

          <div className="bg-[#071324] p-5 rounded-2xl border border-slate-800 space-y-3 text-sm">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-400 text-xs">Nama Lengkap</span>
              <span className="font-bold text-white">{currentVoter.fullName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-400 text-xs">Kelas</span>
              <span className="font-bold text-white">{currentVoter.className}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-400 text-xs">NISN</span>
              <span className="font-mono text-amber-400 font-semibold">{currentVoter.nisn}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-400 text-xs">Status Hak Suara</span>
              {currentVoter.hasVoted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sudah Menggunakan Hak Suara
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Belum Memilih
                </span>
              )}
            </div>
          </div>

          {currentVoter.hasVoted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-xs text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Terima Kasih Atas Partisipasi Anda</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Hak suara Anda telah tersimpan secara anonim pada sistem. Tanda terima: <strong className="text-amber-400 font-mono">{currentVoter.receiptCode || 'VOTE-VERIFIED'}</strong>. Anda tidak dapat melakukan pemilihan ganda.
              </p>
            </div>
          ) : settings?.status === 'ongoing' ? (
            <button
              onClick={() => onNavigate('voting')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Lanjutkan ke Bilik Suara</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <p className="text-xs text-center text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              Bilik suara saat ini belum dibuka atau telah selesai.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onLogout}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Logout dari Akun Ini
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-6">
      {/* Login Card */}
      <div className="bg-[#0B1A30] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 mx-auto shadow-lg shadow-indigo-600/30 flex items-center justify-center">
            <div className="w-full h-full bg-[#081424] rounded-[14px] flex items-center justify-center">
              <User className="w-7 h-7 text-amber-400" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white">Login Pemilih Siswa</h2>
          <p className="text-xs text-slate-400">
            Masukkan Nomor Induk Siswa Nasional (NISN) dan Kode Akses dari Panitia
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Nomor Induk Siswa Nasional (NISN)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Contoh: 0071234501"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                className="w-full bg-[#071324] border border-slate-700 focus:border-amber-400 text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none font-mono transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Kode Akses / PIN Panitia
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="6-digit PIN kartu pemilih"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-[#071324] border border-slate-700 focus:border-amber-400 text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none font-mono transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk ke Bilik Suara</span>
              </>
            )}
          </button>
        </form>

        <div className="border-t border-slate-800/80 pt-4 flex flex-col items-center gap-2 text-center">
          <p className="text-[11px] text-slate-400">
            Lupa kode akses atau belum terdaftar? Hubungi{' '}
            <button
              onClick={() => onNavigate('contact')}
              className="text-amber-400 underline hover:text-amber-300 cursor-pointer"
            >
              Panitia PPO
            </button>
          </p>

          <div className="pt-2 w-full">
            <button
              type="button"
              onClick={() => onNavigate('admin-login')}
              className="w-full py-2 px-3 bg-[#071324] hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 rounded-xl text-xs font-semibold text-slate-300 hover:text-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Login Khusus Panitia / Administrator</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK TESTING CARD: Preset Demo Accounts */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
          <Sparkles className="w-4 h-4" />
          <span>Akun Demo Untuk Uji Coba Cepat (Klik untuk Isi):</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => fillDemoAccount('0071234501', '123456')}
            className="p-2.5 rounded-xl bg-[#0B1A30] hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 text-left transition-all"
          >
            <p className="font-bold text-white text-xs">Aditya Pratama (X A 1)</p>
            <p className="text-[11px] text-slate-400 font-mono">NISN: 0071234501 | PIN: 123456</p>
            <span className="text-[10px] text-emerald-400 font-medium">Status: Belum Memilih</span>
          </button>

          <button
            type="button"
            onClick={() => fillDemoAccount('0071234502', '234567')}
            className="p-2.5 rounded-xl bg-[#0B1A30] hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 text-left transition-all"
          >
            <p className="font-bold text-white text-xs">Anisa Citra (X A 2)</p>
            <p className="text-[11px] text-slate-400 font-mono">NISN: 0071234502 | PIN: 234567</p>
            <span className="text-[10px] text-emerald-400 font-medium">Status: Belum Memilih</span>
          </button>

          <button
            type="button"
            onClick={() => fillDemoAccount('0071234504', '456789')}
            className="p-2.5 rounded-xl bg-[#0B1A30] hover:bg-slate-800 border border-slate-700 hover:border-rose-400/50 text-left transition-all sm:col-span-2"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-white text-xs">Cantika Putri (XI B 1)</p>
                <p className="text-[11px] text-slate-400 font-mono">NISN: 0071234504 | PIN: 456789</p>
              </div>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-medium">
                (Sudah Memilih - Uji Blokir Suara Ganda)
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
