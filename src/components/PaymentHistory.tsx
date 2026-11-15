'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { authClient, PaymentHistoryItem } from '../lib/auth-client';
import { formatCentsToUsd } from '../shared/plans';

function statusMeta(status: string) {
  switch (status) {
    case 'FINISHED':
      return {
        label: 'Confirmed',
        className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
        icon: CheckCircle2
      };
    case 'CONFIRMED':
      return {
        label: 'Blockchain confirmed — finalising',
        className: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
        icon: Clock
      };
    case 'WAITING':
    case 'CONFIRMING':
    case 'SENDING':
      return {
        label: status === 'WAITING' ? 'Awaiting payment' : status === 'CONFIRMING' ? 'Confirming' : 'Processing',
        className: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
        icon: Clock
      };
    case 'PARTIALLY_PAID':
      return {
        label: 'Underpaid',
        className: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
        icon: AlertTriangle
      };
    case 'REVIEW_REQUIRED':
      return {
        label: 'Manual review',
        className: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
        icon: ShieldCheck
      };
    case 'REFUNDED':
      return {
        label: 'Refunded',
        className: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
        icon: RotateCcw
      };
    case 'FAILED':
    case 'EXPIRED':
      return {
        label: status === 'FAILED' ? 'Failed' : 'Expired',
        className: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
        icon: XCircle
      };
    default:
      return {
        label: status,
        className: 'border-slate-600/40 bg-slate-500/10 text-slate-300',
        icon: Clock
      };
  }
}

function shortHash(value?: string): string {
  if (!value) return '—';
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}

export function PaymentHistory() {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const result = await authClient.getPaymentHistory({ page, limit: 20 });
      setPayments(Array.isArray(result.payments) ? result.payments : []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (err: any) {
      setError(err?.message || 'Could not load your payment history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
            Payment History
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Every crypto payment, provider reference and subscription activation linked to your account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchHistory(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b101a]/80 backdrop-blur-xl">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-white/10 bg-white/[0.03] font-display text-[10px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3.5">Order Number</th>
                <th className="px-4 py-3.5">Plan</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Method</th>
                <th className="px-4 py-3.5">Transaction ID</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                      <span className="font-display text-[10px] uppercase tracking-widest text-slate-500">
                        Loading payment ledger…
                      </span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <CreditCard className="mx-auto mb-3 h-8 w-8 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-300">No payments yet</p>
                    <p className="mt-1 text-xs text-slate-500">Your crypto payment receipts will appear here.</p>
                    <Link
                      href="/plans"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 font-display text-[10px] font-black uppercase tracking-wider text-amber-300 hover:bg-amber-500/20"
                    >
                      Choose a Plan <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const meta = statusMeta(payment.status);
                  const Icon = meta.icon;
                  return (
                    <tr key={`${payment.orderId}-${payment.paymentId}`} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-[11px] font-semibold text-white">{payment.orderId}</div>
                        <div className="mt-0.5 font-mono text-[9px] text-slate-500">
                          {payment.providerPaymentId ? `NP: ${payment.providerPaymentId}` : payment.paymentId}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-display text-[11px] font-bold text-amber-300">{payment.planName}</div>
                        <div className="text-[10px] text-slate-500">{payment.planId.replace(/_/g, ' ')}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-emerald-400">
                          {formatCentsToUsd(payment.priceCents || Math.round(payment.priceAmount * 100))}
                        </div>
                        <div className="text-[10px] uppercase text-slate-500">{payment.priceCurrency || 'USD'}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-[10px] uppercase text-slate-200">
                          {payment.paymentMethod || payment.payCurrency || 'Crypto'}
                        </div>
                        {payment.actuallyPaid !== undefined && (
                          <div className="text-[9px] text-slate-500">
                            Paid {payment.actuallyPaid} {payment.payCurrency}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-[10px] text-slate-400" title={payment.transactionId || undefined}>
                          {shortHash(payment.transactionId)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${meta.className}`}>
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </span>
                        {payment.verified && (
                          <div className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-emerald-400">
                            <ShieldCheck className="h-2.5 w-2.5" /> Verified
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[10px] text-slate-400">
                        {new Date(payment.paidAt || payment.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-white/5 md:hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          ) : payments.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Search className="mx-auto mb-3 h-7 w-7 text-slate-600" />
              <p className="text-sm text-slate-400">No payment records found.</p>
            </div>
          ) : (
            payments.map((payment) => {
              const meta = statusMeta(payment.status);
              const Icon = meta.icon;
              return (
                <div key={`${payment.orderId}-mobile`} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-[11px] font-semibold text-white">{payment.orderId}</div>
                      <div className="font-display text-xs font-bold text-amber-300">{payment.planName}</div>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase ${meta.className}`}>
                      <Icon className="h-2.5 w-2.5" /> {meta.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="block text-slate-500">Amount</span>
                      <span className="font-bold text-emerald-400">
                        {formatCentsToUsd(payment.priceCents || Math.round(payment.priceAmount * 100))}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Method</span>
                      <span className="font-mono uppercase text-slate-300">{payment.paymentMethod || payment.payCurrency}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-slate-500">Transaction</span>
                      <span className="break-all font-mono text-slate-400">{payment.transactionId || '—'}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[9px] text-slate-500">
                    {new Date(payment.paidAt || payment.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-3">
          <div className="text-[10px] text-slate-500">
            Showing <span className="font-semibold text-slate-200">{payments.length}</span> of{' '}
            <span className="font-semibold text-slate-200">{total}</span> records
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] text-slate-400">Page {page} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
