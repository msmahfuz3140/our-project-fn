import React from 'react';
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Fingerprint,
  Lock,
  Radar,
  ShieldCheck,
  Table2,
  Waves
} from 'lucide-react';

/**
 * Homepage capability bento. Every statement describes the shipped engine;
 * no speculative win rates or fabricated live values are shown.
 */
export function FeatureBento() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] py-20 sm:py-24">
      <div className="aurora-blob aurora-blob--gold left-[-12%] top-1/4 h-[340px] w-[420px]" />
      <div className="aurora-blob aurora-blob--emerald right-[-10%] bottom-0 h-[300px] w-[380px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto mb-12 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-1.5 backdrop-blur-md">
            <Fingerprint className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-display text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Engine anatomy
            </span>
          </div>
          <h2 className="font-display text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Precision, without <span className="text-gold-shimmer">the noise</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-sm leading-relaxed text-slate-400 sm:text-base">
            Every layer of Roulette Accuracy is built around one principle: show what can be
            calculated, never invent what cannot.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {/* Direction-aware engine */}
          <div className="reveal glass glass-sheen group relative overflow-hidden rounded-3xl p-6 md:col-span-3 md:row-span-2 sm:p-7">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-amber-500/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-5 flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-300">
                  <ArrowLeftRight className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-display text-[8px] font-black uppercase tracking-[0.18em] text-emerald-300">
                  Two directions
                </span>
              </div>
              <h3 className="font-display text-lg font-black uppercase tracking-tight text-white sm:text-xl">
                Direction-aware engine
              </h3>
              <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-slate-400">
                Clockwise and counter-clockwise rotations are calculated independently. Switching
                direction recalculates the main pocket, n9 sector and n4 ranges without a reload.
              </p>

              <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#060a12]/70 p-4">
                <div className="mb-3 flex items-center justify-between font-display text-[8px] uppercase tracking-[0.18em] text-slate-500">
                  <span>Rotation model</span>
                  <span className="text-amber-400/80">Live recalculation</span>
                </div>
                <svg viewBox="0 0 320 130" className="h-auto w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="arc-gold" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.15" />
                    </linearGradient>
                    <linearGradient id="arc-emerald" x1="1" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0.15" />
                    </linearGradient>
                  </defs>
                  <circle cx="160" cy="70" r="48" fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="2 5" />
                  <circle cx="160" cy="70" r="34" fill="#080d16" stroke="#ffffff" strokeOpacity="0.1" />
                  <path d="M 160 22 A 48 48 0 0 1 205 94" fill="none" stroke="url(#arc-gold)" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 160 118 A 48 48 0 0 1 115 46" fill="none" stroke="url(#arc-emerald)" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="160" cy="70" r="5" fill="#f59e0b" />
                  <circle cx="160" cy="70" r="12" fill="none" stroke="#f59e0b" strokeOpacity="0.35" />
                  <text x="160" y="74" textAnchor="middle" fill="#f8fafc" fontSize="9" fontFamily="Orbitron, sans-serif" fontWeight="800">RA</text>
                  <text x="218" y="86" fill="#fbbf24" fontSize="7" fontFamily="Orbitron, sans-serif" letterSpacing="1.5">CW</text>
                  <text x="76" y="50" fill="#34d399" fontSize="7" fontFamily="Orbitron, sans-serif" letterSpacing="1.5">CCW</text>
                </svg>
              </div>

              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                {['Main pocket', 'n9 sector', 'Top over n4', 'Top under n4'].map((item) => (
                  <span
                    key={item}
                    className="rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1 font-display text-[9px] font-semibold uppercase tracking-wider text-slate-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Travel mathematics */}
          <div className="reveal glass group relative overflow-hidden rounded-3xl p-5 md:col-span-3 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-300">
                  <Waves className="h-5 w-5" />
                </span>
                <h3 className="font-display text-base font-black uppercase tracking-tight text-white">
                  Travel mathematics
                </h3>
                <p className="mt-1.5 font-body text-xs leading-relaxed text-slate-400">
                  Pocket distances, rolling averages and the ±7 rhythm band derived from received
                  spins only.
                </p>
              </div>
              <BarChart3 className="h-5 w-5 shrink-0 text-slate-600" />
            </div>
            <svg viewBox="0 0 320 70" className="mt-4 h-auto w-full" aria-hidden="true">
              <defs>
                <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M2 58 L24 50 L48 54 L72 40 L96 44 L120 30 L144 36 L168 22 L192 30 L216 18 L240 26 L264 12 L288 20 L314 8 L314 70 L2 70 Z" fill="url(#spark-fill)" />
              <path d="M2 58 L24 50 L48 54 L72 40 L96 44 L120 30 L144 36 L168 22 L192 30 L216 18 L240 26 L264 12 L288 20 L314 8" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="314" cy="8" r="3" fill="#7dd3fc" />
            </svg>
          </div>

          {/* Security */}
          <div className="reveal glass group relative overflow-hidden rounded-3xl p-5 md:col-span-3 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-base font-black uppercase tracking-tight text-white">
                  Server-side by design
                </h3>
                <p className="mt-1.5 max-w-md font-body text-xs leading-relaxed text-slate-400">
                  Provider keys are encrypted at rest and signed by the backend proxy. The SK key
                  never enters browser JavaScript or localStorage.
                </p>
                <div className="mt-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-emerald-400/80">
                  <Lock className="h-3 w-3" />
                  HMAC-SHA256 signed headers
                </div>
              </div>
            </div>
          </div>

          {/* Small cards */}
          <FeatureCard
            icon={<Table2 className="h-5 w-5" />}
            tint="border-amber-500/25 bg-amber-500/10 text-amber-300"
            title="20+ live tables"
            description="Evolution Gaming and Pragmatic Play feeds streamed through the authenticated backend."
            className="md:col-span-2"
          />
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5" />}
            tint="border-purple-500/25 bg-purple-500/10 text-purple-300"
            title="Three synchronized views"
            description="Wheel, travel chart and live graph always render from the same prediction response."
            className="md:col-span-2"
          />
          <FeatureCard
            icon={<Radar className="h-5 w-5" />}
            tint="border-rose-500/25 bg-rose-500/10 text-rose-300"
            title="Sector intelligence"
            description="Main pocket, n9 neighborhood and Top Over / Under n4 ranges mapped per direction."
            className="md:col-span-2"
          />
        </div>

        <div className="reveal mt-5 flex flex-col items-start justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <Activity className="h-4 w-4 text-amber-400" />
            <p className="font-body text-xs text-slate-400">
              Open the member tool to view authenticated values for your selected table.
            </p>
          </div>
          <span className="font-display text-[8px] font-bold uppercase tracking-[0.22em] text-slate-500">
            No demo spins · No fake confidence
          </span>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  tint,
  title,
  description,
  className = ''
}: {
  icon: React.ReactNode;
  tint: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={`reveal glass group relative overflow-hidden rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 ${className}`}>
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl border ${tint}`}>
        {icon}
      </div>
      <h3 className="font-display text-sm font-black uppercase tracking-tight text-white">
        {title}
      </h3>
      <p className="mt-1.5 font-body text-[11px] leading-relaxed text-slate-400">{description}</p>
      <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}
