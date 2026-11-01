import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Trophy,
  Users,
  CheckCircle2,
  Lock,
  Maximize,
  Minimize,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Award,
  Vote,
  TrendingUp,
  Layers
} from 'lucide-react';
import { Candidate, ElectionSettings, Voter } from '../types';
import { electionStore } from '../services/store';

interface ResultsViewProps {
  settings: ElectionSettings | null;
  currentVoter: Voter | null;
  adminLoggedIn: boolean;
  onNavigate: (view: string) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  settings,
  currentVoter,
  adminLoggedIn,
  onNavigate,
}) => {
  const [resultsData, setResultsData] = useState<{
    totalVoters: number;
    totalVotes: number;
    unvotedCount: number;
    participationRate: number;
    candidates: (Candidate & { voteCount: number; percentage: number; rank: number })[];
    isPublished: boolean;
    canViewPublicly: boolean;
  } | null>(null);

  const [votersList, setVotersList] = useState<Voter[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    setIsLoading(true);
    try {
      const [res, allVoters] = await Promise.all([
        electionStore.getResults(),
        electionStore.getVoters(),
      ]);
      setResultsData(res);
      setVotersList(allVoters);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-300 text-sm font-semibold">Menghitung dan memverifikasi rekapitulasi suara...</p>
      </div>
    );
  }

  // Check if results are restricted for the public
  const canView = adminLoggedIn || resultsData?.canViewPublicly;

  if (!canView) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-[#0B1A30] border-2 border-amber-500/30 p-8 rounded-3xl space-y-5 text-white shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
              Kerahasiaan Suara Terjaga
            </span>
            <h2 className="text-2xl sm:text-3xl font-black">
              Hasil Belum Dipublikasikan
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Untuk menjaga independensi pemilih dan asas Luber Jurdil, perolehan suara sementara dirahasiakan hingga pemilihan resmi ditutup dan dipublikasikan oleh Panitia Pemilihan (PPO).
          </p>

          <div className="p-4 bg-[#071324] rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1 text-left">
            <div className="flex items-center gap-2 text-white font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Ketentuan Publikasi:</span>
            </div>
            <p>1. Bilik suara telah mencapai batas waktu selesai.</p>
            <p>2. Berita Acara Rekapitulasi telah ditandatangani oleh saksi masing-masing Paslon.</p>
            <p>3. Tombol "Publikasikan Hasil" diaktifkan oleh Administrator.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => onNavigate('landing')}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </button>
            <button
              onClick={() => onNavigate('admin-login')}
              className="flex-1 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors cursor-pointer"
            >
              Login Administrator OSIS
            </button>
          </div>
        </div>
      </div>
    );
  }

  const winner = resultsData?.candidates[0];

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 ${isFullscreen ? 'bg-[#060F1E] min-h-screen' : ''}`}>
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Hasil Resmi Rekapitulasi Suara
            </span>
            {adminLoggedIn && !resultsData?.isPublished && (
              <span className="text-xs font-bold text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-500/40">
                Mode Pratinjau Admin (Belum Terbit ke Publik)
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            Perolehan Suara Pemilihan OSIS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {settings?.schoolName || 'SMA NEGERI 1 RAHAYU'} • Periode {settings?.academicYear || '2026/2027'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Layar Penuh untuk Proyektor / Aula"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Keluar Fullscreen' : 'Mode Layar Penuh'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak Berita Acara</span>
          </button>

          <button
            onClick={loadResults}
            className="px-3.5 py-2.5 bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 text-xs font-bold rounded-xl border border-blue-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0B1A30] border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Total Suara Masuk</span>
            <Vote className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono">
            {resultsData?.totalVotes} <span className="text-sm font-normal text-slate-400">suara</span>
          </p>
          <p className="text-[11px] text-emerald-400">Tersimpan secara terenkripsi</p>
        </div>

        <div className="bg-[#0B1A30] border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Daftar Pemilih (DPT)</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono">
            {resultsData?.totalVoters} <span className="text-sm font-normal text-slate-400">siswa</span>
          </p>
          <p className="text-[11px] text-slate-400">{(resultsData?.unvotedCount || 0).toLocaleString('id-ID')} siswa menunggu giliran</p>
        </div>

        <div className="bg-[#0B1A30] border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Tingkat Partisipasi</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            {resultsData?.participationRate}%
          </p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, resultsData?.participationRate || 0)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-[#0B1A30] border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Status Publikasi</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-lg font-black text-white mt-1">
            {resultsData?.isPublished ? 'Terbuka Untuk Siswa' : 'Tertutup (Khusus Panitia)'}
          </p>
          <p className="text-[11px] text-purple-300">
            {settings?.status === 'completed' ? 'Pemilihan Berakhir' : 'Pemilihan Berjalan'}
          </p>
        </div>
      </div>

      {/* HIGHLIGHT WINNER CARD (If has votes and election completed or results published) */}
      {winner && winner.voteCount > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-950/40 via-[#0E2344] to-[#0A1A30] border-2 border-amber-400/60 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 p-1 shadow-xl shrink-0">
                <img
                  src={winner.photoUrl}
                  alt={winner.chairmanName}
                  className="w-full h-full object-cover rounded-[14px]"
                />
              </div>
              <div className="absolute -top-2 -left-2 w-7 h-7 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center font-black text-xs shadow-md">
                👑
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Perolehan Suara Terbanyak (Ranking #1)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Paslon 0{winner.candidateNumber}: {winner.chairmanName} &amp; {winner.viceChairmanName}
              </h2>
              <p className="text-xs text-slate-300">
                Kelas: {winner.chairmanClass} &amp; {winner.viceChairmanClass} • "{winner.tagline}"
              </p>
            </div>
          </div>

          <div className="text-center md:text-right bg-[#071324] border border-amber-500/30 px-6 py-4 rounded-2xl shrink-0 min-w-[160px]">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Suara</span>
            <p className="text-3xl font-black text-amber-400 font-mono">{winner.voteCount}</p>
            <span className="text-xs font-bold text-slate-200">{winner.percentage}% dari suara masuk</span>
          </div>
        </div>
      )}

      {/* GRAPHICAL BAR CHART VISUALIZATION */}
      <div className="bg-[#0B1A30] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-white">
              Diagram Batang Perolehan Suara Kandidat
            </h2>
          </div>
          <span className="text-xs text-slate-400">Diurutkan Berdasarkan Peringkat Suara</span>
        </div>

        <div className="space-y-6">
          {resultsData?.candidates.map((cand) => (
            <div key={cand.id} className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                      cand.rank === 1
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    #{cand.rank}
                  </span>
                  <div>
                    <span className="font-bold text-white">
                      Paslon 0{cand.candidateNumber} : {cand.chairmanName} &amp; {cand.viceChairmanName}
                    </span>
                    <span className="text-xs text-slate-400 ml-2 hidden sm:inline">
                      ({cand.chairmanClass} &amp; {cand.viceChairmanClass})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono font-bold">
                  <span className="text-white">{cand.voteCount} Suara</span>
                  <span className="text-amber-400 text-base">{cand.percentage}%</span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="h-6 w-full bg-[#071324] rounded-xl overflow-hidden p-1 border border-slate-800 flex items-center">
                <div
                  className="h-full rounded-lg bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${Math.max(4, cand.percentage)}%` }}
                >
                  {cand.percentage > 10 && (
                    <span className="text-[10px] font-black text-slate-950 font-mono">
                      {cand.percentage}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILED RANKING CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resultsData?.candidates.map((cand) => (
          <div
            key={cand.id}
            className={`bg-[#0A182B] border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl ${
              cand.rank === 1 ? 'border-amber-400/60 ring-2 ring-amber-400/20' : 'border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                  <img src={cand.photoUrl} alt={cand.chairmanName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase">Paslon 0{cand.candidateNumber}</span>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{cand.chairmanName}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{cand.viceChairmanName}</p>
                </div>
              </div>

              <div
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  cand.rank === 1
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                Juara {cand.rank}
              </div>
            </div>

            <div className="bg-[#071324] p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Perolehan Suara:</span>
                <p className="text-lg font-black text-white font-mono">{cand.voteCount}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Persentase:</span>
                <p className="text-lg font-black text-amber-400 font-mono">{cand.percentage}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* REKAPITULASI PARTISIPASI BERDASARKAN TOMBOL PER KELAS */}
      {votersList.length > 0 && (
        <div className="bg-[#0B1A30] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Partisipasi Suara Berdasarkan Kelas
                </h3>
                <p className="text-xs text-slate-400">
                  Pantau persentase kehadiran dan penggunaan hak suara siswa per rombel kelas
                </p>
              </div>
            </div>

            <span className="text-xs text-amber-300 font-mono bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Total {Array.from(new Set(votersList.map((v) => v.className))).length} Kelas Terdaftar
            </span>
          </div>

          {/* Tombol-Tombol Kelas */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedClassFilter('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                selectedClassFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-300'
                  : 'bg-[#071324] hover:bg-slate-800 text-slate-300 border border-slate-700/80'
              }`}
            >
              <span>Semua Kelas</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  selectedClassFilter === 'ALL' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {votersList.length}
              </span>
            </button>

            {Array.from(new Set(votersList.map((v) => v.className)))
              .sort()
              .map((cls) => {
                const classVts = votersList.filter((v) => v.className === cls);
                const voted = classVts.filter((v) => v.hasVoted).length;
                const isSelected = selectedClassFilter === cls;
                const isComplete = classVts.length > 0 && voted === classVts.length;

                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClassFilter(cls)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-300'
                        : 'bg-[#071324] hover:bg-slate-800 text-slate-200 border border-slate-700/80'
                    }`}
                  >
                    <span>{cls}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isSelected
                          ? 'bg-slate-950 text-amber-300'
                          : isComplete
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {voted}/{classVts.length}
                    </span>
                  </button>
                );
              })}
          </div>

          {/* Cards Display for Classes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from(new Set(votersList.map((v) => v.className)))
              .sort()
              .filter((cls) => selectedClassFilter === 'ALL' || selectedClassFilter === cls)
              .map((cls) => {
                const classVts = votersList.filter((v) => v.className === cls);
                const voted = classVts.filter((v) => v.hasVoted).length;
                const unvoted = classVts.length - voted;
                const pct = classVts.length > 0 ? Math.round((voted / classVts.length) * 100) : 0;
                const isComplete = classVts.length > 0 && voted === classVts.length;

                return (
                  <div
                    key={cls}
                    className={`bg-[#071324] border rounded-2xl p-4 space-y-3 transition-all ${
                      selectedClassFilter === cls
                        ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-lg'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-white text-sm">{cls}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isComplete
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {pct}% Partisipasi
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isComplete ? 'bg-emerald-400' : 'bg-gradient-to-r from-blue-500 to-amber-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 text-center font-mono text-[11px] border-t border-slate-800/80">
                      <div>
                        <span className="text-[9px] uppercase text-slate-500 block">Total</span>
                        <span className="font-bold text-white">{classVts.length}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-emerald-500 block">Sudah</span>
                        <span className="font-bold text-emerald-400">{voted}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-amber-500 block">Menunggu</span>
                        <span className="font-bold text-amber-400">{unvoted}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* PRINTABLE OFFICIAL SUMMARY (Berita Acara Rekapitulasi) */}
      <div className="hidden print:block text-slate-900 bg-white p-8 space-y-6">
        <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
          <h2 className="text-xl font-bold uppercase">{settings?.schoolName || 'SMA NEGERI 1 RAHAYU'}</h2>
          <h3 className="text-lg font-bold">BERITA ACARA REKAPITULASI HASIL PEMILIHAN KETUA &amp; WAKIL KETUA OSIS</h3>
          <p className="text-xs">Tahun Ajaran {settings?.academicYear || '2026/2027'} • Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
        </div>

        <table className="w-full text-xs border border-slate-400 border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-400 p-2">Peringkat</th>
              <th className="border border-slate-400 p-2">Nomor Paslon</th>
              <th className="border border-slate-400 p-2">Nama Calon Ketua &amp; Wakil Ketua</th>
              <th className="border border-slate-400 p-2">Kelas</th>
              <th className="border border-slate-400 p-2">Jumlah Suara</th>
              <th className="border border-slate-400 p-2">Persentase</th>
            </tr>
          </thead>
          <tbody>
            {resultsData?.candidates.map((c) => (
              <tr key={c.id} className="text-center">
                <td className="border border-slate-400 p-2 font-bold">{c.rank}</td>
                <td className="border border-slate-400 p-2 font-bold">0{c.candidateNumber}</td>
                <td className="border border-slate-400 p-2 text-left">{c.chairmanName} &amp; {c.viceChairmanName}</td>
                <td className="border border-slate-400 p-2">{c.chairmanClass} / {c.viceChairmanClass}</td>
                <td className="border border-slate-400 p-2 font-bold">{c.voteCount}</td>
                <td className="border border-slate-400 p-2 font-bold">{c.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 text-xs pt-12 text-center">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Pembina OSIS</p>
            <div className="h-16"></div>
            <p className="underline font-bold">( {settings?.contactPerson || 'Ahmad Fauzi, S.Pd'} )</p>
          </div>
          <div>
            <p>Ditetapkan di Rahayu,</p>
            <p className="font-bold">Ketua Panitia Pemilihan (PPO)</p>
            <div className="h-16"></div>
            <p className="underline font-bold">( Naufal Rizky Pratama )</p>
          </div>
        </div>
      </div>
    </div>
  );
};
