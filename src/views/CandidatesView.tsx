import React, { useState } from 'react';
import { Search, Award, Sparkles, Filter, Vote, ArrowRight } from 'lucide-react';
import { Candidate, Voter, ElectionSettings } from '../types';
import { CandidateCard } from '../components/CandidateCard';
import { CandidateDetailModal } from '../components/CandidateDetailModal';

interface CandidatesViewProps {
  candidates: Candidate[];
  currentVoter: Voter | null;
  settings: ElectionSettings | null;
  onNavigate: (view: string) => void;
  onSelectCandidateToVote: (candidate: Candidate) => void;
}

export const CandidatesView: React.FC<CandidatesViewProps> = ({
  candidates,
  currentVoter,
  settings,
  onNavigate,
  onSelectCandidateToVote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const filtered = candidates.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.chairmanName.toLowerCase().includes(term) ||
      c.viceChairmanName.toLowerCase().includes(term) ||
      c.tagline.toLowerCase().includes(term) ||
      c.vision.toLowerCase().includes(term) ||
      c.chairmanClass.toLowerCase().includes(term) ||
      c.viceChairmanClass.toLowerCase().includes(term) ||
      `paslon ${c.candidateNumber}`.includes(term) ||
      `0${c.candidateNumber}`.includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Daftar Resmi Pasangan Calon
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white mt-2">
            Kandidat Ketua &amp; Wakil Ketua OSIS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Periode Kepengurusan {settings?.academicYear || '2026/2027'} • {settings?.schoolName || 'SMA NEGERI 1 RAHAYU'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-72">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama paslon, visi, kelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0A182B] border border-slate-700 focus:border-amber-400 text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Candidates Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Tidak ada pasangan calon yang cocok</h3>
          <p className="text-xs text-slate-400 mt-1">Silakan coba kata kunci pencarian yang lain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onViewDetails={(c) => setSelectedCandidate(c)}
              onSelectVote={(c) => {
                if (!currentVoter) {
                  onNavigate('login');
                } else {
                  onSelectCandidateToVote(c);
                  onNavigate('voting');
                }
              }}
              isVotingMode={settings?.status === 'ongoing'}
            />
          ))}
        </div>
      )}

      {/* Floating Call-to-action Banner */}
      {settings?.status === 'ongoing' && (
        <div className="bg-gradient-to-r from-amber-500/20 via-[#0B1A30] to-blue-500/20 border border-amber-500/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-black text-white">
              Sudah Menemukan Pasangan Calon Pilihan Anda?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Gunakan hak pilih Anda sekarang sebelum bilik suara digital resmi ditutup.
            </p>
          </div>

          <button
            onClick={() => {
              if (currentVoter) {
                onNavigate('voting');
              } else {
                onNavigate('login');
              }
            }}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all"
          >
            <Vote className="w-4 h-4" />
            <span>Masuk ke Bilik Suara</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onSelectVote={(c) => {
          if (!currentVoter) {
            onNavigate('login');
          } else {
            onSelectCandidateToVote(c);
            onNavigate('voting');
          }
        }}
        isVotingMode={settings?.status === 'ongoing'}
      />
    </div>
  );
};
