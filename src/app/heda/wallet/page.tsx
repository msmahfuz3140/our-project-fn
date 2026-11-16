'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Wallet,
  Search,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  History,
  Users,
  DollarSign,
  ArrowDownToLine,
  X,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { authClient } from '../../../lib/auth-client';
import { useDebounce } from '../../../hooks/useDebounce';

function formatCents(cents: number) {
  return `$${(Number(cents || 0) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

const TYPE_LABELS: Record<string, string> = {
  REFERRAL_COMMISSION: 'Referral Commission',
  COMMISSION_REVERSAL: 'Commission Reversal',
  MANUAL_BALANCE_ADD: 'Manual Addition',
  MANUAL_BALANCE_DEDUCT: 'Manual Deduction',
  WITHDRAWAL_RESERVE: 'Withdrawal Reserved',
  WITHDRAWAL_REFUND: 'Withdrawal Refund',
  WITHDRAWAL_PAID: 'Withdrawal Paid',
  WITHDRAWAL_APPROVED: 'Withdrawal Approved',
  ADJUSTMENT: 'Adjustment'
};

export default function AdminWalletPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'wallets' | 'transactions'>('wallets');
  const [stats, setStats] = useState<any>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);  const [typeFilter, setTypeFilter] = useState('ALL');
  const [txStatusFilter, setTxStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [adjustTarget, setAdjustTarget] = useState<any | null>(null);
  const [adjustDirection, setAdjustDirection] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  useEffect(() => {
    const querySearch = searchParams.get('search');
    if (querySearch) setSearch(querySearch);
  }, [searchParams]);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        authClient.getAdminWalletStats(),
        activeTab === 'wallets'
          ? authClient.getAdminReferralWallets({
              search: debouncedSearch.trim() || undefined,
              page,
              limit: 25
            })
          : authClient.getAdminWalletTransactions({
              search: debouncedSearch.trim() || undefined,
              type: typeFilter !== 'ALL' ? typeFilter : undefined,
              status: txStatusFilter !== 'ALL' ? txStatusFilter : undefined,
              startDate: startDate || undefined,
              endDate: endDate || undefined,
              page,
              limit: 25
            })
      ]);
      setStats(statsRes);
      if (activeTab === 'wallets') {
        setWallets(listRes?.wallets || []);
        setTotal(listRes?.total || 0);
        setTotalPages(listRes?.totalPages || 1);
      } else {
        setTransactions(listRes?.transactions || []);
        setTotal(listRes?.total || 0);
        setTotalPages(listRes?.totalPages || 1);
      }
    } catch (err: any) {
      if (!silent) setMessage({ type: 'error', text: err?.message || 'Failed to load wallet data.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, debouncedSearch, typeFilter, txStatusFilter, startDate, endDate, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAdjust = (wallet: any, direction: 'ADD' | 'DEDUCT') => {
    setAdjustTarget(wallet);
    setAdjustDirection(direction);
    setAdjustAmount('');
    setAdjustReason('');
    setAdjustError('');
  };

  const submitAdjust = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!adjustTarget) return;
    const amount = Number(adjustAmount);
    if (!amount || amount <= 0) {
      setAdjustError('Enter a valid amount greater than zero.');
      return;
    }
    if (adjustReason.trim().length < 3) {
      setAdjustError('A clear reason is required for the audit trail.');
      return;
    }
    setAdjustSubmitting(true);
    setAdjustError('');
    try {
      await authClient.adjustAdminWallet({
        userId: adjustTarget.user.id,
        direction: adjustDirection,
        amountUsd: amount,
        reason: adjustReason.trim(),
        idempotencyKey: `admin-adjust:${adjustTarget.user.id}:${Date.now()}:${Math.random().toString(36).slice(2)}`
      });
      setMessage({
        type: 'success',
        text: `Wallet ${adjustDirection === 'ADD' ? 'credited' : 'debited'} successfully. A permanent transaction record was created.`
      });
      setAdjustTarget(null);
      await load(true);
    } catch (err: any) {
      setAdjustError(err?.message || 'Wallet adjustment failed.');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-wider text-white">Wallet Management</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor balances, adjust funds with permanent audit records, and inspect the complete transaction ledger.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {message && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 text-xs ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Available Balances', value: formatCents(stats.wallet?.totalAvailableCents), icon: Wallet, color: 'text-emerald-300' },
            { label: 'Reserved Withdrawals', value: formatCents(stats.wallet?.totalReservedCents), icon: ArrowDownToLine, color: 'text-amber-300' },
            { label: 'Lifetime Commissions', value: formatCents(stats.wallet?.totalLifetimeCommissionCents), icon: Users, color: 'text-sky-300' },
            { label: 'Total Withdrawn', value: formatCents(stats.wallet?.totalWithdrawnCents), icon: DollarSign, color: 'text-purple-300' }
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-800 bg-[#070b14] p-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-display text-[10px] font-bold uppercase tracking-wider">{card.label}</span>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div className={`mt-3 font-display text-2xl font-black ${card.color}`}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setActiveTab('wallets');
            setPage(1);
          }}
          className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider ${
            activeTab === 'wallets'
              ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
              : 'border-slate-800 bg-[#070b14] text-slate-400'
          }`}
        >
          User Wallets
        </button>
        <button
          onClick={() => {
            setActiveTab('transactions');
            setPage(1);
          }}
          className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider ${
            activeTab === 'transactions'
              ? 'border-sky-500/50 bg-sky-500/15 text-sky-300'
              : 'border-slate-800 bg-[#070b14] text-slate-400'
          }`}
        >
          Complete Transaction History
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={
                activeTab === 'wallets'
                  ? 'Search user name, email, ID, or referral code...'
                  : 'Search transaction ID, user, reason, admin email...'
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
          {activeTab === 'transactions' && (
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-300 focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Transaction Types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>
        {activeTab === 'transactions' && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <select
              value={txStatusFilter}
              onChange={(e) => {
                setTxStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Transaction Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="FAILED">Failed</option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
              title="Start date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
              title="End date"
            />
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#070b14] shadow-2xl">
        <div className="overflow-x-auto">
          {activeTab === 'wallets' ? (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-900/40 font-display text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Available</th>
                  <th className="px-4 py-3.5">Reserved</th>
                  <th className="px-4 py-3.5">Commission</th>
                  <th className="px-4 py-3.5">Withdrawn</th>
                  <th className="px-4 py-3.5">Referral</th>
                  <th className="px-4 py-3.5 text-right">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Loading wallets…</td></tr>
                ) : wallets.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No wallets found.</td></tr>
                ) : (
                  wallets.map((entry) => (
                    <tr key={entry.user.id} className="hover:bg-slate-800/20">
                      <td className="px-4 py-4">
                        <div className="text-xs font-bold text-white">{entry.user.name}</div>
                        <div className="text-[11px] text-slate-400">{entry.user.email}</div>
                        <div className="mt-1 font-mono text-[9px] text-slate-500">{entry.user.id}</div>
                        <span className="mt-1 inline-flex rounded border border-slate-700 px-1.5 py-0.5 text-[8px] font-bold uppercase text-slate-400">
                          {entry.user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs font-bold text-emerald-300">{formatCents(entry.wallet.availableBalanceCents)}</td>
                      <td className="px-4 py-4 font-mono text-xs text-amber-300">{formatCents(entry.wallet.reservedWithdrawalCents)}</td>
                      <td className="px-4 py-4 font-mono text-xs text-sky-300">{formatCents(entry.wallet.lifetimeCommissionCents)}</td>
                      <td className="px-4 py-4 font-mono text-xs text-purple-300">{formatCents(entry.wallet.totalWithdrawnCents)}</td>
                      <td className="px-4 py-4">
                        <div className="text-[10px] text-slate-300">
                          {entry.referral.totalReferredUsers} referred · {entry.referral.successfulReferrals} paid
                        </div>
                        <div className="text-[9px] text-amber-300">
                          {Math.round(entry.referral.commissionRate * 100)}% {entry.referral.commissionType === 'LIFETIME' ? 'lifetime' : 'one-time'}
                        </div>
                        <div className={`text-[9px] font-bold ${entry.referral.referralEligible ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {entry.referral.referralEligible ? 'Eligible' : 'Disabled'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openAdjust(entry, 'ADD')}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-emerald-300 hover:bg-emerald-500/20"
                            title="Add balance"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openAdjust(entry, 'DEDUCT')}
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20"
                            title="Deduct balance"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-900/40 font-display text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Transaction</th>
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Balance Change</th>
                  <th className="px-4 py-3.5">Admin / Reason</th>
                  <th className="px-4 py-3.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Loading transactions…</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No transactions found.</td></tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-800/20">
                      <td className="px-4 py-4 font-mono text-[10px] text-slate-400">{tx.transactionId}</td>
                      <td className="px-4 py-4">
                        <div className="text-xs text-white">{tx.userId?.name || '—'}</div>
                        <div className="text-[10px] text-slate-400">{tx.userId?.email || '—'}</div>
                      </td>
                      <td className="px-4 py-4 text-[10px] font-bold text-slate-200">{TYPE_LABELS[tx.type] || tx.type}</td>
                      <td className={`px-4 py-4 font-mono text-xs font-bold ${tx.amountCents > 0 ? 'text-emerald-300' : tx.amountCents < 0 ? 'text-rose-300' : 'text-slate-400'}`}>
                        {tx.amountCents > 0 ? '+' : ''}{formatCents(tx.amountCents)}
                      </td>
                      <td className="px-4 py-4 font-mono text-[10px] text-slate-300">
                        {formatCents(tx.previousAvailableCents)} → {formatCents(tx.newAvailableCents)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="max-w-[220px] text-[10px] text-slate-400">{tx.reason || '—'}</div>
                        {tx.relatedUserId?.email && (
                          <div className="text-[9px] text-sky-400">Referral user: {tx.relatedUserId.email}</div>
                        )}
                        {tx.relatedPaymentId && (
                          <div className="text-[9px] text-slate-500">Payment: {String(tx.relatedPaymentId)}</div>
                        )}
                        {tx.adminEmail && <div className="text-[9px] text-amber-400">By {tx.adminEmail}</div>}
                      </td>
                      <td className="px-4 py-4 text-right text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/30 px-4 py-3 text-xs text-slate-400">
          <span>{total} records</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-slate-800 px-3 py-1.5 disabled:opacity-40">
              Previous
            </button>
            <span>Page {page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-slate-800 px-3 py-1.5 disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      </div>

      {adjustTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <form onSubmit={submitAdjust} className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#070b14] p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-sm font-black uppercase tracking-wider text-white">
                {adjustDirection === 'ADD' ? 'Add Wallet Balance' : 'Deduct Wallet Balance'}
              </h3>
              <button type="button" onClick={() => setAdjustTarget(null)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-xl border border-slate-800 bg-black/30 p-3 text-xs">
              <div className="text-white">{adjustTarget.user.name}</div>
              <div className="text-slate-400">{adjustTarget.user.email}</div>
              <div className="mt-1 font-mono text-emerald-300">
                Available: {formatCents(adjustTarget.wallet.availableBalanceCents)}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount (USD)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 font-mono text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-amber-300">Reason / Admin Note *</label>
              <textarea
                rows={3}
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Required for the permanent financial audit record"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            {adjustError && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {adjustError}
              </div>
            )}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[10px] text-amber-200/80">
              Every manual adjustment creates an immutable wallet transaction with previous balance, new balance, administrator identity, reason and timestamp.
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button type="button" onClick={() => setAdjustTarget(null)} className="rounded-xl border border-slate-700 px-4 py-2 text-[10px] font-bold uppercase text-slate-300">
                Cancel
              </button>
              <button
                type="submit"
                disabled={adjustSubmitting}
                className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider text-black disabled:opacity-50 ${
                  adjustDirection === 'ADD' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              >
                {adjustSubmitting ? 'Saving…' : adjustDirection === 'ADD' ? 'Add Balance' : 'Deduct Balance'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
