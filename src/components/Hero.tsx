'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Terminal,
  Activity,
  Target,
  Radar,
  Gauge,
  ChevronDown
} from 'lucide-react';
import { PremiumLockModal } from './PremiumLockModal';
import { AccuracyWheel } from './AccuracyWheel';
import { useAuth } from '../context/AuthContext';
import { useDisclaimer } from '../context/DisclaimerContext';

export function Hero() {
  const router = useRouter();
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { requestToolAccess } = useDisclaimer();

  const handleOpenTool = () => {
    if (user?.hasActiveSubscription || user?.role === 'SUPER_ADMIN') {
      router.push('/dashboard/tool');
    } else if (!isAuthenticated) {
      router.push('/golin?redirect=/dashboard/tool');
    } else {
      setLockModalOpen(true);
    }
  };

  return (
    <>
      <section className="relative overflow-hidden pb-16 pt-14 sm:pb-20 sm:pt-18 lg:pb-28 lg:pt-24">
        {/* Ambient aurora field */}
        <div className="aurora-blob aurora-blob--gold left-[8%] top-[-8%] h-[420px] w-[520px]" />
        <div className="aurora-blob aurora-blob--emerald right-[-6%] top-[18%] h-[380px] w-[440px]" />
        <div className="aurora-blob aurora-blob--indigo bottom-[-10%] left-[34%] h-[320px] w-[420px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-8">
            {/* Copy column */}
            <div className="text-center lg:col-span-6 lg:text-left xl:col-span-6">
              <div className="animate-rise glass inline-flex flex-wrap items-center justify-center gap-2 rounded-full px-3.5 py-2 sm:px-4">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="font-display text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300 sm:text-[10px]">
                  Precision engine v2.4
                </span>
                <span className="hidden h-3 w-px bg-white/15 sm:block" />
                <span className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 sm:text-[10px]">
                  37-pocket mapping
                </span>
              </div>

              <h1 className="animate-rise delay-1 mt-7 font-display text-[2.35rem] font-black uppercase leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[4.15rem]">
                <span className="block text-slate-200">Read the wheel.</span>
                <span className="mt-1 block text-gold-shimmer">Time the pattern.</span>
              </h1>

              <p className="animate-rise delay-2 mx-auto mt-6 max-w-xl font-body text-sm leading-relaxed text-slate-300 sm:text-base lg:mx-0 lg:text-lg">
                <span className="font-semibold text-white">Roulette Accuracy</span> turns live
                European wheel telemetry into a clear, direction-aware precision layer — dealer
                rhythm, n9 sector mapping and travel mathematics in one place.
              </p>

              <div className="animate-rise delay-3 mt-8 flex flex-wrap items-center justify-center gap-3.5 lg:justify-start">
                <button
                  onClick={() => requestToolAccess(handleOpenTool)}
                  className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-emerald-400/60 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 px-6 py-3.5 font-display text-xs font-black uppercase tracking-wider text-black shadow-[0_0_35px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.03] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] active:scale-95"
                >
                  <Terminal className="h-4 w-4" />
                  <span>Open precision tool</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>

                <a
                  href="#plans"
                  className="glass group flex items-center gap-2 rounded-xl px-5 py-3.5 font-display text-xs font-bold uppercase tracking-wider text-amber-300 transition-all hover:border-amber-400/40 hover:text-white active:scale-95"
                >
                  <Sparkles className="h-4 w-4 text-amber-400 transition-transform group-hover:rotate-12" />
                  <span>Explore passes</span>
                </a>
              </div>

              {/* Quick facts */}
              <div className="animate-rise delay-4 mx-auto mt-9 grid max-w-lg grid-cols-3 gap-2.5 lg:mx-0">
                <QuickFact icon={<Target className="h-3.5 w-3.5" />} value="37" label="Pockets mapped" />
                <QuickFact icon={<Radar className="h-3.5 w-3.5" />} value="CW · CCW" label="Independent" />
                <QuickFact icon={<ShieldCheck className="h-3.5 w-3.5" />} value="HMAC" label="Server-signed" />
              </div>

              <div className="animate-rise delay-5 mt-6 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
                <TrustChip icon={<Zap className="h-3.5 w-3.5 text-amber-400" />} text="Instant activation" />
                <TrustChip icon={<Activity className="h-3.5 w-3.5 text-emerald-400" />} text="20+ live tables" />
                <TrustChip icon={<Gauge className="h-3.5 w-3.5 text-sky-400" />} text="Wheel · Travel · Live graph" />
              </div>
            </div>

            {/* Visual column */}
            <div className="animate-rise delay-2 relative lg:col-span-6">
              <div className="relative mx-auto w-full max-w-[560px]">
                {/* Floating glass tags */}
                <div className="animate-float glass absolute -left-3 top-12 z-20 hidden items-center gap-2 rounded-2xl px-3.5 py-2.5 sm:flex lg:-left-8">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                    <Target className="h-4 w-4" />
                  </span>
                  <div className="text-left">
                    <p className="font-display text-[8px] uppercase tracking-widest text-slate-500">Sector map</p>
                    <p className="font-display text-[11px] font-black text-white">n9 · OVER · UNDER</p>
                  </div>
                </div>

                <div className="animate-float-soft glass absolute -right-2 top-1/3 z-20 hidden items-center gap-2 rounded-2xl px-3.5 py-2.5 sm:flex lg:-right-6">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                    <Activity className="h-4 w-4" />
                  </span>
                  <div className="text-left">
                    <p className="font-display text-[8px] uppercase tracking-widest text-slate-500">Rhythm</p>
                    <p className="font-display text-[11px] font-black text-white">Dealer signature</p>
                  </div>
                </div>

                <div className="conic-border glass-strong glass-sheen scanline relative rounded-[2rem] p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      </span>
                      <span className="font-display text-[10px] font-black uppercase tracking-[0.18em] text-white sm:text-xs">
                        Precision pipeline
                      </span>
                    </div>
                    <span className="rounded-md border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 font-display text-[8px] font-black uppercase tracking-[0.16em] text-emerald-300 sm:text-[9px]">
                      Server-side
                    </span>
                  </div>

                  <AccuracyWheel className="mx-auto w-full max-w-[350px]" />

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <PipelineChip label="Travel math" value="Deterministic" />
                    <PipelineChip label="Main sector" value="n9 pocket" />
                    <PipelineChip label="Top ranges" value="n4 over/under" />
                  </div>

                  <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3.5 py-3">
                    <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <div className="text-left">
                      <p className="font-body text-[11px] leading-relaxed text-slate-300">
                        This wheel is illustrative. Real provider values unlock only for
                        authenticated members — no fabricated spins, no fake confidence scores.
                      </p>
                      <button
                        onClick={() => setLockModalOpen(true)}
                        className="mt-1.5 font-display text-[9px] font-bold uppercase tracking-[0.16em] text-amber-400 transition-colors hover:text-amber-300 hover:underline"
                      >
                        View access options →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 font-display text-[9px] uppercase tracking-[0.22em] text-slate-500">
                  <span className="h-px w-8 bg-gradient-to-r from-transparent to-amber-500/60" />
                  Glass-clear intelligence layer
                  <span className="h-px w-8 bg-gradient-to-l from-transparent to-amber-500/60" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 flex justify-center">
            <a
              href="#telemetry"
              className="group flex flex-col items-center gap-1.5 font-display text-[9px] font-bold uppercase tracking-[0.26em] text-slate-500 transition-colors hover:text-amber-300"
            >
              <span>Explore the engine</span>
              <ChevronDown className="h-4 w-4 animate-bounce text-amber-400/70" />
            </a>
          </div>
        </div>
      </section>

      <PremiumLockModal isOpen={lockModalOpen} onClose={() => setLockModalOpen(false)} />
    </>
  );
}

function QuickFact({
  icon,
  value,
  label
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="glass group rounded-xl px-2.5 py-2.5 text-left transition-colors hover:border-amber-400/30 sm:px-3">
      <div className="mb-1 flex items-center gap-1.5 text-amber-400">
        {icon}
        <span className="font-display text-[8px] uppercase tracking-widest text-slate-500">{label}</span>
      </div>
      <p className="font-display text-[11px] font-black tracking-tight text-white sm:text-sm">{value}</p>
    </div>
  );
}

function TrustChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 font-display text-[9px] font-semibold uppercase tracking-wider text-slate-400 backdrop-blur-md">
      {icon}
      {text}
    </span>
  );
}

function PipelineChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-2 py-2 text-center">
      <p className="font-display text-[7px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-0.5 font-display text-[8px] font-bold text-slate-200 sm:text-[9px]">{value}</p>
    </div>
  );
}
