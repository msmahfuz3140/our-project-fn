'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Clock,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Terminal,
  Activity,
  CreditCard,
  XCircle,
  X,
  RotateCcw
} from 'lucide-react';
import { authClient, OrderDetails } from '../lib/auth-client';
import { useAuth } from '../context/AuthContext';
import { useDisclaimer } from '../context/DisclaimerContext';
import { formatCentsToUsd } from '../shared/plans';

type PaymentStatusMode = 'pending' | 'success' | 'failed';

const TERMINAL_STATUSES = new Set(['FINISHED', 'FAILED', 'EXPIRED', 'REFUNDED', 'REJECTED', 'REVIEW_REQUIRED']);

export function PaymentStatusView({ mode }: { mode: PaymentStatusMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const { requestToolAccess } = useDisclaimer();

  const orderId = searchParams.get('orderId');
  const providerPaymentId = searchParams.get('payment_id') || searchParams.get('NP_id');
  const identifier = orderId || providerPaymentId;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState<{
    planName: string;
    transactionId: string;
    expiry: string | null;
  } | null>(null);
  const refreshedForPayment = useRef(false);

  const load = useCallback(async (background = false) => {
    if (!identifier) {
      setError('No order reference was supplied by the payment provider.');
      setLoading(false);
      return;
    }

    if (background) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await authClient.getPaymentStatus(identifier);
      setOrder(data);
      setError('');

      if (data.status === 'FINISHED' && !refreshedForPayment.current) {
        refreshedForPayment.current = true;
        // Refresh the authenticated user's subscription state from the backend.
        await refreshUser().catch(() => null);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not retrieve the payment status.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [identifier, refreshUser]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!order) return;
    const finalising = order.status === 'FINISHED' && !order.isFulfilled;
    if (TERMINAL_STATUSES.has(order.status) && !finalising) return;

    const timer = setInterval(() => {
      load(true);
    }, 6000);

    return () => clearInterval(timer);
  }, [order?.status, order?.isFulfilled, load]);

  const isFinished = order?.status === 'FINISHED' && order.isFulfilled === true;
  const isFinalising = order?.status === 'FINISHED' && order.isFulfilled !== true;
  const isConfirmedOnly = order?.status === 'CONFIRMED';
  const isReview = order?.status === 'PARTIALLY_PAID' || order?.status === 'REVIEW_REQUIRED';
  const isFailed = order?.status === 'FAILED' || order?.status === 'EXPIRED';
  const isRejected = order?.status === 'REJECTED';
  const isRefunded = order?.status === 'REFUNDED';
  const canOpenCheckout = Boolean(
    order?.checkoutUrl &&
    order.checkoutUrl.startsWith('http') &&
    !order.checkoutUrl.includes('localhost') &&
    !isFinished &&
    !isFinalising &&
    !isFailed &&
    !isRejected &&
    !isRefunded
  );

  const expiry = order?.subscription?.endDate
    ? new Date(order.subscription.endDate).toLocaleString()
    : null;

  // Success toast is shown only after the backend reports a verified, fulfilled
  // FINISHED payment — never because the user merely returned from checkout.
  useEffect(() => {
    if (!isFinished || !order) return;

    const storageKey = `payment-success-toast:${order.orderId}:${order.transactionId || order.providerPaymentId || ''}`;
    const alreadyShown = typeof window !== 'undefined' && sessionStorage.getItem(storageKey) === '1';

    if (!alreadyShown) {
      sessionStorage.setItem(storageKey, '1');
      setSuccessToast({
        planName: order.planName,
        transactionId: order.transactionId || order.providerPaymentId || order.paymentId,
        expiry: order.subscription?.endDate
          ? new Date(order.subscription.endDate).toLocaleString()
          : null
      });
    }

    const timer = setTimeout(() => setSuccessToast(null), 10000);
    return () => clearTimeout(timer);
  }, [
    isFinished,
    order?.orderId,
    order?.transactionId,
    order?.providerPaymentId,
    order?.paymentId,
    order?.planName,
    order?.subscription?.endDate
  ]);

  return (
    <div className="min-h-[60vh] bg-[#06080d] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {successToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-emerald-500/40 bg-[#07120c]/95 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl"
        >
          <div className="flex items-start gap-3 p-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xs font-black uppercase tracking-wider text-emerald-300">
                Payment Verified — Premium Activated
              </p>
              <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-300">
                <p>
                  <span className="text-slate-500">Plan:</span> {successToast.planName}
                </p>
                <p className="break-all">
                  <span className="text-slate-500">Transaction:</span> {successToast.transactionId}
                </p>
                {successToast.expiry && (
                  <p>
                    <span className="text-slate-500">Expires:</span> {successToast.expiry}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              className="text-slate-500 transition-colors hover:text-white"
              aria-label="Dismiss payment success notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent" />
        </div>
      )}
      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0c1017]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-amber-500/10 blur-[90px]" />

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <p className="font-display text-xs uppercase tracking-widest text-slate-400">
                Verifying Payment Status…
              </p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h1 className="mb-2 font-display text-xl font-bold uppercase text-white">Payment Verification Error</h1>
              <p className="mb-6 text-sm text-slate-400">{error}</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => load()}
                  className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-2.5 font-display text-[11px] font-black uppercase tracking-wider text-amber-300 hover:bg-amber-500/20"
                >
                  Try Again
                </button>
                <Link
                  href="/plans"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 font-display text-[11px] font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10"
                >
                  Return to Plans
                </Link>
              </div>
            </div>
          ) : order ? (
            <div>
              <div className="mb-8 text-center">
                {isFinished ? (
                  <>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 font-display text-[10px] font-black uppercase tracking-widest text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      Payment Verified — Premium Activated
                    </div>
                    <h1 className="mb-2 font-display text-2xl font-black uppercase text-white sm:text-3xl">
                      Subscription Successfully Activated
                    </h1>
                    <p className="mx-auto max-w-md text-xs text-slate-400">
                      NOWPayments reached the final <span className="font-mono text-emerald-300">finished</span> state.
                      Your payment was independently verified by our server before access was granted.
                    </p>
                  </>
                ) : isFinalising ? (
                  <>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 font-display text-[10px] font-black uppercase tracking-widest text-emerald-300">
                      <Clock className="h-4 w-4 animate-pulse" />
                      Finalising Your Access
                    </div>
                    <h1 className="mb-2 font-display text-2xl font-black uppercase text-white sm:text-3xl">
                      Payment Confirmed
                    </h1>
                    <p className="mx-auto max-w-md text-xs text-slate-400">
                      The gateway has reached final confirmation. Your subscription is being activated automatically;
                      this page updates on its own.
                    </p>
                  </>
                ) : isReview ? (
                  <>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 font-display text-[10px] font-black uppercase tracking-widest text-amber-300">
                      <AlertTriangle className="h-4 w-4" />
                      Payment Under Review
                    </div>
                    <h1 className="mb-2 font-display text-2xl font-black uppercase text-white sm:text-3xl">
                      Manual Review Required
                    </h1>
                    <p className="mx-auto max-w-md text-xs text-slate-400">
                      A partial or unexpected payment was detected. Premium access is intentionally locked until
                      the amount and settlement are verified. Please contact support with your order number.
                    </p>
                  </>
                ) : isFailed || isRejected ? (
                  <>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-1.5 font-display text-[10px] font-black uppercase tracking-widest text-rose-300">
                      <XCircle className="h-4 w-4" />
                      Payment {order.status}
                    </div>
                    <h1 className="mb-2 font-display text-2xl font-black uppercase text-white sm:text-3xl">
                      {isRejected ? 'Payment Rejected' : 'Payment Did Not Complete'}
                    </h1>
                    <p className="mx-auto max-w-md text-xs text-slate-400">
                      {isRejected
                        ? order.failureReason ||
                          'This payment was rejected by administration after review. No Premium access was granted.'
                        : 'The invoice expired or the transaction failed on-chain. No Premium access was granted.'}
                    </p>
                  </>
                ) : isRefunded ? (
                  <>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-1.5 font-display text-[10px] font-black uppercase tracking-widest text-blue-300">
                      <RotateCcw className="h-4 w-4" />
                      Payment Refunded
                    </div>
                    <h1 className="mb-2 font-display text-2xl font-black uppercase text-white sm:text-3xl">
                      Refund Recorded
                    </h1>
                    <p className="mx-auto max-w-md text-xs text-slate-400">
                      This payment was refunded by the provider. The linked subscription has been revoked.
                    </p>
                  </>
                ) : isConfirmedOnly ? (
                  <>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-1.5 font-display text-[10px] font-black uppercase tracking-widest text-cyan-300">
                      <Clock className="h-4 w-4 animate-pulse" />
                      Blockchain Confirmed — Finalising
                    </div>
                    <h1 className="mb-2 font-display text-2xl font-black uppercase text-white sm:text-3xl">
                      Final Settlement In Progress
                    </h1>
                    <p className="mx-auto max-w-md text-xs text-slate-400">
                      Your transaction is confirmed on-chain. Premium activates only after NOWPayments reports the
                      final <span className="font-mono">finished</span> status. Keep this page open; it refreshes automatically.
                    </p>
                  </>
                ) : mode === 'failed' ? (
                  <>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 font-display text-[10px] font-black uppercase tracking-widest text-amber-300">
                      <CreditCard className="h-4 w-4" />
                      Checkout Cancelled
                    </div>
                    <h1 className="mb-2 font-display text-2xl font-black uppercase text-white sm:text-3xl">
                      You Left the Crypto Checkout
                    </h1>
                    <p className="mx-auto max-w-md text-xs text-slate-400">
                      No access is granted from a redirect or a success URL. If you already sent funds, this page will
                      update automatically after the signed webhook is verified.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 font-display text-[10px] font-black uppercase tracking-widest text-amber-300">
                      <Clock className="h-3.5 w-3.5 animate-pulse" />
                      Awaiting Blockchain Settlement
                    </div>
                    <h1 className="mb-2 font-display text-2xl font-black uppercase text-white sm:text-3xl">
                      Payment Confirmation Pending
                    </h1>
                    <p className="mx-auto max-w-md text-xs text-slate-400">
                      Your order is recorded with a server-side price snapshot. Premium unlocks automatically after a
                      valid, signed NOWPayments IPN reaches the final successful status.
                    </p>
                  </>
                )}
              </div>

              <div className="mb-6 space-y-3 rounded-xl border border-white/10 bg-black/40 p-5 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Order ID:</span>
                  <span className="font-bold text-white">{order.orderId}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Plan:</span>
                  <span className="font-bold text-amber-400">{order.planName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Amount:</span>
                  <span className="font-bold text-emerald-400">
                    {formatCentsToUsd(order.priceCents || Math.round(order.priceUsd * 100))} USD
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Status:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{order.status}</span>
                    <button
                      type="button"
                      onClick={() => load(true)}
                      disabled={refreshing}
                      title="Refresh status"
                      className="p-1 text-slate-400 transition-colors hover:text-white"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Provider:</span>
                  <span className="text-slate-300">NOWPayments</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="max-w-[60%] break-all text-right text-slate-200">
                    {order.transactionId || order.providerPaymentId || order.paymentId || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Server Verification:</span>
                  <span className={order.verified ? 'text-emerald-400' : 'text-amber-300'}>
                    {order.verified ? 'Signature + settlement verified' : 'Awaiting signed IPN'}
                  </span>
                </div>
                {expiry && (
                  <div className="flex items-center justify-between border-t border-white/5 pt-2">
                    <span className="text-slate-400">Premium Expires:</span>
                    <span className="text-emerald-300">{expiry}</span>
                  </div>
                )}
              </div>

              {!isFinished && (
                <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-slate-400">
                  <div className="mb-1 flex items-center gap-1.5 font-display font-bold uppercase tracking-wider text-amber-400">
                    <Activity className="h-3.5 w-3.5" />
                    Security Notice
                  </div>
                  Visiting a success URL or closing this page never activates Premium. Activation requires a valid
                  HMAC-SHA512 NOWPayments webhook, server-side amount/currency checks, and the final successful status.
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                {isFinished ? (
                  <>
                    <Link
                      href="/dashboard/tool"
                      onClick={(event) => {
                        event.preventDefault();
                        requestToolAccess(() => router.push('/dashboard/tool'));
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 font-display text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95"
                    >
                      <Terminal className="h-4 w-4" />
                      Open Prediction Tool
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/dashboard?tab=payments"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3.5 font-display text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10"
                    >
                      Payment History
                    </Link>
                  </>
                ) : (
                  <>
                    {canOpenCheckout && (
                      <a
                        href={order.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500 to-amber-600 py-3 font-display text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95"
                      >
                        Open Crypto Checkout
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <Link
                      href="/plans"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 font-display text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10"
                    >
                      Choose a Plan
                    </Link>
                    <Link
                      href="/dashboard?tab=payments"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 font-display text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10"
                    >
                      Payment History
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
