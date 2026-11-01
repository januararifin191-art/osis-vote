import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { electionStore } from '../services/store';

interface AdminLoginViewProps {
  onLoginSuccess: () => void;
  onNavigate: (view: string) => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLoginSuccess, onNavigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = electionStore.verifyAdmin(username, password);
    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || 'Username atau Password Administrator tidak cocok. Gunakan kredensial panitia yang sah.');
    }
  };

  const fillQuickAdmin = (u = 'admin', p = 'adminosis2026') => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="bg-[#0B1A30] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-700 p-0.5 mx-auto shadow-xl shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#081525] rounded-[14px] flex items-center justify-center">
              <Shield className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white">Portal Administrator OSIS</h2>
          <p className="text-xs text-slate-400">
            Khusus Panitia Pemilihan Organisasi (PPO) dan Pembina OSIS
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
              Username Admin
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#071324] border border-slate-700 focus:border-amber-400 text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Kata Sandi Admin
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#071324] border border-slate-700 focus:border-amber-400 text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            <span>Masuk Dashboard Admin</span>
          </button>
        </form>

        <div className="border-t border-slate-800 pt-3 text-center">
          <button
            onClick={() => onNavigate('landing')}
            className="text-xs text-slate-400 hover:text-white"
          >
            ← Kembali ke Halaman Utama Pemilih
          </button>
        </div>
      </div>

      {/* Quick Testing helper */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Akun Login Default (Uji Coba):
          </span>
          <span className="text-[10px] text-slate-400">Klik untuk isi otomatis</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillQuickAdmin('admin', 'adminosis2026')}
            className="p-2 rounded-xl bg-[#071324] hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 text-left transition-colors cursor-pointer"
          >
            <p className="font-bold text-white text-[11px]">Super Admin</p>
            <p className="text-[10px] text-slate-400 font-mono">admin</p>
            <span className="text-[9px] text-amber-400 font-medium">Akses Penuh</span>
          </button>

          <button
            type="button"
            onClick={() => fillQuickAdmin('panitia', 'panitia2026')}
            className="p-2 rounded-xl bg-[#071324] hover:bg-slate-800 border border-slate-700 hover:border-sky-400/50 text-left transition-colors cursor-pointer"
          >
            <p className="font-bold text-white text-[11px]">Panitia PPO</p>
            <p className="text-[10px] text-slate-400 font-mono">panitia</p>
            <span className="text-[9px] text-sky-400 font-medium">Operasional</span>
          </button>

          <button
            type="button"
            onClick={() => fillQuickAdmin('pembina', 'pembina2026')}
            className="p-2 rounded-xl bg-[#071324] hover:bg-slate-800 border border-slate-700 hover:border-emerald-400/50 text-left transition-colors cursor-pointer"
          >
            <p className="font-bold text-white text-[11px]">Pembina OSIS</p>
            <p className="text-[10px] text-slate-400 font-mono">pembina</p>
            <span className="text-[9px] text-emerald-400 font-medium">Pengawas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
