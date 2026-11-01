import React from 'react';
import { X, Key, CheckCircle, Shield, Award, HelpCircle } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
  onStartVoting: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose, onStartVoting }) => {
  const steps = [
    {
      step: '01',
      title: 'Dapatkan Kode Akses',
      desc: 'Siapkan Nomor Induk Siswa Nasional (NISN) dan 6-digit kode akses/PIN yang dibagikan oleh Panitia Pemilihan (PPO) atau Wali Kelas.',
      icon: Key,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      step: '02',
      title: 'Pelajari Visi & Misi Paslon',
      desc: 'Klik tombol "Lihat Profil" pada setiap kandidat untuk mencermati visi, program kerja, dan arah kepemimpinan mereka.',
      icon: Award,
      color: 'from-amber-500 to-amber-600',
    },
    {
      step: '03',
      title: 'Masuk ke Bilik Suara',
      desc: 'Login menggunakan NISN dan PIN Anda. Sistem akan memeriksa keabsahan status Anda di Daftar Pemilih Tetap (DPT).',
      icon: Shield,
      color: 'from-teal-500 to-emerald-600',
    },
    {
      step: '04',
      title: 'Kintun Suara & Simpan Bukti',
      desc: 'Pilih pasangan calon idaman Anda, konfirmasi dengan tombol "Ya, Kintun Suara". Dapatkan kode tanda terima digital rahasia.',
      icon: CheckCircle,
      color: 'from-indigo-600 to-purple-600',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0B1A30] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-white my-6">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#0C1E38] to-[#0A1728] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Tata Cara &amp; Panduan Memilih</h3>
              <p className="text-xs text-slate-400">Ikuti 4 langkah mudah menyalurkan hak suara Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {steps.map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.step}
                  className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-r ${st.color} flex items-center justify-center text-white font-bold text-xs shadow-md`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                        Langkah {st.step}
                      </span>
                      <h4 className="text-sm font-bold text-white">{st.title}</h4>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl text-xs text-amber-300 space-y-1">
            <p className="font-bold">Ketentuan Penting:</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
              <li>Setiap siswa hanya memiliki 1 (satu) hak suara yang tidak dapat dialihkan.</li>
              <li>Jangan berikan kode akses atau PIN Anda kepada siapapun.</li>
              <li>Bilik suara akan tertutup otomatis saat tenggat waktu berakhir.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-[#081324] border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
          >
            Tutup Panduan
          </button>
          <button
            onClick={() => {
              onClose();
              onStartVoting();
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-bold hover:from-amber-400 hover:to-amber-500 shadow-md shadow-amber-500/20"
          >
            Mulai Memilih Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};
