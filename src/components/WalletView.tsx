'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Copy,
  Check,
  ArrowDownToLine,
  Clock,
  TrendingUp,
  Users,
  Link2,
  RefreshCw,
  DollarSign,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  History,
  ShieldCheck,
  BadgeCheck
} from 'lucide-react';
import { authClient } from '../lib/auth-client';
import { useAuth } from '../context/AuthContext';

interface WalletSummary {
  wallet: {
    availableBalanceCents: number;
    reservedWithdrawalCents: number;
    totalWalletBalanceCents: number;
    lifetimeCommissionCents: number;
    totalCommissionEarnedCents: number;
    totalWithdrawnCents: number;
  };
  referral: {
    code?: string;
    link?: string;
    totalReferredUsers: number;
    successfulReferrals: number;
    commissionRate: number;
    commissionType: 'ONE_TIME' | 'LIFETIME';
    referralEligible: boolean;
    referralEnabled: boolean;
  };
  withdrawals: any[];
  transactions: any[];
  transactionPagination: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  APPROVED: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  REJECTED: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  PAID: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  COMPLETED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  FAILED: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  REVERSED: 'border-purple-500/30 bg-purple-500/10 text-purple-300'
};

const TYPE_LABELS: Record<string, string> = {
  REFERRAL_COMMISSION: 'Referral Commission',
  COMMISSION_REVERSAL: 'Commission Reversal',
  MANUAL_BALANCE_ADD: 'Manual Balance Addition',
  MANUAL_BALANCE_DEDUCT: 'Manual Balance Deduction',
  WITHDRAWAL_RESERVE: 'Withdrawal Reserved',
  WITHDRAWAL_REFUND: 'Withdrawal Refund',
  WITHDRAWAL_PAID: 'Withdrawal Paid',
  WITHDRAWAL_APPROVED: 'Withdrawal Approved',
  ADJUSTMENT: 'Balance Adjustment'
};

const NETWORKS = ['USDT_TRC20', 'USDT_ERC20', 'USDT_BEP20', 'BTC', 'ETH', 'TRX', 'LTC', 'SOL', 'DOGE', 'OTHER'];

function formatCents(cents: number): string {
  const safe = Number.isFinite(cents) ? cents : 0;
  return `$${(safe / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `wdr_${crypto.randomUUID()}`;
  }
  return `wdr_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function WalletView() {
  const { user } = useAuth();
  const [data, setData] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState('USDT_TRC20');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await authClient.getMyWallet({ limit: 50 });
      setData(response);
      setError('');
    } catch (err: any) {
      if (!silent) setError(err?.message || 'Failed to load wallet data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') void load(true);
    };
    window.addEventListener('focus', refresh);
    const timer = setInterval(refresh, 20_000);
    return () => {
      window.removeEventListener('focus', refresh);
      clearInterval(timer);
    };
  }, [load]);

  const copyValue = async (value: string, field: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setNotice({ type: 'error', text: 'Clipboard access was unavailable. Please copy manually.' });
    }
  };

  const wallet = data?.wallet;
  const referral = data?.referral;
  const availableCents = wallet?.availableBalanceCents || 0;
  const availableUsd = availableCents / 100;
  const requestedUsd = Number(withdrawAmount) || 0;

  const openWithdraw = () => {
    setWithdrawAmount('');
    setWithdrawAddress('');
    setWithdrawNetwork('USDT_TRC20');
    setWithdrawError('');
    setIdempotencyKey(newIdempotencyKey());
    setWithdrawOpen(true);
  };

  const submitWithdrawal = async (event: React.FormEvent) => {
    event.preventDefault();
    setWithdrawError('');
    if (!requestedUsd || requestedUsd <= 0) {
      setWithdrawError('Enter a withdrawal amount greater than zero.');
      return;
    }
    if (Math.round(requestedUsd * 100) > availableCents) {
      setWithdrawError('The requested amount exceeds your available withdrawal balance.');
      return;
    }
    if (withdrawAddress.trim().length < 8) {
      setWithdrawError('Enter a valid receiving wallet address.');
      return;
    }
    if (!withdrawNetwork) {
      setWithdrawError('Select the receiving payment network.');
      return;
    }

    setWithdrawSubmitting(true);
    try {
      await authClient.requestWithdrawal({
        amountUsd: requestedUsd,
        walletAddress: withdrawAddress.trim(),
        network: withdrawNetwork,
        idempotencyKey
      });
      setWithdrawOpen(false);
      setNotice({
        type: 'success',
        text: 'Withdrawal request submitted. The amount is now reserved and pending admin review.'
      });
      await load(true);
    } catch (err: any) {
      setWithdrawError(err?.message || 'Withdrawal request failed.');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const recentWithdrawals = useMemo(() => (data?.withdrawals || []).slice(0, 8), [data?.withdrawals]);
  const recentTransactions = useMemo(() => (data?.transactions || []).slice(0, 20), [data?.transactions]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-[#0b101a]/80 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        <p className="font-display text-xs uppercase tracking-widest text-slate-400">Loading your wallet…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-400" />
        <p className="text-sm text-rose-300">{error || 'Wallet data is unavailable.'}</p>
        <button
          onClick={() => load()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-200"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-black uppercase tracking-tight text-white sm:text-2xl">My Wallet</h2>
          <p className="mt-1 text-xs text-slate-400">
            Referral earnings, available balance, withdrawals and your complete transaction ledger.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            type="button"
            onClick={openWithdraw}
            disabled={availableCents <= 0}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-black shadow-lg shadow-emerald-500/20 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowDownToLine className="h-4 w-4" /> Withdraw
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 text-xs ${
            notice.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Balance cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-[#0b101a] to-[#0b101a] p-5">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="font-display text-[10px] font-black uppercase tracking-widest">Available Balance</span>
            <Wallet className="h-4 w-4" />
          </div>
          <div className="mt-3 font-display text-3xl font-black text-white">{formatCents(availableCents)}</div>
          <p className="mt-1 text-[10px] text-emerald-300/80">Ready for withdrawal</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0b101a]/80 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-display text-[10px] font-black uppercase tracking-widest">Total Wallet Balance</span>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 font-display text-2xl font-black text-white">
            {formatCents(wallet?.totalWalletBalanceCents || 0)}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">Available + reserved withdrawals</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0b101a]/80 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-display text-[10px] font-black uppercase tracking-widest">Total Commission</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 font-display text-2xl font-black text-emerald-300">
            {formatCents(wallet?.totalCommissionEarnedCents || 0)}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            {referral?.commissionType === 'ONE_TIME' ? 'One-time referral earnings' : 'Lifetime referral earnings'}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0b101a]/80 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-display text-[10px] font-black uppercase tracking-widest">Pending Withdrawal</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 font-display text-2xl font-black text-amber-300">
            {formatCents(wallet?.reservedWithdrawalCents || 0)}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            Total withdrawn: {formatCents(wallet?.totalWithdrawnCents || 0)}
          </p>
        </div>
      </div>

      {/* Referral card */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-2xl border border-white/10 bg-[#0b101a]/80 p-5 lg:col-span-7">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Users className="h-4 w-4 text-amber-400" />
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white">Your Referral Program</h3>
            <span
              className={`ml-auto rounded-full border px-2 py-0.5 font-display text-[9px] font-black uppercase tracking-wider ${
                referral?.referralEligible && referral?.referralEnabled
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              {referral?.referralEligible && referral?.referralEnabled ? 'Eligible' : 'Disabled'}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Referred Users</p>
              <p className="mt-1 font-display text-xl font-black text-white">{referral?.totalReferredUsers || 0}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Successful Purchases</p>
              <p className="mt-1 font-display text-xl font-black text-white">{referral?.successfulReferrals || 0}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Commission Rate</p>
              <p className="mt-1 font-display text-xl font-black text-amber-300">
                {Math.round((referral?.commissionRate || 0) * 100)}%
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Earning Type</p>
              <p className="mt-1 font-display text-sm font-black text-emerald-300">
                {referral?.commissionType === 'LIFETIME' ? 'Lifetime' : 'One-Time'}
              </p>
            </div>
          </div>

          {referral?.code && (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Referral Code</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-amber-300">{referral.code}</span>
                  <button
                    onClick={() => copyValue(referral.code!, 'code')}
                    className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white"
                    title="Copy referral code"
                  >
                    {copied === 'code' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Referral Link</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[11px] text-slate-300">{referral.link}</span>
                  <button
                    onClick={() => copyValue(referral.link!, 'link')}
                    className="shrink-0 rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white"
                    title="Copy referral link"
                  >
                    {copied === 'link' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
            {referral?.commissionType === 'LIFETIME'
              ? 'Moderator lifetime commission applies to every eligible verified purchase by your referred customers.'
              : 'Normal-user commission is paid once, after your referred customer’s first eligible verified purchase. Later purchases do not generate another normal-user commission.'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0b101a]/80 p-5 lg:col-span-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <History className="h-4 w-4 text-sky-400" />
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white">Recent Withdrawals</h3>
          </div>
          {recentWithdrawals.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">No withdrawal requests yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {recentWithdrawals.map((withdrawal) => (
                <div key={withdrawal._id} className="rounded-xl border border-white/5 bg-black/25 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-slate-300">{withdrawal.requestId}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        STATUS_STYLES[withdrawal.status] || STATUS_STYLES.PENDING
                      }`}
                    >
                      {withdrawal.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{withdrawal.network}</span>
                    <span className="font-mono text-slate-300">{formatCents(withdrawal.amountCents)}</span>
                  </div>
                  <p className="mt-1 text-[9px] text-slate-500">{new Date(withdrawal.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b101a]/80">
        <div className="flex items-center gap-2 border-b border-white/5 p-4">
          <History className="h-4 w-4 text-amber-400" />
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white">Wallet Transaction History</h3>
          <span className="ml-auto text-[10px] text-slate-500">{data.transactionPagination.total} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-black/25 font-display text-[9px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Balance After</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No wallet transactions yet. Referral commissions and withdrawals will appear here.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-white/[0.025]">
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{transaction.transactionId}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-200">
                        {TYPE_LABELS[transaction.type] || transaction.type}
                      </div>
                      {transaction.reason && (
                        <div className="mt-0.5 max-w-[280px] truncate text-[9px] text-slate-500">{transaction.reason}</div>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 font-mono font-bold ${
                        transaction.amountCents > 0
                          ? 'text-emerald-300'
                          : transaction.amountCents < 0
                          ? 'text-rose-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {transaction.amountCents > 0 ? '+' : ''}
                      {formatCents(transaction.amountCents)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{formatCents(transaction.newAvailableCents)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          STATUS_STYLES[transaction.status] || STATUS_STYLES.PENDING
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[10px] text-slate-500">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal modal */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <form
            onSubmit={submitWithdrawal}
            className="w-full max-w-md space-y-4 rounded-2xl border border-emerald-500/30 bg-[#07100c] p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display text-sm font-black uppercase tracking-wider text-white">Withdraw Funds</h3>
                <p className="mt-1 text-[10px] text-emerald-300">
                  Available: <span className="font-mono font-bold">{formatCents(availableCents)}</span>
                </p>
              </div>
              <button type="button" onClick={() => setWithdrawOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Withdrawal Amount (USD)
              </label>
              <input
                type="number"
                min="0.01"
                max={availableUsd}
                step="0.01"
                required
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Up to ${availableUsd.toFixed(2)}`}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 font-mono text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Receiving Wallet Address
              </label>
              <input
                type="text"
                required
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder="Your personal crypto wallet address"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Payment Network
              </label>
              <select
                value={withdrawNetwork}
                onChange={(e) => setWithdrawNetwork(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                {NETWORKS.map((network) => (
                  <option key={network} value={network}>
                    {network.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {withdrawError && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[10px] leading-relaxed text-amber-200/80">
              The requested amount is reserved immediately. If the admin rejects the request, the exact amount is
              returned to your available balance. Payment is only marked sent after the admin confirms the transfer.
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setWithdrawOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={withdrawSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-black disabled:opacity-50"
              >
                {withdrawSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {withdrawSubmitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
