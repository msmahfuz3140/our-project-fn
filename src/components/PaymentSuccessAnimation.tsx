'use client';

import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

const CONFETTI_COLORS = ['#10b981', '#f59e0b', '#38bdf8', '#a78bfa', '#fb7185', '#facc15'];

const CONFETTI = Array.from({ length: 22 }, (_, index) => {
  const angle = (index / 22) * Math.PI * 2;
  const distance = 80 + (index % 5) * 22;
  return {
    left: 50 + (index % 2 === 0 ? 1 : -1) * (index % 3),
    tx: Math.round(Math.cos(angle) * distance),
    ty: Math.round(Math.sin(angle) * distance * 0.7 + 50),
    rotate: (index % 2 === 0 ? 1 : -1) * (140 + index * 24),
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    delay: (index % 7) * 0.035
  };
});

interface PaymentSuccessAnimationProps {
  planName: string;
  amountLabel: string;
  expirationLabel?: string | null;
}

export function PaymentSuccessAnimation({
  planName,
  amountLabel,
  expirationLabel
}: PaymentSuccessAnimationProps) {
  return (
    <div className="relative flex flex-col items-center overflow-hidden px-2 pb-2 pt-3 text-center">
      <div className="success-confetti" aria-hidden="true">
        {CONFETTI.map((piece, index) => (
          <span
            key={index}
            className="confetti-piece"
            style={
              {
                '--tx': `${piece.tx}px`,
                '--ty': `${piece.ty}px`,
                '--rot': `${piece.rotate}deg`,
                '--c': piece.color,
                '--d': `${piece.delay}s`,
                left: `${piece.left}%`
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
        <div className="success-halo absolute inset-0 rounded-full bg-emerald-500/20 blur-xl" />
        <svg viewBox="0 0 120 120" className="relative h-24 w-24" aria-hidden="true">
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="rgba(16,185,129,0.10)"
            stroke="rgba(16,185,129,0.25)"
            strokeWidth="2"
          />
          <circle
            cx="60"
            cy="60"
            r="44"
            fill="none"
            stroke="#34d399"
            strokeWidth="4"
            strokeLinecap="round"
            className="success-check-circle"
            transform="rotate(-90 60 60)"
          />
          <path
            d="M39 62 L53 76 L83 45"
            fill="none"
            stroke="#34d399"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="success-check-mark"
          />
        </svg>
        <Sparkles className="absolute -right-1 top-1 h-5 w-5 animate-bounce text-amber-300" />
      </div>

      <h3 className="font-display text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
        Payment Successful!
      </h3>
      <p className="mt-2 max-w-md text-xs leading-relaxed text-emerald-200 sm:text-sm">
        Your payment has been successfully received. Your plan is now activated!
      </p>

      <div className="mt-5 w-full max-w-md rounded-2xl border border-emerald-500/30 bg-emerald-950/25 p-4 text-left">
        <div className="flex items-center justify-between gap-3 border-b border-white/5 py-1.5 text-xs">
          <span className="text-slate-400">Purchased Plan</span>
          <span className="font-bold text-white">{planName}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-white/5 py-1.5 text-xs">
          <span className="text-slate-400">Amount Paid</span>
          <span className="font-mono font-bold text-emerald-300">{amountLabel}</span>
        </div>
        {expirationLabel && (
          <div className="flex items-center justify-between gap-3 border-b border-white/5 py-1.5 text-xs">
            <span className="text-slate-400">Access Expires</span>
            <span className="text-slate-200">{expirationLabel}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 py-1.5 text-xs">
          <span className="text-slate-400">Activation</span>
          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
}
