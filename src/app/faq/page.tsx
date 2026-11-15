'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { Sparkles, ChevronDown, AlertCircle } from 'lucide-react';
import { usePublicSettings } from '../../hooks/usePublicSettings';

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { settings, loading, error } = usePublicSettings();

  const faqs = useMemo(() => {
    return [...(settings?.faqItems || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [settings]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(faqs.map((item) => item.category || 'Platform')));
    return ['All', ...unique];
  }, [faqs]);

  const filteredFaqs = activeCategory === 'All'
    ? faqs
    : faqs.filter((item) => (item.category || 'Platform') === activeCategory);

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden py-20 lg:py-28 border-b border-white/5 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-display text-[11px] font-bold uppercase tracking-widest text-amber-400">
                KNOWLEDGE BASE & TRANSPARENCY
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl font-black uppercase tracking-tight text-white mb-6">
              Frequently Asked <span className="text-amber-400">Questions</span>
            </h1>

            <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
              Published from the live website settings database so administrators can keep answers current without a code deploy.
            </p>

            {!loading && !error && categories.length > 1 && (
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveCategory(category);
                      setOpenIndex(null);
                    }}
                    className={`rounded-lg px-4 py-2 font-display text-xs font-bold uppercase tracking-wider transition-all ${
                      activeCategory === category
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-sm text-rose-200">
                <AlertCircle className="mx-auto mb-2 h-5 w-5" />
                {error}
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-slate-400">
                No published FAQ entries in this category.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq, idx) => {
                  const isOpen = openIndex === idx;
                  return (
                    <div
                      key={`${faq.question}-${idx}`}
                      className="rounded-xl border border-white/10 bg-[#0c1017]/80 backdrop-blur-xl transition-colors hover:border-amber-500/30 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenIndex(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between p-6 text-left transition-colors"
                        aria-expanded={isOpen}
                      >
                        <span className="pr-4">
                          <span className="mb-1 block font-display text-[9px] font-bold uppercase tracking-widest text-amber-400/80">
                            {faq.category || 'Platform'}
                          </span>
                          <span className="font-display text-base font-bold text-white">{faq.question}</span>
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-amber-400 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-6 pt-2 text-sm text-slate-400 leading-relaxed border-t border-white/5">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-16 rounded-xl border border-white/10 bg-[#0a0d14] p-8 text-center">
              <h3 className="font-display text-xl font-bold uppercase text-white mb-2">
                Have a Question Not Answered Here?
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
                Our support desk is available to assist with subscription issues, account security, or moderator inquiries.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500 px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-black hover:bg-amber-400 transition-colors"
              >
                Submit Support Inquiry
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
