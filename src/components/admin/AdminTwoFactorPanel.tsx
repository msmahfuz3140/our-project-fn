'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Smartphone,
  AlertTriangle,
  Lock,
  UserCog,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { authClient } from '../../lib/auth-client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './ToastContext';

interface SetupData {
  otpauthUrl: string;
  manualKey: string;
  issuer: string;
  accountName: string;
  expiresAt: string;
}

export function AdminTwoFactorPanel() {
  const { showToast } = useToast();
  const { logout } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [password, setPassword] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  const [replacement, setReplacement] = useState<SetupData | null>(null);
  const [replacementToken, setReplacementToken] = useState('');
  const [replacementQr, setReplacementQr] = useState('');
  const [replaceCode, setReplaceCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const [ownerTargetId, setOwnerTargetId] = useState('');
  const [ownerReason, setOwnerReason] = useState('');
  const [ownerCode, setOwnerCode] = useState('');

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authClient.getAdminTwoFactorStatus();
      setStatus(data);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to load admin 2FA status.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    let active = true;
    if (replacement?.otpauthUrl) {
      QRCode.toDataURL(replacement.otpauthUrl, { margin: 1, width: 320 })
        .then((url) => {
          if (active) setReplacementQr(url);
        })
        .catch(() => {
          if (active) setReplacementQr('');
        });
    } else {
      setReplacementQr('');
    }
    return () => {
      active = false;
    };
  }, [replacement]);

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast('success', 'Copied to clipboard.');
    } catch {
      showToast('error', 'Clipboard access was unavailable.');
    }
  };

  const regenerateRecoveryCodes = async () => {
    if (!/^\d{6}$/.test(recoveryCodeInput)) {
      showToast('warning', 'Enter your current 6-digit authenticator code.');
      return;
    }
    setActionLoading(true);
    try {
      const result = await authClient.regenerateAdminRecoveryCodes(recoveryCodeInput);
      setRecoveryCodes(result.recoveryCodes || []);
      setRecoveryCodeInput('');
      showToast('success', 'New recovery codes generated. Save them now.');
      await loadStatus();
    } catch (err: any) {
      showToast('error', err?.message || 'Could not regenerate recovery codes.');
    } finally {
      setActionLoading(false);
    }
  };

  const startReplacement = async () => {
    if (!/^\d{6}$/.test(replaceCode)) {
      showToast('warning', 'Enter your current 6-digit authenticator code.');
      return;
    }
    setActionLoading(true);
    try {
      const result = await authClient.startAdminTwoFactorReplacement(replaceCode);
      setReplacement(result?.setup || null);
      setReplacementToken(result?.challengeToken || '');
      setReplaceCode('');
      setNewCode('');
    } catch (err: any) {
      showToast('error', err?.message || 'Could not start authenticator replacement.');
    } finally {
      setActionLoading(false);
    }
  };

  const verifyReplacement = async () => {
    if (!/^\d{6}$/.test(newCode)) {
      showToast('warning', 'Enter the new authenticator code.');
      return;
    }
    setActionLoading(true);
    try {
      const result = await authClient.verifyAdminTwoFactorReplacement({
        challengeToken: replacementToken,
        code: newCode
      });
      setRecoveryCodes(result.recoveryCodes || []);
      setReplacement(null);
      setReplacementToken('');
      setNewCode('');
      showToast('success', 'Authenticator device replaced. Save the new recovery codes.');
      await loadStatus();
    } catch (err: any) {
      showToast('error', err?.message || 'Could not verify the new authenticator.');
    } finally {
      setActionLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!password || !/^\d{6}$/.test(disableCode)) {
      showToast('warning', 'Current password and authenticator code are required.');
      return;
    }
    setActionLoading(true);
    try {
      await authClient.disableAdminTwoFactor({ password, code: disableCode });
      showToast('success', 'Two-step verification disabled. Signing you out.');
      await logout();
      router.push('/golin?redirect=/heda');
    } catch (err: any) {
      showToast('error', err?.message || 'Could not disable two-step verification.');
    } finally {
      setActionLoading(false);
    }
  };

  const resetOtherAdmin = async () => {
    if (!ownerTargetId.trim() || !ownerReason.trim() || !/^\d{6}$/.test(ownerCode)) {
      showToast('warning', 'Target user ID, reason and your current authenticator code are required.');
      return;
    }
    setActionLoading(true);
    try {
      await authClient.resetAdminUserTwoFactor(ownerTargetId.trim(), ownerReason.trim(), ownerCode);
      showToast('success', 'Target admin 2FA reset and audit-logged.');
      setOwnerTargetId('');
      setOwnerReason('');
      setOwnerCode('');
    } catch (err: any) {
      showToast('error', err?.message || 'Could not reset the target admin 2FA.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Admin Two-Step Verification
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Mandatory authenticator-app TOTP for every Admin Panel login. Secrets are encrypted at rest and never
            returned after setup.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadStatus()}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatusCard
          label="Authenticator Status"
          value={status?.enabled ? 'Enabled' : 'Setup Required'}
          tone={status?.enabled ? 'text-emerald-400' : 'text-amber-400'}
        />
        <StatusCard
          label="Recovery Codes Remaining"
          value={status?.recoveryCodesRemaining ?? '—'}
          tone={Number(status?.recoveryCodesRemaining) > 0 ? 'text-sky-400' : 'text-rose-400'}
        />
        <StatusCard
          label="Last Successful 2FA"
          value={status?.lastVerifiedAt ? new Date(status.lastVerifiedAt).toLocaleString() : 'Never'}
          tone="text-slate-200"
        />
      </div>

      {recoveryCodes && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-amber-300">
                Save These Recovery Codes Now
              </h3>
              <p className="mt-1 text-[11px] text-amber-200/80">
                Shown only once. Each code works once and does not disable 2FA.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyValue(recoveryCodes.join('\n'))}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-amber-300"
            >
              <Copy className="h-3 w-3" /> Copy All
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-amber-500/20 bg-black/30 p-3 sm:grid-cols-3">
            {recoveryCodes.map((value) => (
              <span key={value} className="font-mono text-[11px] text-slate-200">{value}</span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRecoveryCodes(null)}
            className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white"
          >
            I have saved them — hide
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#070b14] p-5">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-amber-400" />
            Recovery Codes
          </h3>
          <p className="mt-1 text-[11px] text-slate-400">
            Regenerate after verifying your current authenticator code. Older unused codes are invalidated.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={recoveryCodeInput}
              onChange={(e) => setRecoveryCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              placeholder="6-digit code"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void regenerateRecoveryCodes()}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-black disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#070b14] p-5">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-sky-400" />
            Replace Authenticator Device
          </h3>
          <p className="mt-1 text-[11px] text-slate-400">
            Verify your current authenticator, then scan the new QR code and confirm a new code.
          </p>
          {!replacement ? (
            <div className="mt-3 flex gap-2">
              <input
                value={replaceCode}
                onChange={(e) => setReplaceCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                placeholder="Current 6-digit code"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void startReplacement()}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-sky-300 disabled:opacity-50"
              >
                <Smartphone className="h-3.5 w-3.5" /> Start
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {replacementQr && (
                <div className="flex justify-center rounded-xl bg-white p-3">
                  <img src={replacementQr} alt="New authenticator QR code" className="h-44 w-44" />
                </div>
              )}
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-2.5">
                <code className="min-w-0 flex-1 break-all font-mono text-[10px] text-amber-300">{replacement.manualKey}</code>
                <button type="button" onClick={() => void copyValue(replacement.manualKey)} className="text-slate-400 hover:text-white">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  placeholder="New 6-digit code"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => void verifyReplacement()}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-black disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Verify
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-rose-500/20 bg-[#070b14] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Disable Two-Step Verification
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">
              Requires your current password and authenticator code. You will set up 2FA again on your next login.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDisable((value) => !value)}
            className="self-start rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-rose-300"
          >
            {showDisable ? 'Cancel' : 'Disable 2FA'}
          </button>
        </div>

        {showDisable && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Current password"
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-rose-500 focus:outline-none"
            />
            <input
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              placeholder="Current 6-digit code"
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white placeholder-slate-600 focus:border-rose-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void disableTwoFactor()}
              disabled={actionLoading}
              className="rounded-xl bg-rose-500 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-black disabled:opacity-50"
            >
              Confirm Disable
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#070b14] p-5">
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <UserCog className="h-4 w-4 text-purple-400" />
          Owner Recovery: Reset Another Admin&apos;s 2FA
        </h3>
        <div className="mt-1 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[10px] leading-relaxed text-amber-200/80">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Use only when the other Main Admin has lost their authenticator and recovery codes. This action is
            permanently audit-logged. The target must set up 2FA again on their next login.
          </span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={ownerTargetId}
            onChange={(e) => setOwnerTargetId(e.target.value)}
            placeholder="Target admin User ID"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none"
          />
          <input
            value={ownerCode}
            onChange={(e) => setOwnerCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            placeholder="Your current 6-digit code"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none"
          />
          <input
            value={ownerReason}
            onChange={(e) => setOwnerReason(e.target.value)}
            placeholder="Mandatory recovery reason"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none sm:col-span-2"
          />
        </div>
        <button
          type="button"
          onClick={() => void resetOtherAdmin()}
          disabled={actionLoading}
          className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-purple-300 disabled:opacity-50"
        >
          <Lock className="h-3.5 w-3.5" /> Reset Target 2FA
        </button>
      </div>
    </div>
  );
}

function StatusCard({ label, value, tone }: { label: string; value: React.ReactNode; tone: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#070b14] p-4">
      <p className="font-display text-[9px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1.5 font-display text-sm font-black ${tone}`}>{value}</p>
    </div>
  );
}
