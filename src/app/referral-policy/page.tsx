'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { LegalPolicyNotice } from '../../components/LegalPolicyNotice';
import { Share2, Percent, ShieldAlert, Award, FileText } from 'lucide-react';

export default function ReferralPolicyPage() {
  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      <Navbar />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <LegalPolicyNotice policyKey="referralPolicy" />
          {/* Header */}
          <div className="mb-12 border-b border-white/10 pb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 mb-4 text-xs font-bold text-purple-400 font-display uppercase tracking-widest">
              <Share2 className="h-3.5 w-3.5" />
              PARTNER ATTRIBUTION RULES
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-black uppercase text-white mb-2">
              Referral Policy
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Last Updated: January 2026 • Section 11 Platform Governance
            </p>
          </div>

          {/* Referral Policy Content */}
          <div className="space-y-8 text-sm text-slate-300 leading-relaxed font-body">
            {/* Callout */}
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5 text-purple-200">
              <div className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
                <Percent className="h-4 w-4" />
                Moderator 50% Commission Qualification
              </div>
              <p className="text-xs leading-relaxed text-purple-300/90">
                Per Section 11 of the platform specifications, qualifying 50% referral commissions are designated exclusively for approved Moderator accounts. Standard member referrals do not accumulate monetary commission attribution.
              </p>
            </div>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold uppercase text-white tracking-wide">
                1. Program Structure & Roles
              </h2>
              <p>
                The Roulette Accuracy referral system operates under strict role-based authorization:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li><strong className="text-slate-200">Standard Users:</strong> Receive a unique referral code and earn a one-time commission (30% by default) after their referred member&apos;s first fully verified subscription purchase.</li>
                <li><strong className="text-slate-200">Moderator Partners:</strong> Authorized community managers and affiliate creators who have received the <code>MODERATOR</code> role from a Main Admin. They earn a lifetime commission (50% by default) on every eligible verified subscription purchase made through their referral code.</li>
                <li><strong className="text-slate-200">Main Admins:</strong> Designated <code>SUPER_ADMIN</code> accounts oversee platform operations, manage Moderator relationships, control the global commission policy, and their own active referral codes can also be used at registration.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold uppercase text-white tracking-wide">
                2. Referral Earnings &amp; Withdrawals
              </h2>
              <p>
                Roulette Accuracy is an intelligence and analysis service and does not accept betting deposits or hold player gambling balances. Approved referral commissions are credited to a platform earnings wallet. Members can request a withdrawal in a supported cryptocurrency and network; the requested amount is reserved and stays <strong className="text-slate-200">Pending</strong> until an administrator reviews it. Approved payouts are sent manually and marked <strong className="text-slate-200">Paid / Completed</strong> with a transaction reference. Rejected requests return the exact reserved amount to the available balance exactly once.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold uppercase text-white tracking-wide">
                3. Attribution Tracking &amp; Order Snapshots
              </h2>
              <p>
                A valid referral code is required at registration. Before any account is created, the backend resolves the code to an active eligible member, rejects invalid or disabled codes, and permanently stores the referrer&apos;s database user ID on the new account. The relationship cannot be changed later. When the referred member makes an eligible verified purchase, the purchase record snapshots the applicable referrer, commission type, rate and commissionable amount. Integer-cent arithmetic is used for all commission and wallet calculations.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold uppercase text-white tracking-wide">
                4. Prohibited Practices &amp; Self-Referral
              </h2>
              <p>
                Members and Moderators are strictly prohibited from creating duplicate accounts to refer themselves, using another person&apos;s contact details without consent, or attempting to manipulate referral attribution. Self-referral by email alias or phone number is rejected and audit-logged. Any attempt to deploy automated bot clicks, abuse withdrawal requests, or misrepresent the platform through false claims of guaranteed gambling winnings may result in role revocation and account termination.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-xs font-display uppercase tracking-wider text-slate-400">
            <Link href="/terms" className="hover:text-amber-400 transition-colors">Terms & Conditions</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/subscription-policy" className="hover:text-amber-400 transition-colors">Subscription Policy</Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

