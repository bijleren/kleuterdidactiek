import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface BoardCountdownTimerProps {
  activeUntil: string;
  onExpired?: () => void;
  compact?: boolean;
}

export default function BoardCountdownTimer({ activeUntil, onExpired, compact = false }: BoardCountdownTimerProps) {
  const [remaining, setRemaining] = useState(() => getRemaining(activeUntil));

  useEffect(() => {
    const interval = setInterval(() => {
      const r = getRemaining(activeUntil);
      setRemaining(r);
      if (r.total <= 0 && onExpired) {
        onExpired();
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeUntil, onExpired]);

  if (remaining.total <= 0) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold text-red-600 ${compact ? 'text-xs' : 'text-sm'}`}>
        <AlertTriangle className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        Verlopen
      </span>
    );
  }

  const isUrgent = remaining.total < 5 * 60 * 1000;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isUrgent ? 'text-amber-600 animate-pulse' : 'text-emerald-600'}`}>
        <Clock className="w-3.5 h-3.5" />
        {formatTime(remaining)}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
      isUrgent
        ? 'bg-amber-100 text-amber-700 animate-pulse'
        : 'bg-emerald-100 text-emerald-700'
    }`}>
      <Clock className="w-4 h-4" />
      <span>{formatTime(remaining)}</span>
    </div>
  );
}

function getRemaining(activeUntil: string) {
  const diff = new Date(activeUntil).getTime() - Date.now();
  if (diff <= 0) return { total: 0, hours: 0, minutes: 0, seconds: 0 };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { total: diff, hours, minutes, seconds };
}

function formatTime(r: { hours: number; minutes: number; seconds: number }) {
  if (r.hours > 0) {
    return `${r.hours}:${String(r.minutes).padStart(2, '0')}:${String(r.seconds).padStart(2, '0')}`;
  }
  return `${r.minutes}:${String(r.seconds).padStart(2, '0')}`;
}
