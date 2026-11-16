'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { authClient } from '../../lib/auth-client';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/golin?redirect=/change-password');
    }
  }, [isLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError('Enter your current or temporary password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setError('Your new password must be different from the temporary password.');
      return;
    }

    setSaving(true);
    try {
      await authClient.changePassword({ oldPassword: currentPassword, newPassword });
      setSuccess('Password updated successfully. Your new password is now active.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
      setTimeout(() => router.replace('/dashboard/tool'), 1500);
    } catch (err: any) {
      setError(err?.message || 'Password update failed. Please verify your current password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-[#06080d]">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="mb-8 text-center relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full p-0.5 bg-gradient-to-br from-amber-400 via-amber-600 to-amber-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-transform group-hover:scale-105">
            <img src="/logo.png" alt="Accuracy.tools Logo" className="h-full w-full rounded-full object-cover" />
          </div>
          <div className="text-left">
            <span className="font-display text-lg font-black tracking-wider text-white">
              ROULETTE <span className="text-amber-400">ACCURACY</span>
            </span>
            <p className="font-display text-[10px] uppercase tracking-widest text-slate-500">
              Secure Account Access
            </p>
          </div>
        </Link>
        <h1 className="mt-6 font-display text-2xl font-black uppercase tracking-wider text-white sm:text-3xl">
          Set a New Password
        </h1>
        <p className="mt-1 text-sm text-slate-400 max-w-sm">
          {user?.mustChangePassword
            ? 'Your account is using a temporary password. Set a private password to continue.'
            : 'Choose a strong new password for your account.'}
        </p>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1017]/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative z-10">
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-display text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Current / Temporary Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-display text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                title={showPassword ? 'Hide passwords' : 'Show passwords'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-display text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !!success}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg border border-amber-500/50 bg-gradient-to-r from-amber-500 to-amber-600 py-3 font-display text-xs font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
          >
            {saving ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : success ? (
              <>
                Redirecting
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Save New Password
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Passwords are bcrypt-hashed and never stored in plaintext</span>
        </div>
      </div>
    </div>
  );
}
