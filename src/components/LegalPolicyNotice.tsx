'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { usePublicSettings } from '../hooks/usePublicSettings';

type LegalPolicyKey = 'termsAndConditions' | 'privacyPolicy' | 'subscriptionPolicy' | 'referralPolicy';

export function LegalPolicyNotice({ policyKey }: { policyKey: LegalPolicyKey }) {
  const { settings } = usePublicSettings();
  const text = settings?.legalPolicies?.[policyKey]?.trim();
  if (!text) return null;

  return (
    <section className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5">
      <div className="mb-2 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-amber-400" />
        <h2 className="font-display text-xs font-black uppercase tracking-widest text-amber-300">
          Administrator Policy Notice
        </h2>
      </div>
      <div className="whitespace-pre-wrap font-body text-xs leading-relaxed text-slate-300">{text}</div>
    </section>
  );
}
