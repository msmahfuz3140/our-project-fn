'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircleQuestion, AlertCircle } from 'lucide-react';
import { usePublicSettings } from '../hooks/usePublicSettings';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { settings, loading, error } = usePublicSettings();

  const faqs = useMemo(() => {
    const items = settings?.faqItems || [];
    return [...items]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, 6);
  }, [settings]);

  return (
    <section id="faq" className="relative overflow-hidden border-t border-white/[0.06] py-20 sm:py-24">
      <div className="aurora-blob aurora-blob--gold left-1/2 top-[-10%] h-[300px] w-[480px] -translate-x-1/2" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto mb-12 max-w-xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-1.5 backdrop-blur-md">
            <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-display text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Frequently asked questions
            </span>
          </div>
          <h2 className="font-display text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
            Common questions <span className="text-gold-shimmer">&amp; answers</span>
          </h2>
          <p className="mt-3 font-body text-sm text-slate-400">
            Clear answers about the engine, access and payment flow.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center text-sm text-amber-200">
            <AlertCircle className="mx-auto mb-2 h-5 w-5" />
            {error}
          </div>
        ) : faqs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-slate-400">
            No FAQ entries are published yet.
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={`${faq.question}-${idx}`}
                  className={`reveal glass overflow-hidden rounded-2xl transition-all duration-300 ${
                    isOpen ? 'border-amber-500/30 shadow-[0_0_45px_-24px_rgba(245,158,11,0.45)]' : 'hover:border-white/20'
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-display text-[9px] font-black transition-colors ${
                          isOpen
                            ? 'border-amber-400/40 bg-amber-500/15 text-amber-300'
                            : 'border-white/10 bg-white/[0.03] text-slate-500'
                        }`}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="font-display text-xs font-bold leading-relaxed text-white sm:text-sm">
                        {faq.question}
                      </span>
                    </span>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                        isOpen
                          ? 'rotate-180 border-amber-400/40 bg-amber-500/15 text-amber-300'
                          : 'border-white/10 bg-white/[0.03] text-slate-400'
                      }`}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="flex gap-3 border-t border-white/[0.06] px-5 pb-5 pt-4">
                        <MessageCircleQuestion className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" />
                        <p className="font-body text-xs leading-relaxed text-slate-300 sm:text-sm">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
