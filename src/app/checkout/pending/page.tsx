'use client';

import React, { Suspense } from 'react';
import { Navbar } from '../../../components/Navbar';
import { Footer } from '../../../components/Footer';
import { PaymentStatusView } from '../../../components/PaymentStatusView';

export default function PendingCheckoutPage() {
  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          }
        >
          <PaymentStatusView mode="pending" />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
