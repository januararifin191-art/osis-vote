import React from 'react';
import { AlertTriangle, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { Candidate, Voter } from '../types';

interface VotingConfirmModalProps {
  candidate: Candidate;
  voter: Voter;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const VotingConfirmModal: React.FC<VotingConfirmModalProps> = ({
  candidate,
  voter,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0B1A30] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden text-white">
        {/* Top Gold Bar */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600"></div>

        <div className="p-6 sm:p-8 space-y-6 text-center">
          {/* Warning Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-8 h-8 animate-bounce" />
          </div>

          {/* Heading & Confirmation Prompt as required */}
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Konfirmasi Pilihan Suara
            </h3>
            <p className="text-amber-300 font-semibold text-sm sm:text-base leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              "Apakah Anda yakin dengan pilihan Anda? Suara yang sudah dikirim tidak dapat diubah."
            </p>
          </div>

          {/* Chosen Candidate Preview */}
          <div className="bg-[#071324] p-4 rounded-2xl border border-slate-700/80 text-left flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-xl text-amber-400 shrink-0">
              0{candidate.candidateNumber}
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-400">Pilihan Paslon Anda:</span>
              <p className="text-sm font-bold text-white truncate">
                {candidate.chairmanName} &amp; {candidate.viceChairmanName}
              </p>
              <p className="text-xs text-amber-400/90 italic truncate">
                "{candidate.tagline}"
              </p>
            </div>
          </div>

          {/* Voter ID Badge */}
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5 bg-slate-900/60 py-2 px-3 rounded-lg border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pemilih: <strong>{voter.fullName}</strong> ({voter.className} - {voter.nisn})</span>
          </div>

          {/* Buttons: Exact required names */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>

            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ya, Kintun Suara</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
