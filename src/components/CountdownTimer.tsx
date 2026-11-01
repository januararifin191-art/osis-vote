import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string; // ISO string
  status: 'upcoming' | 'ongoing' | 'completed';
  onExpire?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, status, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isFinished: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: false });

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: true });
        if (onExpire) onExpire();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isFinished: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onExpire]);

  if (status === 'completed' || timeLeft.isFinished) {
    return (
      <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 px-4 py-2 rounded-xl text-slate-300 text-sm shadow-md">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold text-white">Bilik Suara Telah Ditutup</span>
        <span className="text-slate-400 text-xs">(Pemilihan Selesai)</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 bg-gradient-to-r from-slate-900/90 via-[#0B1A30]/90 to-slate-900/90 border border-amber-500/30 rounded-2xl p-3 sm:px-5 sm:py-3 shadow-xl shadow-amber-500/5">
      <div className="flex items-center gap-2 text-amber-400">
        <Clock className="w-5 h-5 animate-pulse text-amber-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
          {status === 'upcoming' ? 'Waktu Menuju Pembukaan:' : 'Sisa Waktu Memilih:'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center bg-[#071324] border border-slate-700 rounded-lg px-2.5 py-1 min-w-[48px]">
          <span className="text-lg font-black text-white font-mono leading-tight">
            {String(timeLeft.days).padStart(2, '0')}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Hari</span>
        </div>
        <span className="text-amber-400 font-bold">:</span>
        <div className="flex flex-col items-center bg-[#071324] border border-slate-700 rounded-lg px-2.5 py-1 min-w-[48px]">
          <span className="text-lg font-black text-amber-400 font-mono leading-tight">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Jam</span>
        </div>
        <span className="text-amber-400 font-bold">:</span>
        <div className="flex flex-col items-center bg-[#071324] border border-slate-700 rounded-lg px-2.5 py-1 min-w-[48px]">
          <span className="text-lg font-black text-amber-400 font-mono leading-tight">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Menit</span>
        </div>
        <span className="text-amber-400 font-bold">:</span>
        <div className="flex flex-col items-center bg-[#071324] border border-slate-700 rounded-lg px-2.5 py-1 min-w-[48px]">
          <span className="text-lg font-black text-amber-300 font-mono leading-tight animate-pulse">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Detik</span>
        </div>
      </div>
    </div>
  );
};
