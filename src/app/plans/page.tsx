'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { PlansSection } from '../../components/PlansSection';
import { Check, X } from 'lucide-react';
import { authClient } from '../../lib/auth-client';
import { SubscriptionPlan, formatCentsToUsd } from '../../shared/plans';

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    let active = true;
    authClient.getPlans()
      .then((data) => {
        if (active && Array.isArray(data)) setPlans(data);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  const comparisonRows = [
    { name: 'Live Table Surveillance (20+ Tables)', p15: true, p1m: true, p3m: true, p6m: true, p1y: true },
    { name: 'Real-Time Spin Tracking Feed', p15: true, p1m: true, p3m: true, p6m: true, p1y: true },
    { name: 'Offset Strategy (Pocket Distance 0-3)', p15: true, p1m: true, p3m: true, p6m: true, p1y: true },
    { name: 'Telegram Community Support', p15: true, p1m: true, p3m: true, p6m: true, p1y: true },
    { name: 'Target Strategy (W/L Streak Counters)', p15: false, p1m: true, p3m: true, p6m: true, p1y: true },
    { name: 'Momentum Weakening Warning Signals', p15: false, p1m: true, p3m: true, p6m: true, p1y: true },
    { name: 'Automated Hot Table Detection', p15: false, p1m: true, p3m: true, p6m: true, p1y: true },
    { name: 'Dealer Signature Strategy Unlocked', p15: false, p1m: false, p3m: true, p6m: true, p1y: true },
    { name: 'Ball Travel Line (Over/Under) Triggers', p15: false, p1m: false, p3m: true, p6m: true, p1y: true },
    { name: 'VIP Channel & Dedicated Priority Desk', p15: false, p1m: false, p3m: true, p6m: true, p1y: true },
    { name: 'Historical Telemetry Archive Access', p15: false, p1m: false, p3m: false, p6m: true, p1y: true },
    { name: 'Direct 1-on-1 Founder Support Desk', p15: false, p1m: false, p3m: false, p6m: false, p1y: true },
    { name: 'Guaranteed 24/7 Uptime SLA', p15: false, p1m: false, p3m: false, p6m: false, p1y: true }
  ];

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      <Navbar />

      <main className="flex-1">
        {/* Dynamic Plans Section */}
        <PlansSection />

        {/* Feature Comparison Matrix Table */}
        <section id="comparison-matrix" className="py-20 border-t border-white/5 bg-[#0a0d14]/70 scroll-mt-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white mb-3">
                Feature Comparison Matrix
              </h2>
              <p className="text-sm text-slate-400">
                Detailed capabilities mapped across each duration tier. Prices in decimal-safe integer cents.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0c1017]/90 shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 font-display text-xs font-bold uppercase tracking-wider text-slate-300">
                    <th className="py-4 px-6">Capability / Feature</th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="py-4 px-4 text-center">
                        {plan.name}
                        <br />
                        <span className="text-[10px] text-amber-500/80">
                          {formatCentsToUsd(plan.priceCents)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-body text-xs text-slate-300">
                  {comparisonRows.map((row, idx) => {
                    const flags = [row.p15, row.p1m, row.p3m, row.p6m, row.p1y];
                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-6 font-medium text-slate-200">{row.name}</td>
                        {plans.map((plan, planIndex) => (
                          <td key={plan.id} className="py-3.5 px-4 text-center">
                            {flags[planIndex] ? (
                              <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-slate-600 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Note on Calendar Month Expiry */}
            <div className="mt-8 rounded-xl border border-white/10 bg-black/40 p-5 text-xs text-slate-400 leading-relaxed">
              <span className="font-display font-bold text-amber-400 uppercase tracking-wider">Calendar-Month Precision Notice: </span>
              All monthly and annual plans are calculated strictly by calendar months rather than generic 30-day approximations. Leap year February endings and 31-day month boundaries are evaluated accurately on our backend at the moment of order creation.
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
