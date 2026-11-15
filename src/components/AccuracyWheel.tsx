'use client';

import React from 'react';

/**
 * Decorative European wheel visualiser.
 *
 * This is intentionally illustrative only. It does not show live spins,
 * predictions or win rates. Authenticated members see real provider data
 * inside the member tool.
 */
const EUROPEAN_WHEEL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_POCKETS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
]);

const CX = 300;
const CY = 300;
const OUTER_R = 282;
const POCKET_OUTER_R = 258;
const POCKET_INNER_R = 176;

const round = (value: number) => Math.round(value * 1000) / 1000;

function polarToCartesian(radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    // Rounding keeps server and browser SVG attributes byte-identical,
    // which prevents React hydration warnings from tiny float differences.
    x: round(CX + radius * Math.cos(rad)),
    y: round(CY + radius * Math.sin(rad))
  };
}

function sectorPath(startAngle: number, endAngle: number, innerR: number, outerR: number) {
  const startOuter = polarToCartesian(outerR, startAngle);
  const endOuter = polarToCartesian(outerR, endAngle);
  const startInner = polarToCartesian(innerR, endAngle);
  const endInner = polarToCartesian(innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    'Z'
  ].join(' ');
}

export function AccuracyWheel({ className = '' }: { className?: string }) {
  const step = 360 / EUROPEAN_WHEEL.length;

  return (
    <div className={`relative aspect-square select-none ${className}`} aria-hidden="true">
      {/* Ambient rings */}
      <div className="absolute inset-0 rounded-full border border-amber-400/15" />
      <div className="absolute inset-[5%] rounded-full border border-dashed border-white/10 animate-spin-reverse" />
      <div className="absolute inset-[11%] rounded-full border border-emerald-400/10" />

      {/* Slow rotating wheel */}
      <div className="absolute inset-[7%] animate-spin-slower">
        <svg viewBox="0 0 600 600" className="h-full w-full drop-shadow-[0_0_40px_rgba(245,158,11,0.18)]">
          <defs>
            <radialGradient id="wheel-core" cx="50%" cy="44%" r="62%">
              <stop offset="0%" stopColor="#17233a" />
              <stop offset="58%" stopColor="#0a101c" />
              <stop offset="100%" stopColor="#04070d" />
            </radialGradient>
            <radialGradient id="wheel-shade" cx="50%" cy="38%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.13" />
              <stop offset="48%" stopColor="#ffffff" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
            </radialGradient>
            <linearGradient id="wheel-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="42%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
            <filter id="wheel-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx={CX} cy={CY} r={OUTER_R} fill="#05080f" stroke="url(#wheel-gold)" strokeWidth="3" />
          <circle cx={CX} cy={CY} r={OUTER_R - 9} fill="none" stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1" />

          {EUROPEAN_WHEEL.map((pocket, index) => {
            const start = index * step;
            const end = start + step;
            const mid = start + step / 2;
            const color =
              pocket === 0 ? '#15803d' : RED_POCKETS.has(pocket) ? '#881f2d' : '#0a1019';
            const textPoint = polarToCartesian((POCKET_OUTER_R + POCKET_INNER_R) / 2, mid);

            return (
              <g key={`${pocket}-${index}`}>
                <path
                  d={sectorPath(start, end, POCKET_INNER_R, POCKET_OUTER_R)}
                  fill={color}
                  stroke="#f59e0b"
                  strokeOpacity="0.16"
                  strokeWidth="0.8"
                />
                <text
                  x={textPoint.x}
                  y={textPoint.y}
                  fill={pocket === 0 ? '#bbf7d0' : '#f8fafc'}
                  fontSize="13.5"
                  fontFamily="Orbitron, sans-serif"
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${mid} ${textPoint.x} ${textPoint.y})`}
                  opacity="0.92"
                >
                  {pocket}
                </text>
              </g>
            );
          })}

          <circle cx={CX} cy={CY} r={POCKET_INNER_R} fill="url(#wheel-core)" stroke="url(#wheel-gold)" strokeWidth="2.5" />
          <circle cx={CX} cy={CY} r={POCKET_INNER_R - 16} fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" />
          <circle cx={CX} cy={CY} r={POCKET_INNER_R - 34} fill="none" stroke="#f59e0b" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="3 7" />
          <circle cx={CX} cy={CY} r={POCKET_OUTER_R} fill="url(#wheel-shade)" opacity="0.55" pointerEvents="none" />

          {/* Crosshair / accuracy target */}
          <g stroke="#f59e0b" strokeOpacity="0.22" strokeWidth="1">
            <line x1={CX - 150} y1={CY} x2={CX - 118} y2={CY} />
            <line x1={CX + 118} y1={CY} x2={CX + 150} y2={CY} />
            <line x1={CX} y1={CY - 150} x2={CX} y2={CY - 118} />
            <line x1={CX} y1={CY + 118} x2={CX} y2={CY + 150} />
          </g>
          <circle cx={CX} cy={CY} r={4} fill="#34d399" filter="url(#wheel-glow)" />
        </svg>
      </div>

      {/* Orbiting ball */}
      <div className="absolute inset-[7%] animate-orbit">
        <span className="absolute left-1/2 top-[1.5%] h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-[0_0_16px_5px_rgba(255,255,255,0.45)]" />
      </div>

      {/* Static glass hub */}
      <div className="absolute inset-[32%] flex flex-col items-center justify-center rounded-full border border-amber-400/30 bg-[#070b13]/85 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_45px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <span className="font-display text-[9px] font-bold uppercase tracking-[0.38em] text-slate-500">
          Engine
        </span>
        <span className="font-display text-3xl font-black tracking-tight text-gold-shimmer">RA</span>
        <span className="mt-1 flex items-center gap-1.5 font-display text-[7px] font-bold uppercase tracking-[0.22em] text-emerald-300">
          <span className="h-1 w-1 rounded-full bg-emerald-400 animate-live-pulse" />
          Calibrated
        </span>
      </div>
    </div>
  );
}
