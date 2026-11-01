import React from 'react';
import { Mail, Phone, MapPin, MessageSquare, Clock, ShieldAlert } from 'lucide-react';
import { ElectionSettings } from '../types';

interface ContactSectionProps {
  settings: ElectionSettings | null;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Pusat Bantuan &amp; Helpdesk
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Hubungi Panitia Pemilihan (PPO)
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Mengalami kendala saat login atau butuh panduan teknis? Tim panitia dan pembina OSIS siap membantu Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Posko Fisik */}
        <div className="bg-[#0B1A30] border border-slate-800 hover:border-amber-500/30 p-5 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Posko Bilik Suara</h4>
            <p className="text-xs text-slate-400 mt-1">
              {settings?.schoolAddress || 'Lab Komputer 1 & Ruang Sekretariat OSIS'}
            </p>
          </div>
          <span className="inline-block text-[11px] text-amber-300 font-medium">
            Buka pukul 07.30 - 15.00 WIB
          </span>
        </div>

        {/* WhatsApp Helpdesk */}
        <div className="bg-[#0B1A30] border border-slate-800 hover:border-amber-500/30 p-5 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Layanan WhatsApp</h4>
            <p className="text-xs text-slate-400 mt-1">
              {settings?.contactPhone || '+62 821-2345-6789'}
            </p>
          </div>
          <span className="inline-block text-[11px] text-emerald-400 font-medium">
            Respon Cepat Panitia
          </span>
        </div>

        {/* Email Resmi */}
        <div className="bg-[#0B1A30] border border-slate-800 hover:border-amber-500/30 p-5 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Email Sekretariat</h4>
            <p className="text-xs text-slate-400 mt-1 truncate">
              {settings?.contactEmail || 'panitia.evoting@sman1rahayu.sch.id'}
            </p>
          </div>
          <span className="inline-block text-[11px] text-purple-300 font-medium">
            Laporan Tertulis &amp; Aduan
          </span>
        </div>
      </div>

      <div className="bg-[#071324] border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">
              Laporkan Pelanggaran Kampanye / Kendala Integritas
            </h4>
            <p className="text-xs text-slate-400">
              Pengawas Pemilihan (MPK) menjamin kerahasiaan identitas pelapor.
            </p>
          </div>
        </div>
        <a
          href={`mailto:${settings?.contactEmail || 'panitia.evoting@sman1rahayu.sch.id'}?subject=Laporan Kendala Pemilihan OSIS`}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
        >
          Kirim Laporan
        </a>
      </div>
    </div>
  );
};
