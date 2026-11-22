'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Wallet,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  X,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  ArrowDownToLine
} from 'lucide-react';
import { authClient } from '../../../lib/auth-client';
import { useDebounce } from '../../../hooks/useDebounce';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  APPROVED: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  REJECTED: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  PAID: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
};

function formatCents(cents: number) {
  return `$${(Number(cents || 0) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export default function AdminWithdrawalsPage() {
  const searchParams = useSearchParams();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [action, setAction] = useState<{ type: 'approve' | 'reject' | 'paid'; withdrawal: any } | null>(null);
  const [note, setNote] = useState('');
  const [txHash, setTxHash] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    const status = searchParams.get('status') || 'ALL';
    setStatusFilter(status);
    setPage(1);
  }, [searchParams]);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await authClient.getAdminWithdrawals({
        page,
        limit: 25,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: debouncedSearch.trim() || undefined
      });
      setWithdrawals(res?.withdrawals || []);
      setTotal(res?.total || 0);
      setTotalPages(res?.totalPages || 1);
    } catch (err: any) {
      if (!silent) setMessage({ type: 'error', text: err?.message || 'Failed to load withdrawals.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load(true);
    }, 20_000);
    return () => clearInterval(timer);
  }, [load]);

  const openAction = (type: 'approve' | 'reject' | 'paid', withdrawal: any) => {
    setAction({ type, withdrawal });
    setNote('');
    setTxHash('');
    setMessage(null);
  };

  const submitAction = async () => {
    if (!action) return;
    setSubmitting(true);
    setMessage(null);
    try {
      if (action.type === 'approve') {
        await authClient.approveAdminWithdrawal(action.withdrawal._id, note.trim() || undefined);
        setMessage({ type: 'success', text: 'Withdrawal approved. The amount remains reserved until marked paid.' });
      } else if (action.type === 'reject') {
        if (note.trim().length < 3) throw new Error('A rejection reason is required.');
        await authClient.rejectAdminWithdrawal(action.withdrawal._id, note.trim());
        setMessage({ type: 'success', text: 'Withdrawal rejected and the exact amount refunded to the user’s available balance.' });
      } else {
        if (txHash.trim().length < 6) throw new Error('Enter the transaction hash or payout reference before marking paid.');
        await authClient.markAdminWithdrawalPaid(action.withdrawal._id, txHash.trim());
        setMessage({ type: 'success', text: 'Withdrawal marked as paid/completed. A confirmation email was queued for the user.' });
      }
      setAction(null);
      await load(true);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Withdrawal action failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const copyAddress = async (value: string) => {
    await navigator.clipboard.writeText(value).catch(() => null);
    setCopied(value);
    setTimeout(() => setCopied(''), 1500);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-wider text-white">Withdrawal Requests</h1>
          <p className="mt-1 text-sm text-slate-400">
            Review reserved user balances, approve or reject requests, and record actual payment hashes.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
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

      <div className="flex flex-wrap gap-2">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'PAID'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              statusFilter === status
                ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                : 'border-slate-800 bg-[#070b14] text-slate-400 hover:text-white'
            }`}
          >
            {status === 'ALL' ? 'All Requests' : status}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search request ID, user email/name, wallet address, transaction hash..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#070b14] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/40 font-display text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3.5">Request / User</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Receiving Wallet</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Created</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    Loading withdrawal requests…
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No withdrawal requests match the current filters.
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal._id} className="hover:bg-slate-800/20">
                    <td className="px-4 py-4">
                      <div className="font-mono text-xs font-bold text-amber-300">{withdrawal.requestId}</div>
                      <div className="mt-1 text-xs text-white">{withdrawal.userId?.name || '—'}</div>
                      <div className="text-[11px] text-slate-400">{withdrawal.userId?.email || '—'}</div>
                      <div className="mt-1 text-[9px] uppercase tracking-wider text-slate-500">
                        {withdrawal.userId?.role || 'USER'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-mono text-sm font-black text-emerald-300">
                        {formatCents(withdrawal.amountCents)}
                      </div>
                      <div className="text-[10px] text-slate-500">{withdrawal.currency || 'USD'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
                        {withdrawal.withdrawalCurrency ? `${withdrawal.withdrawalCurrency} · ` : ''}
                        {withdrawal.network}
                      </div>
                      <div className="mt-1 flex max-w-[240px] items-center gap-1">
                        <span className="truncate font-mono text-[10px] text-slate-300">
                          {withdrawal.walletAddress}
                        </span>
                        <button onClick={() => copyAddress(withdrawal.walletAddress)} className="shrink-0 text-slate-500 hover:text-white">
                          {copied === withdrawal.walletAddress ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                      {withdrawal.transactionHash && (
                        <div className="mt-1 max-w-[240px] truncate font-mono text-[9px] text-cyan-400" title={withdrawal.transactionHash}>
                          TX: {withdrawal.transactionHash}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          STATUS_STYLES[withdrawal.status] || STATUS_STYLES.PENDING
                        }`}
                      >
                        {withdrawal.status}
                      </span>
                      {withdrawal.adminNote && (
                        <div className="mt-1 max-w-[180px] text-[9px] text-slate-500">{withdrawal.adminNote}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[10px] text-slate-400">
                      {new Date(withdrawal.createdAt).toLocaleString()}
                      {withdrawal.paidAt && (
                        <div className="mt-1 text-emerald-400">Paid: {new Date(withdrawal.paidAt).toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1.5">
                        {withdrawal.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => openAction('approve', withdrawal)}
                              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-emerald-300 hover:bg-emerald-500/20"
                              title="Approve request"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openAction('reject', withdrawal)}
                              className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20"
                              title="Reject and refund"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {withdrawal.status === 'APPROVED' && (
                          <button
                            onClick={() => openAction('paid', withdrawal)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/20"
                          >
                            <Send className="h-3 w-3" /> Mark Paid
                          </button>
                        )}
                        {withdrawal.status === 'REJECTED' && withdrawal.rejectionReason && (
                          <span className="max-w-[130px] text-right text-[9px] text-rose-400">{withdrawal.rejectionReason}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/30 px-4 py-3 text-xs text-slate-400">
          <span>{total} total requests</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-800 px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-800 px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {action && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#070b14] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-sm font-black uppercase tracking-wider text-white">
                {action.type === 'approve'
                  ? 'Approve Withdrawal'
                  : action.type === 'reject'
                  ? 'Reject & Refund Withdrawal'
                  : 'Mark Withdrawal Paid'}
              </h3>
              <button onClick={() => setAction(null)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-800 bg-black/30 p-3 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">User</span>
                  <span>{action.withdrawal.userId?.email}</span>
                </div>
                <div className="mt-1 flex justify-between gap-3">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-mono font-bold text-emerald-300">{formatCents(action.withdrawal.amountCents)}</span>
                </div>
                <div className="mt-1 flex justify-between gap-3">
                  <span className="text-slate-500">Cryptocurrency</span>
                  <span>{action.withdrawal.withdrawalCurrency || action.withdrawal.currency || 'USD'}</span>
                </div>
                <div className="mt-1 flex justify-between gap-3">
                  <span className="text-slate-500">Network</span>
                  <span>{action.withdrawal.network}</span>
                </div>
                <div className="mt-1 break-all font-mono text-[10px] text-slate-400">{action.withdrawal.walletAddress}</div>
              </div>

              {action.type === 'reject' && (
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-rose-300">
                    Rejection Reason *
                  </label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Reason shown to the user. The reserved amount is refunded immediately."
                    className="w-full rounded-xl border border-rose-500/30 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              )}

              {action.type === 'approve' && (
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Internal Admin Note
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional internal note"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              {action.type === 'paid' && (
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Transaction Hash / Payout Reference *
                  </label>
                  <input
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="On-chain transaction hash or payout reference"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Required. Marking paid permanently completes this withdrawal and sends a confirmation email to the user.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setAction(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAction}
                  disabled={submitting}
                  className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider text-black disabled:opacity-50 ${
                    action.type === 'reject' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                >
                  {submitting ? 'Processing…' : action.type === 'approve' ? 'Approve' : action.type === 'reject' ? 'Reject & Refund' : 'Mark Paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
