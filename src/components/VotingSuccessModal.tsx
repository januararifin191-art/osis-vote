import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, ShieldCheck, Printer, ArrowRight, Lock, Sparkles, Award } from 'lucide-react';
import { Voter, ElectionSettings } from '../types';

interface VotingSuccessModalProps {
  voter: Voter;
  receiptCode: string;
  settings: ElectionSettings | null;
  onDone: () => void;
}

export const VotingSuccessModal: React.FC<VotingSuccessModalProps> = ({
  voter,
  receiptCode,
  settings,
  onDone,
}) => {
  useEffect(() => {
    // Launch celebratory confetti burst
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#F59E0B', '#3B82F6', '#10B981', '#EAB308', '#FFFFFF'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in zoom-in-95 duration-300">
      <div className="relative w-full max-w-lg bg-[#0B1A30] border-2 border-emerald-500/60 rounded-3xl shadow-2xl overflow-hidden text-white my-6">
        {/* Celebration Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-emerald-950/40 via-transparent to-transparent text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-[#081525] rounded-[22px] flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Suara Berhasil Disimpan
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Hatur nuhun !
            </h2>
            <p className="text-base sm:text-lg font-bold text-amber-300">
              Sora anjeun parantos direkam.
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Terima kasih telah berpartisipasi menyalurkan hak suara Anda untuk masa depan OSIS yang lebih baik.
            </p>
          </div>
        </div>

        {/* Digital Ballot Receipt Card (Printable) */}
        <div className="px-6 sm:px-8 pb-4">
          <div className="bg-[#071324] border border-dashed border-amber-500/40 rounded-2xl p-5 space-y-4 text-xs font-mono">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold">
                  BUKTI TANDA TERIMA ELEKTRONIK
                </span>
                <p className="text-white font-bold text-xs font-sans">
                  {settings?.schoolName || 'SMA NEGERI 1 RAHAYU'}
                </p>
              </div>
              <Award className="w-6 h-6 text-amber-400" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>
                <span className="text-slate-500 text-[10px] uppercase">Nama Pemilih:</span>
                <p className="text-white font-bold font-sans">{voter.fullName}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase">Kelas / NISN:</span>
                <p className="text-white font-bold font-sans">{voter.className} • {voter.nisn}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase">Kode Tanda Terima:</span>
                <p className="text-amber-400 font-bold">{receiptCode}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase">Waktu Suara Masuk:</span>
                <p className="text-white">{new Date().toLocaleTimeString('id-ID')} WIB</p>
              </div>
            </div>

            {/* Secret Ballot Assurance */}
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2 text-[11px] text-slate-400 font-sans">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Pilihan Anda dienkripsi secara anonim (Luber Jurdil). Data suara tidak dapat dilacak kembali ke identitas Anda.
              </span>
            </div>
          </div>
        </div>

        {/* Security Alert: One vote only */}
        <div className="px-6 sm:px-8 py-2">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Hak suara Anda telah digunakan dan dikunci secara permanen. Anda tidak dapat melakukan pemilihan ulang.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 sm:p-8 bg-[#081527] border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Bukti Suara
          </button>

          <button
            onClick={onDone}
            className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Selesai &amp; Keluar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
