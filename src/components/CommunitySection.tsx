'use client';

import React from 'react';
import { ArrowUpRight, Users } from 'lucide-react';
import { usePublicSettings } from '../hooks/usePublicSettings';

function TelegramIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M21.87 4.42a1.4 1.4 0 0 0-1.42-.2L3.58 11.1c-.98.38-.97 1.77.01 2.13l4.24 1.56 1.63 5.22c.29.93 1.48 1.17 2.1.43l2.35-2.78 4.2 3.08c.74.54 1.79.14 1.99-.75l3.1-14.15c.12-.54-.14-1.1-.62-1.42h-.71Zm-3.03 2.6-7.83 6.93c-.17.15-.27.36-.29.58l-.38 3.1-1.22-3.9 9.72-6.71Z" />
    </svg>
  );
}

export function CommunitySection() {
  const { settings } = usePublicSettings();
  const community = settings?.community;

  if (!community?.enabled) return null;

  const link = community.telegramLink?.trim();
  if (!link || !/^https?:\/\//i.test(link)) return null;

  const name = community.telegramName?.trim() || 'Roulette Accuracy Official Community';
  const description =
    community.description?.trim() ||
    'Join our official Telegram community for live table alerts, platform updates, and direct access to the Accuracy.tools team.';
  const buttonText = community.buttonText?.trim() || 'Join Our Telegram Community';

  return (
    <section id="community" className="relative px-4 py-16 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-sky-400/20 bg-[#070d18] shadow-[0_0_80px_rgba(14,165,233,0.08)]">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-500/15 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-500/10 blur-[100px]" />
        <div className="pointer-events-none absolute inset-0 bg-cyber-grid opacity-30" />

        <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:p-12">
          <div className="flex items-center gap-4 lg:block">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-400/25 to-sky-600/10 text-sky-300 shadow-lg shadow-sky-500/10 sm:h-20 sm:w-20">
              <TelegramIcon className="h-9 w-9 sm:h-11 sm:w-11" />
            </div>
            <div className="lg:mt-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 font-display text-[9px] font-black uppercase tracking-widest text-sky-300">
                <Users className="h-3 w-3" />
                Official Community
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              Our Community
            </h2>
            <p className="mt-1 font-display text-base font-bold text-sky-300 sm:text-lg">{name}</p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
          </div>

          <div className="flex lg:justify-end">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-400/50 bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-3.5 font-display text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-sky-500/20 transition-all hover:brightness-110 active:scale-[0.98] sm:w-auto"
            >
              <TelegramIcon className="h-4 w-4" />
              <span>{buttonText}</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
