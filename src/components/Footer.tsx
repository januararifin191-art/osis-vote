import React from 'react';
import { Vote, ShieldCheck, Heart, Mail, Phone, MapPin, Award } from 'lucide-react';
import { ElectionSettings } from '../types';

interface FooterProps {
  settings: ElectionSettings | null;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate }) => {
  return (
    <footer className="bg-[#050D1A] border-t border-slate-800 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Motto */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-500 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-[#0B1A30] rounded-[10px] flex items-center justify-center overflow-hidden">
                  {settings?.schoolLogo ? (
                    <img
                      src={settings.schoolLogo}
                      alt={settings.schoolName || 'Logo'}
                      className="w-full h-full object-contain p-0.5"
                    />
                  ) : (
                    <Vote className="w-5 h-5 text-amber-400" />
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-wide">
                  OSIS VOTE
                </h3>
                <p className="text-xs text-amber-400 font-semibold">
                  E-Voting Pemilihan Ketua &amp; Wakil Ketua OSIS
                </p>
              </div>
            </div>

            <p className="text-slate-300 italic text-sm font-medium border-l-2 border-amber-400 pl-3">
              "{settings?.tagline || 'Satu Suara, Satu Perubahan, Masa Depan Sekolah, RAHAYU'}"
            </p>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Sistem pemilihan digital terenkripsi yang menjunjung tinggi asas <strong>LUBER JURDIL</strong> (Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil). Pilihan suara disimpan secara anonim tanpa mencatat identitas pemilih demi kerahasiaan hak suara.
            </p>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Enkripsi Suara Terverifikasi</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Anti Suara Ganda</span>
              </div>
            </div>
          </div>

          {/* Navigasi Cepat */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4 text-amber-300/90">
              Navigasi Halaman
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('landing')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Beranda Utama
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('candidates')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Daftar Pasangan Calon
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('voting')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Bilik Suara (Voting)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('results')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Hasil Pemilihan
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('guide')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Tata Cara &amp; Panduan Memilih
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('faq')}
                  className="hover:text-amber-400 transition-colors"
                >
                  FAQ &amp; Bantuan
                </button>
              </li>
              <li className="pt-1">
                <button
                  onClick={() => onNavigate('admin-login')}
                  className="text-amber-400 font-bold hover:underline flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Portal Administrator (Panitia)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Kontak Panitia */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4 text-amber-300/90">
              Sekretariat Panitia
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{settings?.schoolAddress || 'Sekretariat OSIS / MPK SMA Negeri 1 Rahayu'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{settings?.contactPhone || '+62 821-2345-6789 (Helpdesk)'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">{settings?.contactEmail || 'panitia.evoting@sman1rahayu.sch.id'}</span>
              </div>
              <div className="pt-2">
                <p className="text-[11px] text-slate-500">
                  Pembina OSIS &amp; Panitia Pemilihan Umum Siswa (PPU)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} OSIS {settings?.schoolName || 'SMA NEGERI 1 RAHAYU'}. Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Dikelola secara mandiri &amp; amanah demi masa depan sekolah yang</span>
            <span className="font-semibold text-amber-400">RAHAYU</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
