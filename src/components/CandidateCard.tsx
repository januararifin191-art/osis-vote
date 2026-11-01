import React from 'react';
import { Award, Eye, CheckCircle, Sparkles, BookOpen } from 'lucide-react';
import { Candidate } from '../types';

interface CandidateCardProps {
  candidate: Candidate;
  onViewDetails: (candidate: Candidate) => void;
  onSelectVote?: (candidate: Candidate) => void;
  isVotingMode?: boolean;
  isSelected?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onViewDetails,
  onSelectVote,
  isVotingMode = false,
  isSelected = false,
}) => {
  return (
    <div
      className={`group relative bg-gradient-to-b from-[#0F223D] to-[#0A182B] rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden shadow-xl ${
        isSelected
          ? 'border-amber-400 ring-4 ring-amber-400/30 scale-[1.02]'
          : 'border-slate-800 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10'
      }`}
    >
      {/* Top Banner & Number Badge */}
      <div className="relative h-64 overflow-hidden bg-slate-900">
        <img
          src={candidate.photoUrl}
          alt={`Paslon ${candidate.candidateNumber}`}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A182B] via-transparent to-black/40"></div>

        {/* Large Prominent Candidate Number Badge */}
        <div className="absolute top-4 left-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-xl shadow-black/60">
              <div className="w-full h-full bg-[#0B1A30] rounded-[14px] flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-amber-300 tracking-wider uppercase leading-none">
                  Paslon
                </span>
                <span className="text-2xl font-black text-white leading-none mt-0.5">
                  0{candidate.candidateNumber}
                </span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-slate-950 font-black text-xs">
              ★
            </div>
          </div>
        </div>

        {/* Tagline Pill */}
        <div className="absolute bottom-3 left-4 right-4">
          <div className="inline-block bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/30 text-amber-300 text-xs font-semibold">
            "{candidate.tagline}"
          </div>
        </div>
      </div>

      {/* Candidate Names & Class info */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="space-y-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                Calon Ketua OSIS
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                {candidate.chairmanName}
              </h3>
              <p className="text-xs text-slate-400">Kelas: {candidate.chairmanClass}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Calon Wakil Ketua OSIS
              </span>
              <h4 className="text-sm sm:text-base font-semibold text-slate-200">
                {candidate.viceChairmanName}
              </h4>
              <p className="text-xs text-slate-400">Kelas: {candidate.viceChairmanClass}</p>
            </div>
          </div>

          {/* Vision Snippet */}
          <div className="mt-3">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Visi Utama:
            </span>
            <p className="text-xs text-slate-400 line-clamp-3 mt-1 leading-relaxed italic">
              "{candidate.vision}"
            </p>
          </div>

          {/* Quick Missions Pill count */}
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>{candidate.missions.length} Misi Strategis</span>
            <span className="text-slate-600">•</span>
            <span>{candidate.workPrograms.length} Program Unggulan</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          {isVotingMode && onSelectVote ? (
            <button
              onClick={() => onSelectVote(candidate)}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-400 text-slate-950 shadow-amber-400/30'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 hover:shadow-amber-500/25'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {isSelected ? 'PASLON TELAH DIPILIH' : `PILIH PASLON 0${candidate.candidateNumber}`}
            </button>
          ) : null}

          <button
            onClick={() => onViewDetails(candidate)}
            className="w-full py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/80 hover:border-amber-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            Lihat Visi, Misi &amp; Program Kerja
          </button>
        </div>
      </div>
    </div>
  );
};
