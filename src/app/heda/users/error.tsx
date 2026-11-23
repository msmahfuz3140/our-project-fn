'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('AdminUsersPage Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-rose-500/30 bg-[#070b14] p-8 text-center shadow-2xl">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
        <AlertTriangle className="h-7 w-7 text-rose-400" />
      </div>
      <h2 className="mt-4 font-display text-lg font-black uppercase tracking-wider text-white">
        User Registry Loading Error
      </h2>
      <p className="mt-2 max-w-md text-xs text-slate-400">
        {error?.message || 'An unexpected error occurred while compiling the user administration view.'}
      </p>
      {error?.digest && (
        <p className="mt-1 font-mono text-[10px] text-slate-600">
          Digest: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Loading</span>
        </button>
        <Link
          href="/heda"
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
