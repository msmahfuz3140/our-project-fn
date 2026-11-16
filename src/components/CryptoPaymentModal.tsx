'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  AlertCircle,
  QrCode,
  ArrowRight,
  Zap,
  Coins,
  Send,
  RefreshCw,
  Clock,
  ReceiptText,
  RotateCcw
} from 'lucide-react';
import { authClient, PurchaseOrderResult, OrderDetails } from '../lib/auth-client';
import { SubscriptionPlan, formatCentsToUsd } from '../shared/plans';
import { useAuth } from '../context/AuthContext';
import { usePublicSettings } from '../hooks/usePublicSettings';
import { PaymentSuccessAnimation } from './PaymentSuccessAnimation';
import Link from 'next/link';

export interface CryptoOption {
  id: string;
  name: string;
  network: string;
  symbol: string;
  iconBg: string;
  badge?: string;
}

export const CRYPTO_OPTIONS: CryptoOption[] = [
  {
    id: 'USDTTRC20',
    name: 'USDT',
    network: 'TRON (TRC-20)',
    symbol: '₮',
    iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    badge: 'Popular'
  },
  {
    id: 'TRX',
    name: 'Tron',
    network: 'Tron (TRX)',
    symbol: '◈',
    iconBg: 'bg-red-500/20 text-red-400 border-red-500/30'
  },
  {
    id: 'BTC',
    name: 'Bitcoin',
    network: 'Bitcoin (BTC)',
    symbol: '₿',
    iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  },
  {
    id: 'ETH',
    name: 'Ethereum',
    network: 'Ethereum (ERC-20)',
    symbol: 'Ξ',
    iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
  },
  {
    id: 'LTC',
    name: 'Litecoin',
    network: 'Litecoin (LTC)',
    symbol: 'Ł',
    iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    badge: 'Low Fee'
  },
  {
    id: 'SOL',
    name: 'Solana',
    network: 'Solana (SOL)',
    symbol: '◎',
    iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  },
  {
    id: 'XMR',
    name: 'Monero',
    network: 'Monero (XMR)',
    symbol: 'ɱ',
    iconBg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    badge: 'Private'
  },
  {
    id: 'TON',
    name: 'Toncoin',
    network: 'TON Network',
    symbol: '💎',
    iconBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    badge: 'Telegram'
  },
  {
    id: 'DOGE',
    name: 'Dogecoin',
    network: 'Dogecoin (DOGE)',
    symbol: 'Ð',
    iconBg: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30'
  },
  {
    id: 'XRP',
    name: 'Ripple',
    network: 'XRP Ledger',
    symbol: '✕',
    iconBg: 'bg-zinc-400/20 text-zinc-300 border-zinc-400/30',
    badge: 'Fast'
  },
  {
    id: 'BNBBSC',
    name: 'BNB',
    network: 'BNB Chain (BEP-20)',
    symbol: 'BNB',
    iconBg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  },
  {
    id: 'USDTERC20',
    name: 'USDT',
    network: 'Ethereum (ERC-20)',
    symbol: '₮',
    iconBg: 'bg-teal-500/20 text-teal-400 border-teal-500/30'
  }
];

type PaymentUiStatus =
  | 'AWAITING'
  | 'CONFIRMING'
  | 'REVIEW'
  | 'SUCCESS'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED';

const TERMINAL_STATUSES = new Set<PaymentUiStatus>(['SUCCESS', 'FAILED', 'EXPIRED', 'REFUNDED']);

function normalizeTelegram(value?: string): string {
  const raw = (value || '').trim();
  if (!raw) return 'https://t.me/roulettetools_support';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://t.me/${raw.replace(/^@/, '')}`;
}

function withInvoiceMessage(url: string, orderId?: string): string {
  if (!orderId) return url;
  try {
    const parsed = new URL(url);
    if (['t.me', 'www.t.me', 'telegram.me', 'www.telegram.me'].includes(parsed.hostname)) {
      parsed.searchParams.set('text', `Payment support for invoice ${orderId}`);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function mapPaymentStatus(details: Partial<OrderDetails>): PaymentUiStatus {
  const status = String(details.status || '').toUpperCase();

  if (details.isFulfilled === true) return 'SUCCESS';
  // FINISHED is final at the gateway. If fulfilment has not yet landed, keep the
  // UI in a short "finalising" state while the backend retries activation; do
  // not show an administrative review warning for a valid final payment.
  if (status === 'FINISHED') return 'CONFIRMING';
  if (['CONFIRMING', 'CONFIRMED', 'SENDING'].includes(status)) return 'CONFIRMING';
  if (['PARTIALLY_PAID', 'REVIEW_REQUIRED'].includes(status)) return 'REVIEW';
  if (status === 'REFUNDED') return 'REFUNDED';
  if (status === 'EXPIRED') return 'EXPIRED';
  if (['FAILED', 'REJECTED'].includes(status)) return 'FAILED';
  return 'AWAITING';
}

const STATUS_META: Record<
  PaymentUiStatus,
  { label: string; hint: string; className: string; dotClass: string }
> = {
  AWAITING: {
    label: 'Awaiting Payment',
    hint: 'Waiting for the blockchain gateway to detect your transfer.',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    dotClass: 'bg-amber-400'
  },
  CONFIRMING: {
    label: 'Pending / Confirming',
    hint: 'Payment detected. Waiting for blockchain or gateway confirmation.',
    className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    dotClass: 'bg-cyan-400'
  },
  REVIEW: {
    label: 'Payment Received — Review',
    hint: 'The payment is detected but final settlement or activation is still pending.',
    className: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    dotClass: 'bg-orange-400'
  },
  SUCCESS: {
    label: 'Success / Paid',
    hint: 'Payment verified. Your subscription is active.',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    dotClass: 'bg-emerald-400'
  },
  FAILED: {
    label: 'Failed',
    hint: 'The payment failed or was rejected. No subscription was activated.',
    className: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    dotClass: 'bg-rose-400'
  },
  EXPIRED: {
    label: 'Expired',
    hint: 'This invoice expired before settlement. No subscription was activated.',
    className: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
    dotClass: 'bg-slate-400'
  },
  REFUNDED: {
    label: 'Refunded',
    hint: 'The payment was refunded and the linked subscription was revoked.',
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    dotClass: 'bg-blue-400'
  }
};

interface CryptoPaymentModalProps {
  plan: SubscriptionPlan;
  onClose: () => void;
}

export function CryptoPaymentModal({ plan, onClose }: CryptoPaymentModalProps) {
  const { refreshUser } = useAuth();
  const { settings } = usePublicSettings();

  const paymentSettings = settings?.paymentSettings;
  const minPlanPriceCents = Number(paymentSettings?.minPlanPriceCents ?? 20);
  const belowMinimum = plan.priceCents < minPlanPriceCents;
  const supportEnabled = paymentSettings?.paymentSupportEnabled !== false;
  const supportBaseUrl = normalizeTelegram(
    paymentSettings?.paymentSupportTelegram ||
      settings?.supportContact?.telegram ||
      settings?.socialLinks?.telegram ||
      'https://t.me/roulettetools_support'
  );

  const [selectedCoin, setSelectedCoin] = useState<CryptoOption | null>(null);
  const [order, setOrder] = useState<PurchaseOrderResult | OrderDetails | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedField, setCopiedField] = useState<'amount' | 'address' | null>(null);
  const [status, setStatus] = useState<PaymentUiStatus>('AWAITING');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const invoiceLockRef = useRef(false);
  const successHandledRef = useRef(false);

  const supportUrl = withInvoiceMessage(supportBaseUrl, order?.orderId);

  const applyOrderDetails = useCallback(
    (details: OrderDetails) => {
      setOrder((previous) => (previous ? { ...previous, ...details } : details));
      const nextStatus = mapPaymentStatus(details);
      setStatus(nextStatus);
      setLastCheckedAt(new Date());

      if (nextStatus === 'SUCCESS' && !successHandledRef.current) {
        successHandledRef.current = true;
        setToastMessage('Payment verified. Your subscription has been activated successfully.');
        void refreshUser().catch(() => null);
      }
    },
    [refreshUser]
  );

  const createInvoice = async () => {
    if (!selectedCoin || creatingInvoice || invoiceLockRef.current) return;
    if (belowMinimum) {
      setError(`This plan is below the current platform minimum of ${formatCentsToUsd(minPlanPriceCents)}.`);
      return;
    }

    invoiceLockRef.current = true;
    setCreatingInvoice(true);
    setError(null);
    setQrDataUrl('');

    try {
      const result = await authClient.createPurchaseOrder(plan.id, selectedCoin.id);
      setOrder(result);
      setStatus(mapPaymentStatus(result));
      successHandledRef.current = false;

      if (!result.payAddress) {
        setError(
          `Unable to generate a deposit address for ${selectedCoin.name}. Please try another currency such as TRX or LTC.`
        );
        return;
      }

      const qr = await QRCode.toDataURL(result.payAddress, {
        margin: 0,
        width: 320,
        color: { dark: '#000000', light: '#ffffff' }
      });
      setQrDataUrl(qr);
    } catch (err: any) {
      setError(err?.message || 'Unable to create the invoice. Please try again or contact payment support.');
    } finally {
      setCreatingInvoice(false);
      invoiceLockRef.current = false;
    }
  };

  const refreshStatus = useCallback(async () => {
    if (!order?.orderId) return;
    setRefreshing(true);
    try {
      const details = await authClient.getPaymentStatus(order.orderId);
      applyOrderDetails(details);
    } catch (err: any) {
      setError(err?.message || 'Could not refresh the payment status. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [order?.orderId, applyOrderDetails]);

  // Automatic real-time fallback polling. Webhooks remain the primary update
  // path; this polling stops as soon as a terminal state is reached.
  useEffect(() => {
    if (!order?.orderId || TERMINAL_STATUSES.has(status)) return;

    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const details = await authClient.getPaymentStatus(order.orderId);
        if (!cancelled) applyOrderDetails(details);
      } catch {
        // Network hiccups are non-fatal; the manual refresh remains available.
      }
    }, 6000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [order?.orderId, status, applyOrderDetails]);

  const resetInvoice = () => {
    setOrder(null);
    setSelectedCoin(null);
    setStatus('AWAITING');
    setError(null);
    setQrDataUrl('');
    setToastMessage(null);
    setLastCheckedAt(null);
    successHandledRef.current = false;
  };

  const handleCopy = async (text: string, field: 'amount' | 'address') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      // Clipboard permissions are optional.
    }
  };

  const statusMeta = STATUS_META[status];
  const isComplete = status === 'SUCCESS';
  const isFailure = status === 'FAILED' || status === 'EXPIRED' || status === 'REFUNDED';
  const amountValue = order?.payAmount !== undefined ? String(order.payAmount) : '';
  const expiresAt = order?.expiresAt ? new Date(order.expiresAt).toLocaleString() : null;
  const providerReference =
    (order as any)?.providerPaymentId || (order as any)?.paymentId || order?.orderId;

  const SupportButton = ({ className = '' }: { className?: string }) => {
    if (!supportEnabled) return null;
    return (
      <a
        href={supportUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 px-4 py-2.5 font-display text-[11px] font-black uppercase tracking-wider text-sky-300 transition-all hover:bg-sky-500/25 ${className}`}
      >
        <Send className="h-4 w-4" />
        Payment Support
      </a>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {toastMessage && (
        <div role="status" aria-live="polite" className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-emerald-950/95 border border-emerald-500/60 text-white px-4 sm:px-5 py-3 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-in slide-in-from-top-4 duration-300 max-w-[90vw]">
          <div className="p-1.5 rounded-full bg-emerald-500 text-black shrink-0">
            <Check className="h-4 w-4 stroke-[3]" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Payment Successful</p>
            <p className="text-xs text-emerald-100">{toastMessage}</p>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-[#0a0d14] p-3.5 sm:p-6 md:p-7 shadow-[0_0_60px_rgba(245,158,11,0.2)] text-slate-100 scrollbar-thin scrollbar-thumb-white/10">
        <div className="absolute top-0 right-1/4 w-72 h-36 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-36 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex items-start justify-between border-b border-white/10 pb-3 sm:pb-4 mb-4">
          <div className="pr-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-1.5">
              <Zap className="h-3 w-3 text-amber-400" />
              Direct Crypto Payment
            </div>
            <h3 className="font-display text-base sm:text-xl font-black uppercase tracking-tight text-white">
              {plan.name}
            </h3>
            <p className="text-xs text-slate-400">
              {plan.duration?.value
                ? `${plan.duration.value} ${plan.duration.unit.toLowerCase()}`
                : `${plan.durationDays} Days`}{' '}
              Access • Valuation{' '}
              <span className="font-bold text-amber-400">{formatCentsToUsd(plan.priceCents)} USD</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* STEP 1: Select currency and explicitly create invoice */}
        {!order && (
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-amber-400" />
                  Select cryptocurrency & network:
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  Platform minimum: {formatCentsToUsd(minPlanPriceCents)}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 sm:gap-2">
                {CRYPTO_OPTIONS.map((coin) => {
                  const isSelected = selectedCoin?.id === coin.id;
                  return (
                    <button
                      key={coin.id}
                      type="button"
                      disabled={creatingInvoice}
                      onClick={() => {
                        setSelectedCoin(coin);
                        setError(null);
                      }}
                      className={`relative flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border text-center transition-all disabled:opacity-60 ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.25)] text-white'
                          : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/25 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                        <span
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black border shrink-0 ${coin.iconBg}`}
                        >
                          {coin.symbol}
                        </span>
                        <span className="text-[11px] sm:text-xs font-bold text-white truncate max-w-[55px] sm:max-w-none">
                          {coin.name}
                        </span>
                      </div>
                      <span className="text-[8px] sm:text-[9px] text-slate-400 truncate max-w-[70px] sm:max-w-[95px]">
                        {coin.network}
                      </span>
                      {coin.badge && (
                        <span className="absolute -top-1.5 right-1 px-1 py-0.1 bg-amber-500 text-black text-[7px] sm:text-[8px] font-black uppercase rounded-full leading-tight">
                          {coin.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {belowMinimum && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                This plan is below the current platform minimum of{' '}
                <strong>{formatCentsToUsd(minPlanPriceCents)}</strong>. Purchasing is disabled until the plan price or
                platform minimum is adjusted.
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={createInvoice}
              disabled={!selectedCoin || creatingInvoice || belowMinimum}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 font-display text-xs font-black uppercase tracking-wider text-black shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingInvoice ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Invoice…
                </>
              ) : (
                <>
                  <ReceiptText className="h-4 w-4" />
                  Create Invoice
                  {selectedCoin ? ` · ${selectedCoin.name}` : ''}
                </>
              )}
            </button>

            <div className="rounded-xl border border-sky-500/25 bg-gradient-to-r from-sky-950/40 via-sky-900/10 to-transparent p-3">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/40 bg-sky-500/20 text-sky-400">
                    <Send className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Need help with your payment?</p>
                    <p className="text-[10px] text-slate-400">
                      Contact support on Telegram. Never share private keys or wallet passwords.
                    </p>
                  </div>
                </div>
                <SupportButton className="w-full shrink-0 sm:w-auto" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Success */}
        {order && isComplete && (
          <div className="py-4">
            <PaymentSuccessAnimation
              planName={plan.name}
              amountLabel={`${order.payAmount !== undefined ? order.payAmount : plan.priceUsd} ${selectedCoin?.name || ''}`.trim()}
              expirationLabel={
                (order as OrderDetails).subscription?.endDate
                  ? new Date((order as OrderDetails).subscription!.endDate!).toLocaleString()
                  : null
              }
            />

            <div className="mt-2 w-full rounded-2xl border border-emerald-500/20 bg-black/30 p-4 text-left space-y-1">
              <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono text-amber-400">{order.orderId}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1">
                <span className="text-slate-400">Transaction:</span>
                <span className="max-w-[60%] break-all text-right font-mono text-slate-200">
                  {(order as any).transactionId || providerReference || '—'}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 w-full sm:flex-row">
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-display text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={onClose}
                className="py-3 px-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-display text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Failure / expired invoice */}
        {order && isFailure && (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/10 text-rose-400">
              <AlertCircle className="h-9 w-9" />
            </div>
            <div>
              <h4 className="font-display text-lg font-black uppercase tracking-tight text-white">
                Payment {status === 'EXPIRED' ? 'Expired' : status === 'REFUNDED' ? 'Refunded' : 'Failed'}
              </h4>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
                {statusMeta.hint}
                {error ? ` ${error}` : ''}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-left font-mono text-[11px] text-slate-400">
              <div className="flex justify-between gap-3">
                <span>Order ID:</span>
                <span className="break-all text-right text-slate-200">{order.orderId}</span>
              </div>
              <div className="mt-1 flex justify-between gap-3">
                <span>Invoice amount:</span>
                <span className="text-slate-200">
                  {order.payAmount ?? plan.priceUsd} {selectedCoin?.name || ''}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={resetInvoice}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 font-display text-[11px] font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-500/20"
              >
                <RotateCcw className="h-4 w-4" />
                Create New Invoice
              </button>
              <SupportButton />
            </div>
          </div>
        )}

        {/* STEP 4: Awaiting / confirming payment */}
        {order && !isComplete && !isFailure && (
          <div className="space-y-3.5 sm:space-y-4">
            <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-3 text-center">
              <p className="font-display text-xs font-black uppercase tracking-wider text-amber-300 sm:text-sm">
                Send the exact amount shown below to complete your payment.
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Sending a different amount or using the wrong network can delay or permanently lose funds.
              </p>
            </div>

            <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5 ${statusMeta.className}`}>
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-3 w-3 shrink-0">
                  {!TERMINAL_STATUSES.has(status) && (
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${statusMeta.dotClass}`} />
                  )}
                  <span className={`relative inline-flex h-3 w-3 rounded-full ${statusMeta.dotClass}`} />
                </div>
                <div>
                  <p className="text-xs font-bold">{statusMeta.label}</p>
                  <p className="text-[10px] text-slate-400">{statusMeta.hint}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={refreshStatus}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-200 transition-colors hover:bg-black/50 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Checking…' : 'Refresh Payment Status'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.05] via-black/60 to-black/80 items-center">
              <div className="sm:col-span-5 flex flex-col items-center justify-center">
                <div className="w-36 h-36 sm:w-44 sm:h-44 p-2 bg-white rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.2)] flex items-center justify-center overflow-hidden">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Deposit QR Code" className="w-full h-full object-contain block" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center">
                      <QrCode className="h-8 w-8 animate-pulse mb-1 text-slate-500" />
                      <span className="text-[10px] text-slate-500 font-semibold">Generating QR…</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5 font-medium tracking-tight text-center">
                  Scan QR with your crypto wallet
                </span>
              </div>

              <div className="sm:col-span-7 space-y-3 w-full">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Exact payment amount:
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-1 p-2 sm:p-2.5 rounded-xl border border-amber-500/40 bg-black/70 shadow-inner">
                    <div className="truncate">
                      <span className="font-mono text-base sm:text-lg font-black text-amber-400">
                        {amountValue || '—'}{' '}
                      </span>
                      <span className="text-xs font-black text-white">{selectedCoin?.name}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5 block sm:inline">
                        (~{formatCentsToUsd(plan.priceCents)} USD)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => amountValue && handleCopy(amountValue, 'amount')}
                      disabled={!amountValue}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 text-xs font-bold transition-all disabled:opacity-40"
                    >
                      {copiedField === 'amount' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[3]" />
                          <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] text-[11px] text-slate-200 space-y-1">
                  <p className="flex items-center gap-1.5 font-bold text-amber-300">
                    <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
                    Network: {selectedCoin?.network}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Send funds strictly via this network. The invoice is monitored automatically.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl border-2 border-amber-500/40 bg-black/70 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] uppercase tracking-wider font-extrabold text-amber-400">
                  Official Deposit Address:
                </label>
                <span className="text-[10px] text-slate-400 font-mono">{selectedCoin?.network}</span>
              </div>

              {order.payAddress ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 rounded-xl border border-white/15 bg-white/[0.04]">
                  <p className="font-mono text-xs sm:text-[13px] font-bold text-white break-all select-all pr-1">
                    {order.payAddress}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.payAddress!, 'address')}
                    className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
                  >
                    {copiedField === 'address' ? (
                      <>
                        <Check className="h-4 w-4 text-black stroke-[3]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs text-amber-300">
                  Deposit address is not available for this invoice. Please use Payment Support.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-[10px] text-slate-400 sm:grid-cols-2">
              <div className="flex justify-between gap-3 sm:block">
                <span className="text-slate-500">Invoice / Order ID:</span>
                <span className="block break-all text-slate-200">{order.orderId}</span>
              </div>
              <div className="flex justify-between gap-3 sm:block">
                <span className="text-slate-500">Provider Payment ID:</span>
                <span className="block break-all text-slate-200">{providerReference || '—'}</span>
              </div>
              <div className="flex justify-between gap-3 sm:block">
                <span className="text-slate-500">Invoice created:</span>
                <span className="block text-slate-200">
                  {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
                </span>
              </div>
              <div className="flex justify-between gap-3 sm:block">
                <span className="text-slate-500">Invoice expires:</span>
                <span className="block text-slate-200">{expiresAt || 'Set by provider'}</span>
              </div>
              <div className="flex justify-between gap-3 sm:block">
                <span className="text-slate-500">Last automatic check:</span>
                <span className="block text-slate-200">
                  {lastCheckedAt ? lastCheckedAt.toLocaleTimeString() : 'Starting…'}
                </span>
              </div>
              <div className="flex justify-between gap-3 sm:block">
                <span className="text-slate-500">Transaction hash:</span>
                <span className="block break-all text-slate-200">
                  {(order as any).transactionId || 'Available after detection'}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:flex-row">
              <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Status updates automatically every 6 seconds. No page refresh needed.
              </span>
              <SupportButton className="w-full sm:w-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
