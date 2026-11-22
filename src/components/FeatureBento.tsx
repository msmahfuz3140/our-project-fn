import React from 'react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Headphones,
  Lock,
  ShieldCheck,
  Sparkles,
  Table2,
  Users
} from 'lucide-react';

/**
 * Public capability grid. This intentionally describes member benefits and
 * product outcomes only — no backend architecture, provider credentials,
 * internal formulas or implementation steps.
 */
export function FeatureBento() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] py-20 sm:py-24">
      <div className="aurora-blob aurora-blob--gold left-[-12%] top-1/4 h-[340px] w-[420px]" />
      <div className="aurora-blob aurora-blob--emerald right-[-10%] bottom-0 h-[300px] w-[380px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto mb-12 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-1.5 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-display text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Member experience
            </span>
          </div>
          <h2 className="font-display text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Everything you need, <span className="text-gold-shimmer">in one place</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-sm leading-relaxed text-slate-400 sm:text-base">
            A focused member workspace with live table views, clear visual analysis and straightforward account tools.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {/* Main card */}
          <div className="reveal glass glass-sheen group relative overflow-hidden rounded-3xl p-6 md:col-span-3 md:row-span-2 sm:p-7">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-amber-500/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-5 flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-300">
                  <Table2 className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-display text-[8px] font-black uppercase tracking-[0.18em] text-emerald-300">
                  Live tables
                </span>
              </div>
              <h3 className="font-display text-lg font-black uppercase tracking-tight text-white sm:text-xl">
                A complete live table lobby
              </h3>
              <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-slate-400">
                Follow supported European roulette tables in one place and switch between tables without losing your
                session.
              </p>

              <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#060a12]/70 p-4">
                <div className="mb-3 flex items-center justify-between font-display text-[8px] uppercase tracking-[0.18em] text-slate-500">
                  <span>Your workspace</span>
                  <span className="text-amber-400/80">One dashboard</span>
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
                </svg>
              </div>

              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                {['Live table overview', 'Wheel view', 'Travel chart', 'History'].map((item) => (
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

          {/* Analysis */}
          <div className="reveal glass group relative overflow-hidden rounded-3xl p-5 md:col-span-3 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-300">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <h3 className="font-display text-base font-black uppercase tracking-tight text-white">
                  Clear visual analysis
                </h3>
                <p className="mt-1.5 font-body text-xs leading-relaxed text-slate-400">
                  Charts and summaries that make table activity easy to follow at a glance.
                </p>
              </div>
              <Activity className="h-5 w-5 shrink-0 text-slate-600" />
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

          {/* Account security */}
          <div className="reveal glass group relative overflow-hidden rounded-3xl p-5 md:col-span-3 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-base font-black uppercase tracking-tight text-white">
                  Protected member access
                </h3>
                <p className="mt-1.5 max-w-md font-body text-xs leading-relaxed text-slate-400">
                  Email verification, secure sign-in and subscriber-only access keep member accounts and private tools
                  protected.
                </p>
                <div className="mt-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-emerald-400/80">
                  <Lock className="h-3 w-3" />
                  Verified accounts only
                </div>
              </div>
            </div>
          </div>

          {/* Small cards */}
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            tint="border-amber-500/25 bg-amber-500/10 text-amber-300"
            title="Referral program"
            description="Share your personal code, track referred members and manage referral earnings from your wallet."
            className="md:col-span-2"
          />
          <FeatureCard
            icon={<ArrowUpRight className="h-5 w-5" />}
            tint="border-purple-500/25 bg-purple-500/10 text-purple-300"
            title="Simple plan management"
            description="Choose a pass, pay with supported cryptocurrencies and see your access status in your dashboard."
            className="md:col-span-2"
          />
          <FeatureCard
            icon={<Headphones className="h-5 w-5" />}
            tint="border-rose-500/25 bg-rose-500/10 text-rose-300"
            title="Member support"
            description="Reach the team through the contact page or the official community channel whenever you need help."
            className="md:col-span-2"
          />
        </div>

        <div className="reveal mt-5 flex flex-col items-start justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <Activity className="h-4 w-4 text-amber-400" />
            <p className="font-body text-xs text-slate-400">
              Open the member area to view the live values available for your selected table.
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
