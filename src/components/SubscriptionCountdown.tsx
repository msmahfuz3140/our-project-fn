'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Timer, ShieldAlert } from 'lucide-react';

interface SubscriptionCountdownProps {
  endDate?: string | null;
  serverTime?: string | null;
  compact?: boolean;
  className?: string;
  onExpire?: () => void;
  expiredLabel?: string;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Display-only countdown. The offset between the server clock and the local
 * clock is captured when access status is fetched, so changing the device clock
 * cannot extend the displayed time. Real access is always validated server-side.
 */
export function SubscriptionCountdown({
  endDate,
  serverTime,
  compact = false,
  className = '',
  onExpire,
  expiredLabel = 'Expired'
}: SubscriptionCountdownProps) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!endDate) {
      setRemainingMs(null);
      return;
    }

    const expiresAt = new Date(endDate).getTime();
    if (Number.isNaN(expiresAt)) {
      setRemainingMs(null);
      return;
    }

    firedRef.current = false;
    const parsedServerNow = serverTime ? new Date(serverTime).getTime() : Date.now();
    const clockOffset = Number.isNaN(parsedServerNow) ? 0 : parsedServerNow - Date.now();
    const initialRemaining = Math.max(0, expiresAt - (Date.now() + clockOffset));
    const monotonicStart = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const tick = () => {
      // performance.now() is monotonic and cannot be moved backwards by changing
      // the device clock after the page was loaded.
      const monotonicNow = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsed = monotonicNow - monotonicStart;
      const next = Math.max(0, initialRemaining - elapsed);
      setRemainingMs(next);

      if (next <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endDate, serverTime]);

  if (!endDate || remainingMs === null) return null;

  if (remainingMs <= 0) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-rose-300 ${className}`}
      >
        <ShieldAlert className="h-3.5 w-3.5" />
        {expiredLabel}
      </span>
    );
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (compact) {
    return (
      <span
        role="timer"
        title="Server-synchronized subscription countdown"
        className={`inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-emerald-300 ${className}`}
      >
        <Timer className="h-3.5 w-3.5" />
        {days > 0 ? `${days}d ` : ''}
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    );
  }

  const units = [
    { label: 'Days', value: days },
    { label: 'Hours', value: hours },
    { label: 'Minutes', value: minutes },
    { label: 'Seconds', value: seconds }
  ];

  return (
    <div className={className} role="timer" aria-label="Premium subscription time remaining">
      <div className="grid grid-cols-4 gap-2">
        {units.map((unit) => (
          <div
            key={unit.label}
            className="rounded-xl border border-white/10 bg-black/30 px-2 py-2.5 text-center shadow-inner"
          >
            <div className="font-display text-lg font-black tabular-nums text-amber-300 sm:text-xl">
              {pad(unit.value)}
            </div>
            <div className="mt-0.5 font-display text-[8px] font-bold uppercase tracking-widest text-slate-500">
              {unit.label}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 flex items-center gap-1.5 font-mono text-[9px] text-slate-500">
        <Timer className="h-3 w-3" />
        Server-synchronized · exact expiry at {new Date(endDate).toLocaleString()}
      </p>
    </div>
  );
}
