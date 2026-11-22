'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import { authClient } from '../../lib/auth-client';
import { Turnstile, TurnstileRef } from '../../components/Turnstile';
import { sanitizeRedirectPath } from '../../lib/safe-redirect';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Copy,
  Check,
  Smartphone,
  RotateCcw,
  Download
} from 'lucide-react';

type AdminChallenge = {
  token: string;
  mode: 'SETUP' | 'VERIFY';
  expiresAt?: string;
  setup?: {
    otpauthUrl: string;
    manualKey: string;
    issuer: string;
    accountName: string;
    expiresAt: string;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const { login, completeAdminTwoFactor } = useAuth();
  const turnstileRef = useRef<TurnstileRef>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [adminChallenge, setAdminChallenge] = useState<AdminChallenge | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [postAuthRedirect, setPostAuthRedirect] = useState('/dashboard');

  const redirectTarget = useMemo(() => {
    if (typeof window === 'undefined') return '/dashboard';
    const params = new URLSearchParams(window.location.search);
    return sanitizeRedirectPath(params.get('redirect'));
  }, []);

  useEffect(() => {
    if (redirectTarget) setPostAuthRedirect(redirectTarget);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin2fa') === 'required') {
        setInfo('Admin Panel access requires authenticator-app two-step verification. Sign in to continue.');
      }
    }
  }, [redirectTarget]);

  useEffect(() => {
    let active = true;
    if (adminChallenge?.mode === 'SETUP' && adminChallenge.setup?.otpauthUrl) {
      QRCode.toDataURL(adminChallenge.setup.otpauthUrl, {
        margin: 1,
        width: 320,
        color: { dark: '#0b1220', light: '#ffffff' }
      })
        .then((url) => {
          if (active) setQrDataUrl(url);
        })
        .catch(() => {
          if (active) setQrDataUrl('');
        });
    } else {
      setQrDataUrl('');
    }
    return () => {
      active = false;
    };
  }, [adminChallenge]);

  const resetAdminChallenge = () => {
    setAdminChallenge(null);
    setTotpCode('');
    setRecoveryMode(false);
    setRecoveryCode('');
    setRecoveryCodes(null);
    setQrDataUrl('');
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const identifier = email.trim();

    if (!identifier) {
      setError('Please enter your email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (!turnstileToken) {
      setError('Please complete the security CAPTCHA verification');
      return;
    }

    setLoading(true);

    try {
      const response = await login({ identifier, password, turnstileToken });

      if (response?.requiresAdmin2FA && response.adminTwoFactorChallengeToken) {
        setAdminChallenge({
          token: response.adminTwoFactorChallengeToken,
          mode: response.adminTwoFactorMode === 'SETUP' ? 'SETUP' : 'VERIFY',
          expiresAt: response.adminTwoFactorExpiresAt,
          setup: response.adminTwoFactorSetup
        });
        setTotpCode('');
        setRecoveryMode(false);
        setRecoveryCode('');
        setError(null);
        setInfo(null);
        return;
      }

      if (response?.user?.mustChangePassword) {
        router.push('/change-password');
        return;
      }

      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const redirectParam = urlParams?.get('redirect');
      router.push(sanitizeRedirectPath(redirectParam));
    } catch (err: any) {
      if (err?.code === 'EMAIL_NOT_VERIFIED') {
        const target = err?.details?.target || identifier;
        router.push(`/verify-otp?target=${encodeURIComponent(target)}&purpose=REGISTRATION`);
        setError('Please verify your email address. We are taking you to the verification page.');
      } else {
        setError(err?.message || 'Invalid email or password. Please verify and try again.');
      }
      turnstileRef.current?.reset();
      setTurnstileToken('');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!adminChallenge) return;
    setError(null);

    if (recoveryMode) {
      if (recoveryCode.replace(/[^A-Za-z0-9]/g, '').length < 8) {
        setError('Enter a valid recovery code.');
        return;
      }
    } else if (!/^\d{6}$/.test(totpCode.trim())) {
      setError('Enter the current 6-digit authenticator code.');
      return;
    }

    setVerifying2FA(true);
    try {
      const response = await authClient.verifyAdminTwoFactor({
        challengeToken: adminChallenge.token,
        ...(recoveryMode ? { recoveryCode: recoveryCode.trim() } : { code: totpCode.trim() })
      });

      await completeAdminTwoFactor(response);

      // Drop the setup secret/challenge from component memory immediately.
      setAdminChallenge(null);
      setTotpCode('');
      setRecoveryCode('');
      setQrDataUrl('');

      const target =
        postAuthRedirect && postAuthRedirect !== '/dashboard'
          ? postAuthRedirect
          : response.user.role === 'SUPER_ADMIN'
            ? '/heda'
            : '/dashboard';
      setPostAuthRedirect(target);

      if (response.recoveryCodes && response.recoveryCodes.length > 0) {
        setRecoveryCodes(response.recoveryCodes);
        setInfo('Two-step verification is enabled. Save your recovery codes now.');
        return;
      }

      router.push(target);
    } catch (err: any) {
      if (err?.code === 'ADMIN_2FA_CHALLENGE_EXPIRED' || err?.status === 401) {
        setError(err?.message || 'The verification challenge expired. Please sign in again.');
      } else {
        setError(err?.message || 'Invalid authenticator code. Please try again.');
      }
    } finally {
      setVerifying2FA(false);
    }
  };

  const copyManualKey = async () => {
    if (!adminChallenge?.setup?.manualKey) return;
    try {
      await navigator.clipboard.writeText(adminChallenge.setup.manualKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      setError('Clipboard access was unavailable. Please copy the setup key manually.');
    }
  };

  const copyRecoveryCodes = async () => {
    if (!recoveryCodes) return;
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      setInfo('Recovery codes copied to clipboard.');
    } catch {
      setError('Clipboard access was unavailable. Please save the codes manually.');
    }
  };

  const isTwoFactorStep = Boolean(adminChallenge) && !recoveryCodes;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-[#06080d]">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="mb-8 text-center relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full p-0.5 bg-gradient-to-br from-amber-400 via-amber-600 to-amber-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-transform group-hover:scale-105">
            <img
              src="/logo.png"
              alt="Roulette Accuracy Official Logo"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <div className="text-left">
            <span className="font-display text-lg font-black tracking-wider text-white">
              ROULETTE <span className="text-amber-400">ACCURACY</span>
            </span>
            <p className="font-display text-[10px] uppercase tracking-widest text-slate-500">
              European Roulette Intelligence
            </p>
          </div>
        </Link>
        <h1 className="mt-6 font-display text-2xl font-black uppercase tracking-wider text-white sm:text-3xl">
          {recoveryCodes
            ? 'Save Your Recovery Codes'
            : adminChallenge?.mode === 'SETUP'
              ? 'Secure Your Admin Account'
              : adminChallenge
                ? 'Two-Step Verification'
                : 'Account Login'}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {recoveryCodes
            ? 'These codes are shown only once. Store them somewhere safe.'
            : adminChallenge?.mode === 'SETUP'
              ? 'Authenticator-app verification is mandatory for Admin Panel access.'
              : adminChallenge
                ? 'Open your authenticator app and enter the current 6-digit code.'
                : 'Sign in using your email and password'}
        </p>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1017]/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative z-10">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{info}</span>
          </div>
        )}

        {recoveryCodes ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
              <Download className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Each code can be used <strong>once</strong> if you lose access to your authenticator. They will not be
                shown again. Do not share them with anyone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/40 p-4">
              {recoveryCodes.map((code) => (
                <span key={code} className="font-mono text-xs text-slate-200">
                  {code}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={copyRecoveryCodes}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10"
              >
                <Copy className="h-3.5 w-3.5" /> Copy All Codes
              </button>
              <button
                type="button"
                onClick={() => router.push(postAuthRedirect || '/heda')}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-amber-500/50 bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-[10px] font-black uppercase tracking-wider text-black hover:brightness-110"
              >
                I Saved Them <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : isTwoFactorStep && adminChallenge ? (
          <div className="space-y-5">
            {adminChallenge.mode === 'SETUP' && adminChallenge.setup && (
              <>
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs leading-relaxed text-amber-100/90">
                  <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <span>
                    Open Google Authenticator, Microsoft Authenticator, Authy or any standard TOTP app and scan the QR
                    code below.
                  </span>
                </div>

                <div className="flex justify-center rounded-2xl border border-white/10 bg-white p-4">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Authenticator QR code" className="h-52 w-52" />
                  ) : (
                    <div className="flex h-52 w-52 items-center justify-center text-center text-xs text-slate-500">
                      Preparing QR code…
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Manual Setup Key
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-3">
                    <code className="min-w-0 flex-1 break-all font-mono text-xs text-amber-300">
                      {adminChallenge.setup.manualKey}
                    </code>
                    <button
                      type="button"
                      onClick={copyManualKey}
                      className="shrink-0 rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white"
                      title="Copy setup key"
                    >
                      {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Account: <span className="font-mono">{adminChallenge.setup.accountName}</span> · Issuer:{' '}
                    <span className="font-mono">{adminChallenge.setup.issuer}</span>
                  </p>
                </div>
              </>
            )}

            <form onSubmit={handleVerify2FA} className="space-y-4">
              {!recoveryMode ? (
                <div>
                  <label className="mb-1.5 block text-center font-display text-xs font-bold uppercase tracking-wider text-slate-300">
                    6-Digit Authenticator Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    autoFocus
                    className="w-full rounded-xl border-2 border-white/15 bg-black/60 py-3.5 text-center font-mono text-2xl font-black tracking-[0.5em] text-amber-400 placeholder-slate-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-center font-display text-xs font-bold uppercase tracking-wider text-slate-300">
                    One-Time Recovery Code
                  </label>
                  <input
                    type="text"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    autoFocus
                    className="w-full rounded-xl border-2 border-white/15 bg-black/60 py-3.5 text-center font-mono text-base font-bold tracking-[0.12em] text-amber-400 placeholder-slate-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    required
                  />
                  <p className="mt-1 text-center text-[10px] text-slate-500">
                    Using a recovery code does not disable two-step verification.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={verifying2FA}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-emerald-500/50 bg-gradient-to-r from-emerald-500 to-teal-600 py-3 font-display text-xs font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
              >
                {verifying2FA ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    {adminChallenge.mode === 'SETUP' ? 'Verify & Enable 2FA' : 'Verify & Login'}
                  </>
                )}
              </button>
            </form>

            {adminChallenge.mode === 'VERIFY' && (
              <button
                type="button"
                onClick={() => {
                  setRecoveryMode((value) => !value);
                  setRecoveryCode('');
                  setTotpCode('');
                  setError(null);
                }}
                className="mx-auto flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300"
              >
                <RotateCcw className="h-3 w-3" />
                {recoveryMode ? 'Use authenticator code instead' : 'Use a recovery code'}
              </button>
            )}

            <button
              type="button"
              onClick={resetAdminChallenge}
              className="w-full text-center font-display text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300"
            >
              Back to password login
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-display text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-display text-xs font-bold uppercase tracking-wider text-slate-300">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="font-display text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Turnstile
                action="login"
                onSuccess={setTurnstileToken}
                onExpire={() => setTurnstileToken('')}
                onError={() => setTurnstileToken('')}
                ref={turnstileRef}
              />

              <button
                type="submit"
                disabled={loading || !turnstileToken}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg border border-amber-500/50 bg-gradient-to-r from-amber-500 to-amber-600 py-3 font-display text-xs font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                ) : (
                  <>
                    Sign In to Platform
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-xs text-slate-400">
                Don&apos;t have an account yet?{' '}
                <Link href="/gerister" className="font-display font-bold text-amber-400 hover:text-amber-300 transition-colors">
                  Create Account
                </Link>
              </p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Admin Panel requires password + authenticator verification</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
