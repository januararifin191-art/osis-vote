import React from 'react';
import { X, Award, CheckCircle2, Sparkles, Target, Zap, Check } from 'lucide-react';
import { Candidate } from '../types';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onSelectVote?: (candidate: Candidate) => void;
  isVotingMode?: boolean;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  onClose,
  onSelectVote,
  isVotingMode = false,
}) => {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0B1A30] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-white my-8">
        {/* Header with Background Pattern & Close button */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-[#0C1E38] via-[#102A4E] to-[#0A1728] border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 p-0.5 shadow-lg shrink-0">
              <div className="w-full h-full bg-[#081424] rounded-[14px] flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-amber-400 uppercase">Paslon</span>
                <span className="text-3xl font-black text-white">0{candidate.candidateNumber}</span>
              </div>
            </div>

            <div>
              <div className="inline-block px-3 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold mb-1">
                "{candidate.tagline}"
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {candidate.chairmanName} &amp; {candidate.viceChairmanName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Kandidat Calon Ketua ({candidate.chairmanClass}) &amp; Calon Wakil Ketua OSIS ({candidate.viceChairmanClass})
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Photos Showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
              <img
                src={candidate.chairmanPhotoUrl || candidate.photoUrl}
                alt={candidate.chairmanName}
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shrink-0"
              />
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400">Calon Ketua OSIS</span>
                <p className="text-sm font-bold text-white leading-tight">{candidate.chairmanName}</p>
                <p className="text-xs text-slate-400">Kelas: {candidate.chairmanClass}</p>
              </div>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
              <img
                src={candidate.viceChairmanPhotoUrl || candidate.photoUrl}
                alt={candidate.viceChairmanName}
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-400 shrink-0"
              />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300">Calon Wakil Ketua OSIS</span>
                <p className="text-sm font-bold text-white leading-tight">{candidate.viceChairmanName}</p>
                <p className="text-xs text-slate-400">Kelas: {candidate.viceChairmanClass}</p>
              </div>
            </div>
          </div>

          {/* Visi */}
          <div className="bg-[#081527] p-5 rounded-2xl border border-amber-500/20">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Visi Pasangan Calon
            </h3>
            <p className="text-slate-200 text-sm leading-relaxed italic">
              "{candidate.vision}"
            </p>
          </div>

          {/* Misi */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-blue-400" />
              Misi Strategis ({candidate.missions.length} Poin)
            </h3>
            <div className="space-y-2.5">
              {candidate.missions.map((mission, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80"
                >
                  <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 leading-normal">{mission}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Program Kerja Unggulan */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              Program Kerja Unggulan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {candidate.workPrograms.map((prog, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs font-bold text-amber-300">{prog.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {prog.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{prog.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-[#081324] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            Pastikan membaca seluruh visi dan misi sebelum menentukan pilihan Anda.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>

            {isVotingMode && onSelectVote && (
              <button
                onClick={() => {
                  onSelectVote(candidate);
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Pilih Paslon 0{candidate.candidateNumber}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
