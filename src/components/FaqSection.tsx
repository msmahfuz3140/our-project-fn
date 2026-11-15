'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircleQuestion } from 'lucide-react';

const FAQS = [
  {
    q: 'How does the prediction engine generate numbers?',
    a: 'The engine ingests live spin feeds from Evolution Gaming and Pragmatic Play tables, analyzing historical pocket distances (Offset Strategy), win/loss sequence momentum (Target Strategy), and ball travel trajectory consistency across rotations (Dealer Signature Strategy).'
  },
  {
    q: 'Which cryptocurrencies are supported for subscription payment?',
    a: 'We integrate with NOWPayments, supporting popular crypto assets including USDT (TRC20, ERC20), Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), Solana (SOL), and Binance Coin (BNB). Payments are verified on-chain via signed instant payment notifications (IPN).'
  },
  {
    q: 'How fast does my subscription activate after payment?',
    a: 'Subscriptions activate automatically within seconds of NOWPayments receiving the required blockchain network confirmations. The backend verifies the transaction and grants immediate premium access.'
  },
  {
    q: 'How does the 50% Moderator Referral Commission work?',
    a: 'Eligible Moderators appointed by Main Admins receive unique referral links. When referred users subscribe to any of the 5 subscription plans, 50% of the subscription value is calculated and credited to the moderator’s reporting ledger.'
  },
  {
    q: 'Does this platform offer gambling or withdrawal functionality?',
    a: 'No. This application is purely a statistical prediction analytics platform. There are no betting mechanics, no user wallet custody, and no withdrawal functionality in the platform.'
  },
  {
    q: 'Can I test the platform before purchasing a full subscription?',
    a: 'The 15 Days Pass ($150) is the entry tier and includes full live table access for 15 calendar days. The public site also explains the engine pipeline in detail, while authenticated values stay protected for active members.'
  }
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
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
                      {faq.q}
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
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
