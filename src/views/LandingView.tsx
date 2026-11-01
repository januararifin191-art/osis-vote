import React, { useState } from 'react';
import {
  Vote,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Users,
  Award,
  Bell,
  CheckCircle,
  HelpCircle,
  Clock,
  FileText,
  BarChart2
} from 'lucide-react';
import { Candidate, ElectionSettings, Voter, Announcement } from '../types';
import { CountdownTimer } from '../components/CountdownTimer';
import { CandidateCard } from '../components/CandidateCard';
import { CandidateDetailModal } from '../components/CandidateDetailModal';
import { GuideModal } from '../components/GuideModal';
import { FAQSection } from '../components/FAQSection';
import { ContactSection } from '../components/ContactSection';

interface LandingViewProps {
  settings: ElectionSettings | null;
  candidates: Candidate[];
  announcements: Announcement[];
  totalVotersCount: number;
  currentVoter: Voter | null;
  onNavigate: (view: string) => void;
  onSelectCandidateToVote?: (candidate: Candidate) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  settings,
  candidates,
  announcements,
  totalVotersCount,
  currentVoter,
  onNavigate,
  onSelectCandidateToVote,
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const getStatusDisplay = () => {
    if (!settings) return null;
    if (settings.status === 'ongoing') {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          Bilik Suara: SEDANG BERLANGSUNG
        </span>
      );
    }
    if (settings.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
          <Clock className="w-4 h-4 text-blue-300" />
          Status: PEMILIHAN RESMI SELESAI
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
        <Clock className="w-4 h-4 text-amber-300" />
        Status: BELUM DIMULAI (Segera Dibuka)
      </span>
    );
  };

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:py-20 bg-gradient-to-b from-[#09172A] via-[#0B1E38] to-[#071322] border-b border-slate-800">
        {/* Glow ambient background accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-blue-600/20 via-amber-500/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Top Status & Year Pill */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {getStatusDisplay()}
            <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700">
              Periode {settings?.academicYear || '2026/2027'}
            </span>
          </div>

          {/* School & Application Title */}
          <div className="space-y-3 max-w-4xl mx-auto flex flex-col items-center">
            {settings?.schoolLogo && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#0B1A30] border-2 border-amber-400/50 p-2 shadow-xl shadow-amber-500/10 mb-1 flex items-center justify-center overflow-hidden">
                <img
                  src={settings.schoolLogo}
                  alt={settings.schoolName || 'Logo Sekolah'}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <p className="text-xs sm:text-sm uppercase tracking-widest font-black text-amber-400">
              {settings?.schoolName || 'SMA NEGERI 1 RAHAYU'}
            </p>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              PEMILIHAN KETUA &amp; <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                WAKIL KETUA OSIS
              </span>
            </h1>
            <p className="text-base sm:text-xl text-slate-300 italic font-medium max-w-2xl mx-auto">
              "{settings?.tagline || 'Satu Suara, Satu Perubahan, Masa Depan Sekolah, RAHAYU'}"
            </p>
          </div>

          {/* Live Countdown Timer */}
          {settings && (
            <div className="flex justify-center pt-2">
              <CountdownTimer
                targetDate={settings.status === 'upcoming' ? settings.startTime : settings.endTime}
                status={settings.status}
              />
            </div>
          )}

          {/* Core Call-to-Actions (MULAI MEMILIH, LIHAT KANDIDAT, PANDUAN) */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-4">
            <button
              onClick={() => {
                if (currentVoter) {
                  onNavigate('voting');
                } else {
                  onNavigate('login');
                }
              }}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm sm:text-base shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
            >
              <Vote className="w-5 h-5 text-slate-950" />
              <span>MULAI MEMILIH</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => onNavigate('candidates')}
              className="px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm sm:text-base border border-slate-700/80 hover:border-amber-400/50 shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Award className="w-5 h-5 text-amber-400" />
              <span>LIHAT KANDIDAT</span>
            </button>

            <button
              onClick={() => setShowGuide(true)}
              className="px-5 py-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm border border-slate-800 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>TATA CARA VOTING</span>
            </button>

            {settings?.isResultsPublished && (
              <button
                onClick={() => onNavigate('results')}
                className="px-5 py-4 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all"
              >
                <BarChart2 className="w-4 h-4 text-blue-400" />
                <span>LIHAT HASIL SUARA</span>
              </button>
            )}
          </div>

          {/* Quick Metrics Cards */}
          <div className="pt-8 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total DPT Siswa</span>
              <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{totalVotersCount} Pemilih</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Jumlah Paslon</span>
              <p className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">{candidates.length} Pasang</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Sistem Keamanan</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">Luber Jurdil</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Metode Verifikasi</span>
              <p className="text-xl sm:text-2xl font-black text-blue-400 mt-0.5">NISN &amp; Token</p>
            </div>
          </div>
        </div>
      </section>

      {/* ANNOUNCEMENT BANNER */}
      {announcements.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-950/60 via-[#0B1A30] to-blue-950/60 border border-blue-500/30 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                Pengumuman Resmi Panitia Pemilihan (PPO)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-slate-400">{ann.date}</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          ann.priority === 'urgent'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : ann.priority === 'important'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {ann.priority}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-white leading-snug">{ann.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{ann.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CANDIDATES SHOWCASE SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Kandidat Pemimpin Masa Depan
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Pasangan Calon Ketua &amp; Wakil Ketua OSIS
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Kenali profil, visi, misi, dan program kerja unggulan dari setiap pasangan calon sebelum menentukan suara Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((cand) => (
            <CandidateCard
              key={cand.id}
              candidate={cand}
              onViewDetails={(c) => setSelectedCandidate(c)}
              onSelectVote={onSelectCandidateToVote}
              isVotingMode={false}
            />
          ))}
        </div>

        <div className="text-center pt-4">
          <button
            onClick={() => onNavigate('candidates')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400/40 text-amber-400 hover:text-amber-300 font-bold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <span>Bandingkan Visi &amp; Program Seluruh Paslon</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 4 STEPS INFOGRAPHIC */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-[#0B1E38] to-[#081525] border border-amber-500/20 rounded-3xl p-6 sm:p-10 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Mudah, Cepat, dan Transparan
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-white">
              Alur Pelaksanaan E-Voting OSIS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-2xl font-black text-amber-400 font-mono">01</span>
              <h4 className="text-sm font-bold text-white">Buka OSIS VOTE</h4>
              <p className="text-xs text-slate-400">Akses aplikasi melalui gawai HP, tablet, atau komputer di bilik lab.</p>
            </div>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-2xl font-black text-amber-400 font-mono">02</span>
              <h4 className="text-sm font-bold text-white">Login Siswa (NISN)</h4>
              <p className="text-xs text-slate-400">Masukkan nomor NISN dan kode akses rahasia dari panitia.</p>
            </div>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-2xl font-black text-amber-400 font-mono">03</span>
              <h4 className="text-sm font-bold text-white">Pilih Paslon Idaman</h4>
              <p className="text-xs text-slate-400">Tentukan 1 pasangan calon dan lakukan konfirmasi pilihan suara.</p>
            </div>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-2xl font-black text-amber-400 font-mono">04</span>
              <h4 className="text-sm font-bold text-white">Simpan Tanda Terima</h4>
              <p className="text-xs text-slate-400">Suara tercatat secara anonim dan Anda menerima bukti digital resmi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FAQSection />
      </section>

      {/* CONTACT SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ContactSection settings={settings} />
      </section>

      {/* CANDIDATE DETAIL MODAL */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        isVotingMode={false}
      />

      {/* GUIDE MODAL */}
      {showGuide && (
        <GuideModal
          onClose={() => setShowGuide(false)}
          onStartVoting={() => {
            if (currentVoter) {
              onNavigate('voting');
            } else {
              onNavigate('login');
            }
          }}
        />
      )}
    </div>
  );
};
