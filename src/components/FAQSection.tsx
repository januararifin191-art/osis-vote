import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Shield, Key, Eye, UserCheck } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Bagaimana cara menjamin pilihan suara saya bersifat rahasia (Luber Jurdil)?',
      a: 'Sistem OSIS VOTE memisahkan autentikasi pemilih dan data kotak suara. Identitas pemilih (NISN) hanya digunakan untuk menandai bahwa siswa telah menggunakan hak suaranya agar tidak terjadi suara ganda. Data suara disimpan secara anonim tanpa identitas pemilih, sehingga panitia, guru, bahkan administrator database tidak dapat mengetahui paslon mana yang Anda pilih.',
      icon: Shield,
    },
    {
      q: 'Bagaimana jika saya lupa atau kehilangan PIN / Kode Akses Pemilih?',
      a: 'Silakan datangi Posko Bantuan Panitia Pemilihan (PPO) di Ruang Laboratorium Komputer atau hubungi panitia via WhatsApp resmi dengan menunjukkan kartu pelajar aktif untuk verifikasi identitas.',
      icon: Key,
    },
    {
      q: 'Bisakah saya mengubah pilihan saya setelah menekan tombol "Ya, Kintun Suara"?',
      a: 'Tidak bisa. Sesuai tata tertib pemilihan umum OSIS, suara yang telah dikirim bersifat final, mengikat, dan tidak dapat dibatalkan atau diubah.',
      icon: Eye,
    },
    {
      q: 'Kapan hasil perolehan suara dapat dilihat oleh siswa?',
      a: 'Hasil perolehan suara hanya akan ditampilkan setelah masa pemilihan resmi ditutup dan tombol publikasi hasil diaktifkan oleh Administrator Panitia. Ini bertujuan untuk menjaga independensi pemilih agar tidak terpengaruh oleh tren suara sementara.',
      icon: UserCheck,
    },
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="text-center mb-8 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Tanya Jawab Seputar Pemilihan
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Pertanyaan Yang Sering Diajukan (FAQ)
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Informasi lengkap mengenai sistem e-voting, kerahasiaan data, dan prosedur pemilihan OSIS.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          const Icon = faq.icon;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'bg-[#0B1A30] border-amber-500/40 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isOpen
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                    {faq.q}
                  </h3>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-amber-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
