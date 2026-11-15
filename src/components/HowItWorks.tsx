import React from 'react';
import { Layers, Radio, Cpu, Award, ArrowRight } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: <Layers className="h-5 w-5" />,
      tint: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
      line: 'from-amber-400/70',
      title: 'Select strategy',
      desc: 'Pick between Offset Pocket Calculation, Target Streak Pattern, or Dealer Signature Trajectory.'
    },
    {
      num: '02',
      icon: <Radio className="h-5 w-5" />,
      tint: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
      line: 'from-emerald-400/70',
      title: 'Monitor live table',
      desc: 'Connect to any of the 20+ tracked Evolution Gaming and Pragmatic Play tables in the live lobby.'
    },
    {
      num: '03',
      icon: <Cpu className="h-5 w-5" />,
      tint: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
      line: 'from-rose-400/70',
      title: 'Receive predictions',
      desc: 'Get immediate sector placements with neighbor ranges (e.g. 25n1, 0n4) and confirmed spin metrics.'
    },
    {
      num: '04',
      icon: <Award className="h-5 w-5" />,
      tint: 'border-sky-500/25 bg-sky-500/10 text-sky-300',
      line: 'from-sky-400/70',
      title: 'Execute with edge',
      desc: 'Follow the mathematical edge, observe momentum changes, and stop whenever weakening signals fire.'
    }
  ];

  return (
    <section id="how-it-works" className="relative overflow-hidden border-t border-white/[0.06] py-20 sm:py-24">
      <div className="aurora-blob aurora-blob--indigo right-[8%] top-[-8%] h-[300px] w-[360px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto mb-14 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-1.5 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-live-pulse" />
            <span className="font-display text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Four-step workflow
            </span>
          </div>
          <h2 className="font-display text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
            How the engine <span className="text-gold-shimmer">operates</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-body text-sm leading-relaxed text-slate-400 sm:text-base">
            No guesswork. A structured systematic methodology powered by live spin telemetry.
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {/* Connecting line across the desktop timeline */}
          <div className="pointer-events-none absolute left-[8%] right-[8%] top-[4.4rem] hidden h-px bg-gradient-to-r from-amber-500/0 via-white/15 to-amber-500/0 lg:block" />

          {steps.map((step, idx) => (
            <div
              key={idx}
              className="reveal glass glass-hover group relative overflow-hidden rounded-3xl p-5 sm:p-6"
            >
              <div className="mb-5 flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${step.tint} shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-300 group-hover:scale-105`}>
                  {step.icon}
                </div>
                <span className="font-display text-3xl font-black text-white/[0.06] transition-colors duration-300 group-hover:text-white/[0.12]">
                  {step.num}
                </span>
              </div>

              <p className={`mb-1.5 font-display text-[9px] font-bold uppercase tracking-[0.2em] bg-gradient-to-r ${step.line} to-slate-500 bg-clip-text text-transparent`}>
                Step {step.num}
              </p>
              <h3 className="font-display text-base font-black uppercase tracking-tight text-white">
                {step.title}
              </h3>
              <p className="mt-2 font-body text-xs leading-relaxed text-slate-400">
                {step.desc}
              </p>

              <div className="mt-5 flex items-center gap-1.5 font-display text-[8px] font-bold uppercase tracking-[0.18em] text-slate-600 transition-colors group-hover:text-amber-400/80">
                <span>Calibrated</span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>

              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
