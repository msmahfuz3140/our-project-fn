import React from 'react';
import { UserPlus, MailCheck, CreditCard, LayoutDashboard, ArrowRight } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: <UserPlus className="h-5 w-5" />,
      tint: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
      line: 'from-amber-400/70',
      title: 'Create your account',
      desc: 'Register with your email and a referral code from an existing member.'
    },
    {
      num: '02',
      icon: <MailCheck className="h-5 w-5" />,
      tint: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
      line: 'from-emerald-400/70',
      title: 'Verify your email',
      desc: 'Enter the one-time code we send you to activate your account securely.'
    },
    {
      num: '03',
      icon: <CreditCard className="h-5 w-5" />,
      tint: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
      line: 'from-rose-400/70',
      title: 'Choose your pass',
      desc: 'Pick the access period that fits you and complete checkout with a supported cryptocurrency.'
    },
    {
      num: '04',
      icon: <LayoutDashboard className="h-5 w-5" />,
      tint: 'border-sky-500/25 bg-sky-500/10 text-sky-300',
      line: 'from-sky-400/70',
      title: 'Open your dashboard',
      desc: 'Use the live table lobby, visual analysis and wallet tools from one member workspace.'
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
              Getting started
            </span>
          </div>
          <h2 className="font-display text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
            From sign-up to <span className="text-gold-shimmer">your dashboard</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-body text-sm leading-relaxed text-slate-400 sm:text-base">
            Four simple steps. No need to learn any technical setup before you begin.
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
                <span>Get started</span>
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
