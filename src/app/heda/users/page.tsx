import React, { Suspense } from 'react';
import UsersClient from './UsersClient';

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="font-display text-xs uppercase tracking-wider text-slate-400">
            Loading User Management...
          </p>
        </div>
      }
    >
      <UsersClient />
    </Suspense>
  );
}
