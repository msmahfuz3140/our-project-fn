import React from 'react';
import { ArrowLeftRight, BarChart3, Cpu, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * Capability strip. Replaces previously unverifiable uptime/prediction-count
 * marketing figures with facts that are true for the shipped engine.
 */
export function StatsBar() {
  const stats = [
    {
      icon: <Cpu className="h-5 w-5" />,
      label: 'Prediction engine',
      value: 'Dealer Signature',
      sub: 'Deterministic travel math',
      accent: 'text-amber-300',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      bar: 'from-amber-400 to-orange-500'
    },
    {
      icon: <ArrowLeftRight className="h-5 w-5" />,
      label: 'Directions',
      value: 'CW · CCW',
      sub: 'Independent calculations',
      accent: 'text-emerald-300',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      bar: 'from-emerald-400 to-teal-500'
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: 'Analysis views',
      value: 'Wheel · Travel · Live',
      sub: 'One synchronized response',
      accent: 'text-sky-300',
      iconBg: 'bg-sky-500/10 border-sky-500/20',
      bar: 'from-sky-400 to-indigo-500'
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      label: 'Key security',
      value: 'Server-side HMAC',
      sub: 'Encrypted at rest',
      accent: 'text-teal-300',
      iconBg: 'bg-teal-500/10 border-teal-500/20',
      bar: 'from-teal-400 to-emerald-500'
    }
  ];

  return (
    <section id="telemetry" className="relative mx-auto max-w-7xl px-4 pb-10 pt-2 sm:px-6 lg:px-8">
      <div className="glass glass-edge relative overflow-hidden rounded-[1.75rem] p-2 sm:p-3">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.018] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.045]"
            >
              <div
                className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl border ${stat.iconBg} ${stat.accent} shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-300 group-hover:scale-105`}
              >
                {stat.icon}
              </div>
              <p className="font-display text-[9px] uppercase tracking-[0.18em] text-slate-500">
                {stat.label}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={`font-display text-sm font-black tracking-tight sm:text-[15px] ${stat.accent}`}>
                  {stat.value}
                </span>
              </div>
              <p className="mt-0.5 font-display text-[9px] tracking-wide text-slate-400">
                {stat.sub}
              </p>
              <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                <div className={`h-full w-1/3 rounded-full bg-gradient-to-r ${stat.bar} opacity-70 transition-all duration-500 group-hover:w-full`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-display text-[9px] uppercase tracking-[0.2em] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-amber-400" />
          No fabricated live values
        </span>
        <span className="hidden h-3 w-px bg-white/10 sm:block" />
        <span>Authenticated provider feed</span>
        <span className="hidden h-3 w-px bg-white/10 sm:block" />
        <span>Subscriber-protected tables</span>
      </div>
    </section>
  );
}
