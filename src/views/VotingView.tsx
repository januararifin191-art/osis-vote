import React, { useState } from 'react';
import {
  Vote,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowLeft,
  Eye,
  LogOut
} from 'lucide-react';
import { Candidate, Voter, ElectionSettings } from '../types';
import { electionStore } from '../services/store';
import { CandidateCard } from '../components/CandidateCard';
import { CandidateDetailModal } from '../components/CandidateDetailModal';
import { VotingConfirmModal } from '../components/VotingConfirmModal';
import { VotingSuccessModal } from '../components/VotingSuccessModal';

interface VotingViewProps {
  candidates: Candidate[];
  currentVoter: Voter | null;
  settings: ElectionSettings | null;
  onNavigate: (view: string) => void;
  onVoterUpdate: (updatedVoter: Voter) => void;
  onLogout: () => void;
  initialSelectedCandidate?: Candidate | null;
}

export const VotingView: React.FC<VotingViewProps> = ({
  candidates,
  currentVoter,
  settings,
  onNavigate,
  onVoterUpdate,
  onLogout,
  initialSelectedCandidate = null,
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(initialSelectedCandidate);
  const [candidateToInspect, setCandidateToInspect] = useState<Candidate | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If not logged in as voter, guide them to login
  if (!currentVoter) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-[#0B1A30] border border-slate-800 p-8 rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Autentikasi Diperlukan</h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Untuk menjaga keabsahan asas Luber Jurdil, Anda harus masuk dengan NISN dan PIN terlebih dahulu sebelum mengakses bilik suara.
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>Login Pemilih Sekarang</span>
          </button>
        </div>
      </div>
    );
  }

  // If already voted, block further voting
  if (currentVoter.hasVoted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-[#0B1A30] border-2 border-emerald-500/40 p-8 rounded-3xl space-y-5 text-white">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
              Status Pemilih: Terverifikasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-1">
              Hak Suara Anda Telah Digunakan
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Terima kasih, <strong>{currentVoter.fullName}</strong> ({currentVoter.className}). Pilihan Anda telah berhasil disimpan di bilik suara digital secara anonim. Sesuai ketentuan, setiap akun siswa hanya memiliki 1 (satu) kali kesempatan voting.
          </p>

          <div className="bg-[#071324] border border-slate-800 p-4 rounded-2xl font-mono text-xs text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Kode Bukti:</span>
              <span className="text-amber-400 font-bold">{currentVoter.receiptCode || 'VOTE-REC-X88'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Waktu Memilih:</span>
              <span className="text-slate-200">{currentVoter.votedAt ? new Date(currentVoter.votedAt).toLocaleString('id-ID') : 'Tercatat'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => onNavigate('landing')}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </button>
            <button
              onClick={onLogout}
              className="flex-1 py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
            >
              Keluar Akun
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle vote selection trigger
  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowConfirmModal(true);
  };

  // Perform actual vote submission
  const handleConfirmVote = async () => {
    if (!selectedCandidate) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await electionStore.castVote(selectedCandidate.id, currentVoter.id);
      if (result.success) {
        setGeneratedReceipt(result.receiptCode);
        setShowConfirmModal(false);
        setShowSuccessModal(true);

        // Update voter object in parent state
        const updatedVoter: Voter = {
          ...currentVoter,
          hasVoted: true,
          votedAt: new Date().toISOString(),
          receiptCode: result.receiptCode,
        };
        onVoterUpdate(updatedVoter);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirimkan suara. Silakan coba kembali.';
      setErrorMessage(msg);
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header / Bilik Suara Badge */}
      <div className="bg-gradient-to-r from-[#0C1E38] via-[#0F284B] to-[#0A1728] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Vote className="w-3.5 h-3.5 text-amber-400" />
            <span>BILIK SUARA DIGITAL ELEKTRONIK</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            Surat Suara Pemilihan OSIS
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Pilihlah <strong>1 (satu) pasangan calon</strong> dengan menekan tombol <strong>"PILIH PASLON"</strong>. Suara Anda menentukan masa depan sekolah selama 1 tahun ke depan.
          </p>
        </div>

        {/* Voter Identity Pill */}
        <div className="bg-[#071324] border border-slate-700/80 rounded-2xl p-4 min-w-[240px] text-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5 mb-1.5">
            <span className="font-bold text-amber-400 uppercase tracking-wider">Pemilih Aktif:</span>
            <button
              onClick={onLogout}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
            >
              <LogOut className="w-3 h-3" />
              Keluar
            </button>
          </div>
          <p className="text-sm font-bold text-white truncate">{currentVoter.fullName}</p>
          <p className="text-slate-400">{currentVoter.className} • NISN: {currentVoter.nisn}</p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Hak Suara: 1 Kali Pemilihan</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Candidate Ballot Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Daftar Pasangan Calon Pada Surat Suara
          </h2>
          <span className="text-xs text-slate-400">Total {candidates.length} Paslon</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((cand) => (
            <CandidateCard
              key={cand.id}
              candidate={cand}
              onViewDetails={(c) => setCandidateToInspect(c)}
              onSelectVote={handleSelectCandidate}
              isVotingMode={true}
              isSelected={selectedCandidate?.id === cand.id}
            />
          ))}
        </div>
      </div>

      {/* Inspection Modal */}
      <CandidateDetailModal
        candidate={candidateToInspect}
        onClose={() => setCandidateToInspect(null)}
        onSelectVote={handleSelectCandidate}
        isVotingMode={true}
      />

      {/* Confirmation Modal */}
      {showConfirmModal && selectedCandidate && (
        <VotingConfirmModal
          candidate={selectedCandidate}
          voter={currentVoter}
          onConfirm={handleConfirmVote}
          onCancel={() => setShowConfirmModal(false)}
          isLoading={isSubmitting}
        />
      )}

      {/* Success Celebration Modal */}
      {showSuccessModal && (
        <VotingSuccessModal
          voter={currentVoter}
          receiptCode={generatedReceipt}
          settings={settings}
          onDone={() => onNavigate('results')}
        />
      )}
    </div>
  );
};
