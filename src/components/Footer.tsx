'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, ShieldCheck, Send, Lock, Zap, ArrowUpRight, ArrowRight, Sparkles } from 'lucide-react';
import { usePublicSettings } from '../hooks/usePublicSettings';

export function Footer() {
  const { settings } = usePublicSettings();
  const rawTelegram = settings?.supportContact?.telegram || settings?.socialLinks?.telegram || '';
  let telegramUrl = 'https://t.me/rouletteaccuracy_support';
  if (rawTelegram) {
    telegramUrl = rawTelegram.startsWith('http')
      ? rawTelegram
      : rawTelegram.startsWith('@')
        ? `https://t.me/${rawTelegram.slice(1)}`
        : `https://t.me/${rawTelegram}`;
  }
  const siteName = settings?.siteName || 'Roulette Accuracy';

  return (
    <footer className="relative overflow-hidden border-t border-amber-500/10 bg-[#040609]/80 pt-16 pb-12">
      {/* Top Gold Shimmer Accent Line */}
      <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

      {/* Background ambient lighting */}
      <div className="absolute -bottom-24 left-1/2 h-[260px] w-[560px] -translate-x-1/2 rounded-full bg-amber-500/5 blur-[140px] pointer-events-none" />
      <div className="absolute -right-24 top-0 h-[280px] w-[280px] rounded-full border border-white/[0.04]" />
      <div className="absolute -right-12 top-12 h-[180px] w-[180px] rounded-full border border-dashed border-amber-500/10" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Closing CTA */}
        <div className="glass glass-sheen glass-edge reveal relative mb-14 overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span className="font-display text-[8px] font-black uppercase tracking-[0.22em] text-amber-300">
                  Glass-clear intelligence
                </span>
              </div>
              <h2 className="max-w-2xl font-display text-2xl font-black uppercase leading-tight tracking-tight text-white sm:text-3xl">
                Step into the <span className="text-gold-shimmer">precision layer</span>
              </h2>
              <p className="mt-2 max-w-xl font-body text-sm leading-relaxed text-slate-400">
                Direction-aware telemetry, sector mapping and dealer rhythm in one disciplined
                workspace for European roulette.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
              <Link
                href="/plans"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-5 py-3 font-display text-[10px] font-black uppercase tracking-wider text-black shadow-[0_0_30px_rgba(245,158,11,0.25)] transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] active:scale-95"
              >
                View membership passes
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/gerister"
                className="glass inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-display text-[10px] font-bold uppercase tracking-wider text-slate-200 transition-all hover:border-white/25 hover:text-white active:scale-95"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="group inline-flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-0.5 bg-gradient-to-br from-amber-400 via-amber-600 to-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-transform group-hover:scale-105">
                <img
                  src={settings?.logoUrl || '/logo.png'}
                  alt={`${siteName} logo`}
                  className="h-full w-full scale-110 rounded-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-base font-black tracking-wider text-white">
                  {siteName}
                </span>
                <span className="font-display text-[9px] uppercase tracking-widest text-amber-400/80 -mt-0.5">
                  Precision intelligence
                </span>
              </div>
            </Link>
            <p className="font-body text-xs leading-relaxed text-slate-400">
              Advanced European Roulette predictive analytics software. Designed for disciplined
              systematic pattern recognition across 20+ live casino tables.
            </p>
            <div className="space-y-2 pt-1 font-display text-[11px] text-slate-500">
              <div className="flex items-center gap-2 text-emerald-400/90">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>Non-custodial SaaS • Strict zero withdrawal</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400/90">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span>256-bit cryptographic session integrity</span>
              </div>
            </div>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="mb-4 flex items-center gap-2 font-display text-xs font-black uppercase tracking-wider text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs font-display text-slate-400">
              <li>
                <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-amber-400">
                  Home intelligence
                </Link>
              </li>
              <li>
                <Link href="/features" className="inline-flex items-center gap-1 transition-colors hover:text-amber-400">
                  Features &amp; strategies
                </Link>
              </li>
              <li>
                <Link href="/plans" className="inline-flex items-center gap-1 transition-colors hover:text-amber-400">
                  Subscription plans
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="inline-flex items-center gap-1 transition-colors hover:text-amber-400">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/faq" className="inline-flex items-center gap-1 transition-colors hover:text-amber-400">
                  Frequently asked questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div>
            <h4 className="mb-4 flex items-center gap-2 font-display text-xs font-black uppercase tracking-wider text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Legal &amp; policies
            </h4>
            <ul className="space-y-2.5 text-xs font-display text-slate-400">
              <li><Link href="/terms" className="transition-colors hover:text-amber-400">Terms and conditions</Link></li>
              <li><Link href="/privacy" className="transition-colors hover:text-amber-400">Privacy policy</Link></li>
              <li><Link href="/subscription-policy" className="transition-colors hover:text-amber-400">Subscription policy</Link></li>
              <li><Link href="/referral-policy" className="transition-colors hover:text-amber-400">Referral policy (moderators)</Link></li>
              <li><Link href="/contact" className="transition-colors hover:text-amber-400">Contact support desk</Link></li>
            </ul>
          </div>

          {/* Member Access & Community */}
          <div>
            <h4 className="mb-4 flex items-center gap-2 font-display text-xs font-black uppercase tracking-wider text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              Access &amp; community
            </h4>
            <p className="mb-4 font-body text-xs leading-relaxed text-slate-400">
              Connect with our official team for live telemetry discussions and verified alerts:
            </p>
            <div className="space-y-3">
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass inline-flex w-full items-center justify-between rounded-xl border-teal-500/30 bg-teal-500/10 px-4 py-2.5 font-display text-xs font-bold text-teal-300 transition-all hover:border-teal-400 hover:bg-teal-500/20 hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <Send className="h-3.5 w-3.5" />
                  <span>Official Telegram</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>

              <div className="flex items-center gap-2 pt-2">
                <Link
                  href="/golin"
                  className="w-1/2 rounded-lg border border-white/10 bg-white/5 py-1.5 text-center font-display text-[11px] font-bold uppercase text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/gerister"
                  className="w-1/2 rounded-lg border border-amber-500/40 bg-amber-500/10 py-1.5 text-center font-display text-[11px] font-bold uppercase text-amber-400 transition-colors hover:bg-amber-500/20"
                >
                  Join pro
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 font-display text-[11px] text-slate-500 sm:flex-row">
          <p>{settings?.footerContent?.copyrightText || `© ${siteName}. All rights reserved.`}</p>
          <p className="text-center uppercase tracking-widest text-slate-600 sm:text-right">
            {settings?.footerContent?.disclaimerText || 'Single-zero European roulette intelligence • Strict zero-custody architecture'}
          </p>
        </div>
      </div>
    </footer>
  );
}
