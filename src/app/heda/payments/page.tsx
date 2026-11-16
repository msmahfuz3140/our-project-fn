'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { authClient, downloadAuthenticatedFile } from '../../../lib/auth-client';
import { useDebounce } from '../../../hooks/useDebounce';
import {
  CreditCard,
  Search,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
  Info,
  X,
  Eye,
  Wifi,
  WifiOff,
  KeyRound,
  Webhook,
  Activity,
  Copy
} from 'lucide-react';

interface PaymentOrder {
  _id: string;
  orderId: string;
  orderDescription?: string;
  priceAmountUsd?: number;
  priceAmount?: number;
  priceCurrency: string;
  payAmountCrypto?: number;
  payAmount?: number;
  payCurrency: string;
  paymentStatus?: 'WAITING' | 'CONFIRMING' | 'CONFIRMED' | 'SENDING' | 'PARTIALLY_PAID' | 'FINISHED' | 'FAILED' | 'REFUNDED' | 'EXPIRED' | 'REJECTED' | 'REVIEW_REQUIRED';
  status?: string;
  planName?: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  planId: string;
  paymentId?: string;
  providerPaymentId?: string;
  providerInvoiceId?: string;
  transactionId?: string;
  verified?: boolean;
  signatureVerified?: boolean;
  providerVerified?: boolean;
  isFulfilled?: boolean;
  premiumActivated?: boolean;
  actuallyPaid?: number;
  actuallyPaidAmount?: number;
  payAddress?: string;
  network?: string;
  paidAt?: string;
  failureReason?: string;
  subscriptionId?: any;
  createdAt: string;
  updatedAt: string;
}

interface FinancialSummary {
  grossSalesUsd?: number;
  totalGrossUsd?: number;
  refundsUsd?: number;
  paymentFeesUsd?: number;
  netRevenueUsd?: number;
  outstandingCommissionLiabilitiesUsd?: number;
  confirmedCount?: number;
  completedOrders?: number;
  pendingCount?: number;
  pendingOrders?: number;
  failedCount?: number;
  failedOrders?: number;
  totalOrders: number;
  totalTransactions?: number;
  successfulPayments?: number;
  pendingPayments?: number;
  failedPayments?: number;
  refundedPayments?: number;
  verifiedPayments?: number;
  expiredPayments?: number;
  rejectedPayments?: number;
  lastPaymentAt?: string | null;
}

interface PaymentHealth {
  provider?: {
    provider?: string;
    mode?: string;
    apiHost?: string;
    apiKeyConfigured?: boolean;
    ipnSecretConfigured?: boolean;
    liveEnabled?: boolean;
    requireApiVerification?: boolean;
    webhookUrl?: string;
    successUrl?: string;
    cancelUrl?: string;
  };
  databaseConnected?: boolean;
  indexes?: {
    ready?: boolean;
    lastError?: string | null;
    lastEnsuredAt?: string | null;
  };
  webhook?: {
    configured?: boolean;
    url?: string;
    canonicalPath?: string;
    aliases?: string[];
    lastEventAt?: string | null;
    lastEventStatus?: string | null;
    events24h?: number;
    processed24h?: number;
    failed24h?: number;
  };
  providerReachable?: boolean | null;
  providerMessage?: string;
  warnings?: Array<{ variable: string; severity: string; message: string }>;
  checkedAt?: string;
}

export default function AdminPaymentsPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [health, setHealth] = useState<PaymentHealth | null>(null);
  const [healthError, setHealthError] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [copiedRef, setCopiedRef] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [manualAction, setManualAction] = useState<'approve' | 'reject' | null>(null);
  const [manualReason, setManualReason] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualMessage, setManualMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync with URL query parameters for nested sidebar items
  useEffect(() => {
    const statusParam = searchParams.get('status') || 'ALL';
    setStatusFilter(statusParam);
    setPage(1);
  }, [searchParams]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await authClient.getAdminOrdersSummary();
      if (res) {
        setSummary(res);
      }
    } catch (err: any) {
      console.error('Failed to load financial summary:', err);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await authClient.getAdminPaymentHealth();
      setHealth(res);
      setHealthError('');
    } catch (err: any) {
      setHealthError(err?.message || 'Could not load payment integration health.');
    }
  }, []);

  const fetchOrders = useCallback(async (silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    if (!silent) setActionError('');
    try {
      const res = await authClient.getAdminOrders({
        page,
        limit: 20,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: debouncedSearch.trim() || undefined
      });
      if (res && res.orders) {
        setOrders(res.orders);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err: any) {
      if (!silent) setActionError(err.message || 'Failed to load payment orders');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchSummary();
    fetchOrders();
    fetchHealth();
  }, [fetchSummary, fetchOrders, fetchHealth]);

  // Keep the admin payment ledger fresh while the page is open. Silent
  // background refreshes avoid replacing the table with a loading skeleton.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchOrders(true);
        void fetchSummary();
      }
    }, 15_000);
    return () => clearInterval(timer);
  }, [fetchOrders, fetchSummary]);

  const openOrderDetails = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setOrderDetails(null);
    setDetailsError('');
    setManualMessage(null);
    setManualAction(null);
    setDetailsLoading(true);
    try {
      const res = await authClient.getAdminPaymentDetails(orderId);
      setOrderDetails(res);
    } catch (err: any) {
      setDetailsError(err?.message || 'Could not load transaction details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const copyValue = (value?: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value).catch(() => null);
    setCopiedRef(value);
    setTimeout(() => setCopiedRef(''), 1500);
  };

  const openManualAction = (action: 'approve' | 'reject') => {
    setManualAction(action);
    setManualMessage(null);
    setManualReason(
      action === 'approve'
        ? 'NOWPayments reports finished; payment independently verified before manual activation'
        : 'Payment cannot be verified as settled; rejected after provider review'
    );
  };

  const handleManualAction = async () => {
    if (!selectedOrderId || !manualAction) return;
    if (manualReason.trim().length < 3) {
      setManualMessage({ type: 'error', text: 'Enter a clear reason (at least 3 characters) for the audit log.' });
      return;
    }

    setManualSubmitting(true);
    setManualMessage(null);
    try {
      const res =
        manualAction === 'approve'
          ? await authClient.approveAdminPayment(selectedOrderId, manualReason.trim())
          : await authClient.rejectAdminPayment(selectedOrderId, manualReason.trim());

      setManualAction(null);
      await Promise.all([fetchOrders(), fetchSummary()]);
      await openOrderDetails(selectedOrderId);
      setManualMessage({
        type: 'success',
        text:
          res?.message ||
          (manualAction === 'approve'
            ? 'Payment verified and Premium activated.'
            : 'Payment rejected and audit record created.')
      });
    } catch (err: any) {
      setManualMessage({
        type: 'error',
        text: err?.message || `Manual ${manualAction} failed. No subscription was changed.`
      });
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setActionError('');
      await downloadAuthenticatedFile('/payments/admin/export?format=csv', `payments-report-${Date.now()}.csv`);
    } catch (err: any) {
      setActionError(err?.message || 'Could not export the payment report.');
    }
  };

  const detailStatus = String(orderDetails?.status || '');
  const canManualReview = Boolean(
    orderDetails &&
      !orderDetails.isFulfilled &&
      !['REFUNDED', 'REJECTED', 'EXPIRED', 'FAILED'].includes(detailStatus)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-wider text-white">
            Payments & Financial Ledger
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time cryptocurrency payment reconciliations, gross sales tracking, and audit-grade export logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4 text-amber-400" />
            Export Reconciliation CSV
          </button>
          <button
            onClick={() => {
              fetchSummary();
              fetchOrders();
            }}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Financial Health & Accounting Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-slate-400">
                Gross Subscription Sales
              </span>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-3 text-2xl font-black text-white">
              ${(summary.grossSalesUsd || 0).toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Total confirmed top-line receipts ({summary.confirmedCount} orders)
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-slate-400">
                Payment Fees (1% Est.)
              </span>
              <TrendingUp className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-3 text-2xl font-black text-amber-400">
              ${(summary.paymentFeesUsd || 0).toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              NOWPayments blockchain gateway deductions
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-slate-400">
                Commission Liabilities (50%)
              </span>
              <AlertTriangle className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-3 text-2xl font-black text-purple-400">
              ${(summary.outstandingCommissionLiabilitiesUsd || 0).toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Moderator referral ledger accrued earnings
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-slate-400">
                Platform Net Revenue
              </span>
              <ShieldCheck className="h-4 w-4 text-blue-400" />
            </div>
            <div className="mt-3 text-2xl font-black text-blue-400">
              ${(summary.netRevenueUsd || 0).toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Gross less fees & moderator liabilities
            </div>
          </div>
        </div>
      )}

      {/* Payment Status Overview */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Total Transactions', value: summary.totalTransactions ?? summary.totalOrders ?? 0, color: 'text-white' },
            { label: 'Successful', value: summary.successfulPayments ?? summary.completedOrders ?? 0, color: 'text-emerald-400' },
            { label: 'Pending', value: summary.pendingPayments ?? summary.pendingOrders ?? 0, color: 'text-amber-400' },
            { label: 'Failed', value: summary.failedPayments ?? summary.failedOrders ?? 0, color: 'text-rose-400' },
            { label: 'Refunded', value: summary.refundedPayments ?? 0, color: 'text-blue-400' },
            { label: 'Rejected', value: summary.rejectedPayments ?? 0, color: 'text-orange-400' },
            { label: 'Verified', value: summary.verifiedPayments ?? 0, color: 'text-cyan-400' }
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-800 bg-[#070b14] p-4">
              <div className="font-display text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {item.label}
              </div>
              <div className={`mt-1.5 text-xl font-black ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Provider & Webhook Health */}
      <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-4 shadow-xl">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h2 className="font-display text-xs font-black uppercase tracking-wider text-white">
              NOWPayments Integration Health
            </h2>
          </div>
          <button
            type="button"
            onClick={fetchHealth}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="h-3 w-3" /> Recheck
          </button>
        </div>

        {healthError ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {healthError}
          </div>
        ) : health ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <KeyRound className="h-3 w-3" /> Provider
              </div>
              <div className={`mt-1 text-xs font-bold ${health.provider?.apiKeyConfigured ? 'text-emerald-400' : 'text-rose-400'}`}>
                {health.provider?.apiKeyConfigured ? 'API key configured' : 'API key missing'}
              </div>
              <div className="mt-1 text-[9px] font-mono text-slate-500">
                Mode: {health.provider?.mode || 'unknown'} • {health.provider?.apiHost || '—'}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Webhook className="h-3 w-3" /> Webhook
              </div>
              <div className={`mt-1 text-xs font-bold ${health.webhook?.configured ? 'text-emerald-400' : 'text-rose-400'}`}>
                {health.webhook?.configured ? 'IPN secret configured' : 'IPN secret missing'}
              </div>
              <div className="mt-1 text-[9px] font-mono text-slate-500">
                Last 24h: {health.webhook?.processed24h ?? 0} processed / {health.webhook?.failed24h ?? 0} failed
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {health.providerReachable ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />} API Reachability
              </div>
              <div className={`mt-1 text-xs font-bold ${health.providerReachable ? 'text-emerald-400' : 'text-amber-400'}`}>
                {health.providerReachable ? 'Reachable' : 'Not reachable / not checked'}
              </div>
              <div className="mt-1 truncate text-[9px] font-mono text-slate-500" title={health.providerMessage}>
                {health.providerMessage || '—'}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Activity className="h-3 w-3" /> Live Mode
              </div>
              <div className={`mt-1 text-xs font-bold ${health.provider?.mode === 'production' && health.provider?.liveEnabled ? 'text-amber-300' : 'text-slate-300'}`}>
                {health.provider?.mode === 'sandbox'
                  ? 'Sandbox mode'
                  : health.provider?.liveEnabled
                  ? 'Live enabled'
                  : 'Live disabled'}
              </div>
              <div className="mt-1 text-[9px] text-slate-500">
                DB: {health.databaseConnected ? 'connected' : 'disconnected'} • Indexes:{' '}
                {health.indexes?.ready ? 'ready' : 'pending/failed'}
              </div>
            </div>

            <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-3 lg:col-span-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Webhook URL</div>
              <div className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-black/50 px-2 py-1 text-[10px] text-amber-300">
                  {health.webhook?.url || 'Not configured'}
                </code>
                <button
                  type="button"
                  onClick={() => copyValue(health.webhook?.url)}
                  className="rounded border border-slate-700 p-1 text-slate-400 hover:text-white"
                  title="Copy webhook URL"
                >
                  <Copy className="h-3 w-3" />
                </button>
                {copiedRef === health.webhook?.url && (
                  <span className="text-[9px] text-emerald-400">Copied</span>
                )}
              </div>
              {!!health.warnings?.length && (
                <div className="mt-2 space-y-1">
                  {health.warnings.slice(0, 4).map((warning, index) => (
                    <div key={`${warning.variable}-${index}`} className={`text-[10px] ${warning.severity === 'ERROR' ? 'text-rose-400' : 'text-amber-400'}`}>
                      • {warning.variable}: {warning.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            Checking provider configuration…
          </div>
        )}
      </div>

      {/* Accounting Compliance Banner */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300 flex items-start gap-3">
        <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider">Accounting Standard Enforced:</span> Gross subscription sales represent top-line receipts prior to payment processing fees, refund debits, and 50% moderator partner commission liabilities. Gross sales are never designated as profit.
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          {actionError}
        </div>
      )}

      {/* Quick Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'ALL', label: 'All Orders' },
          { id: 'PENDING', label: '⏳ Pending Review' },
          { id: 'FINISHED', label: '✅ Confirmed / Finished' },
          { id: 'WAITING', label: '⏳ Pending Confirmation' },
          { id: 'FAILED', label: '❌ Failed & Expired' },
          { id: 'REJECTED', label: '🚫 Rejected' },
          { id: 'REFUNDED', label: '🔄 Refunded' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setStatusFilter(tab.id);
              setPage(1);
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              statusFilter === tab.id
                ? 'border border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'border border-slate-800 bg-[#070b14] text-slate-400 hover:border-slate-700 hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-4 shadow-xl">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by order ID, customer email, phone, or payment ID..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-300 focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Payment States</option>
              <option value="PENDING">All Pending / Awaiting Verification</option>
              <option value="FINISHED">Confirmed / Finished Only</option>
              <option value="CONFIRMED">Blockchain Confirmed (awaiting final)</option>
              <option value="WAITING">Waiting Payment</option>
              <option value="CONFIRMING">Confirming on Blockchain</option>
              <option value="SENDING">Sending</option>
              <option value="PARTIALLY_PAID">Partially Paid / Underpaid</option>
              <option value="REVIEW_REQUIRED">Manual Review Required</option>
              <option value="FAILED">Failed Payments</option>
              <option value="REFUNDED">Refunded Payments</option>
              <option value="REJECTED">Rejected Payments</option>
              <option value="EXPIRED">Expired Invoices</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#070b14] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/40 font-display text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3.5">Order ID & User</th>
                <th className="px-4 py-3.5">Plan Tier</th>
                <th className="px-4 py-3.5">USD Price</th>
                <th className="px-4 py-3.5">Crypto Settlement</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Verification</th>
                <th className="px-4 py-3.5">Provider Ref</th>
                <th className="px-4 py-3.5 text-right">Created At</th>
                <th className="px-4 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                      <p className="font-display text-xs uppercase tracking-wider text-slate-400">
                        Querying payment ledger...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    No payment orders match the specified criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const status = o.status || o.paymentStatus || 'WAITING';
                  const isFinished = status === 'FINISHED';
                  const isPending = ['WAITING', 'CONFIRMING', 'SENDING'].includes(status);
                  const isFailed = ['FAILED', 'EXPIRED'].includes(status);
                  const isRefunded = status === 'REFUNDED';
                  const price = o.priceAmount ?? o.priceAmountUsd ?? 0;
                  const payAmount = o.payAmount ?? o.payAmountCrypto;

                  return (
                    <tr key={o._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-mono text-xs font-semibold text-white">{o.orderId}</div>
                        <div className="text-xs text-slate-400">{o.userId?.email || '—'}</div>
                        {o.userId?.phone && (
                          <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                            📞 {o.userId.phone}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 mt-0.5">{o.userId?.name}</div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-display text-xs font-black uppercase text-amber-400">
                          {o.planName || o.planId.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-sm font-bold text-emerald-400">${price}</div>
                        <div className="text-[10px] uppercase text-slate-500">{o.priceCurrency || 'USD'}</div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-xs font-mono text-slate-200">
                          {payAmount ? `${payAmount} ` : ''}
                          <span className="uppercase text-amber-400">{o.payCurrency}</span>
                        </div>
                        {o.payAddress && (
                          <div className="text-[10px] font-mono text-slate-500 max-w-[140px] truncate" title={o.payAddress}>
                            Addr: {o.payAddress}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {isFinished ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                            <CheckCircle2 className="h-3 w-3" /> Finished
                          </span>
                        ) : status === 'CONFIRMED' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400 uppercase">
                            <Clock className="h-3 w-3" /> Confirmed
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase">
                            <Clock className="h-3 w-3" /> {status}
                          </span>
                        ) : status === 'PARTIALLY_PAID' || status === 'REVIEW_REQUIRED' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-400 uppercase">
                            <AlertTriangle className="h-3 w-3" /> {status === 'PARTIALLY_PAID' ? 'Underpaid' : 'Review'}
                          </span>
                        ) : isRefunded ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 uppercase">
                            <CheckCircle2 className="h-3 w-3" /> Refunded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 uppercase">
                            <XCircle className="h-3 w-3" /> {status}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                            o.verified
                              ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : o.signatureVerified
                              ? 'border border-amber-500/30 bg-amber-500/10 text-amber-400'
                              : 'border border-slate-700 bg-slate-800/60 text-slate-400'
                          }`}>
                            <ShieldCheck className="h-2.5 w-2.5" />
                            {o.verified ? 'Verified' : o.signatureVerified ? 'Signed' : 'Unverified'}
                          </span>
                          {o.providerVerified && (
                            <span className="text-[9px] font-semibold text-cyan-400">Provider API checked</span>
                          )}
                          {o.premiumActivated && (
                            <span className="text-[9px] font-semibold text-emerald-400">Premium active</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-xs font-mono text-slate-400">
                        <div className="max-w-[150px] truncate" title={o.providerPaymentId || o.paymentId}>
                          {o.providerPaymentId || o.paymentId || '—'}
                        </div>
                        {o.transactionId && (
                          <div className="mt-0.5 max-w-[150px] truncate text-[9px] text-cyan-500/80" title={o.transactionId}>
                            {o.transactionId}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right text-xs text-slate-400 font-mono">
                        {new Date(o.createdAt).toLocaleString()}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openOrderDetails(o.orderId)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                          <Eye className="h-3 w-3" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/40 px-4 py-3 sm:px-6">
          <div className="text-xs text-slate-400">
            Showing <span className="font-semibold text-white">{orders.length}</span> of{' '}
            <span className="font-semibold text-white">{total}</span> payment records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <span className="text-xs text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#070b14] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#070b14]/95 px-5 py-4 backdrop-blur">
              <div>
                <h2 className="font-display text-sm font-black uppercase tracking-wider text-white">
                  Transaction Details
                </h2>
                <p className="mt-0.5 font-mono text-[10px] text-amber-300">{selectedOrderId}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderId(null);
                  setOrderDetails(null);
                  setDetailsError('');
                }}
                className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {detailsLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  <span className="text-xs text-slate-400">Loading transaction details…</span>
                </div>
              ) : detailsError ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
                  {detailsError}
                </div>
              ) : orderDetails ? (
                <div className="space-y-5">
                  {manualMessage && (
                    <div
                      className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${
                        manualMessage.type === 'success'
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                      }`}
                    >
                      {manualMessage.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      )}
                      <span>{manualMessage.text}</span>
                    </div>
                  )}

                  {canManualReview && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                      <div className="font-display text-[10px] font-black uppercase tracking-wider text-amber-300">
                        Manual Payment Review
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Approval re-checks this payment directly with NOWPayments and is blocked unless the provider
                        reports a verified <span className="font-mono text-amber-300">finished</span> status. Rejection
                        never deletes the payment record.
                      </p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => openManualAction('approve')}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/25"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve Payment
                        </button>
                        <button
                          type="button"
                          onClick={() => openManualAction('reject')}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-rose-300 hover:bg-rose-500/25"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject Payment
                        </button>
                      </div>
                    </div>
                  )}

                  {!canManualReview && orderDetails.manualReviewStatus && orderDetails.manualReviewStatus !== 'NONE' && (
                    <div
                      className={`rounded-xl border p-3 text-[11px] ${
                        orderDetails.manualReviewStatus === 'APPROVED'
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
                          : 'border-rose-500/30 bg-rose-500/5 text-rose-300'
                      }`}
                    >
                      Manual review: <span className="font-bold">{orderDetails.manualReviewStatus}</span>
                      {orderDetails.reviewedByAdminEmail ? ` by ${orderDetails.reviewedByAdminEmail}` : ''}
                      {orderDetails.reviewedAt ? ` · ${new Date(orderDetails.reviewedAt).toLocaleString()}` : ''}
                      {orderDetails.reviewReason ? ` · ${orderDetails.reviewReason}` : ''}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { label: 'Customer', value: orderDetails.userId?.name || '—' },
                      { label: 'Email', value: orderDetails.userId?.email || '—' },
                      { label: 'Phone', value: orderDetails.userId?.phone || '—' },
                      { label: 'Account Status', value: orderDetails.userId?.accountStatus || '—' },
                      { label: 'Plan', value: orderDetails.planName || orderDetails.planId },
                      { label: 'Order Status', value: orderDetails.status },
                      { label: 'Provider Status', value: orderDetails.providerStatus || '—' },
                      { label: 'Price', value: `$${orderDetails.priceAmount} ${orderDetails.priceCurrency || 'USD'}` },
                      { label: 'Expected Crypto Amount', value: orderDetails.payAmount !== undefined ? `${orderDetails.payAmount} ${orderDetails.payCurrency}` : '—' },
                      { label: 'Actually Paid', value: orderDetails.actuallyPaid !== undefined ? `${orderDetails.actuallyPaid} ${orderDetails.payCurrency}` : '—' },
                      { label: 'Payment Method', value: orderDetails.paymentMethod || orderDetails.payCurrency || '—' },
                      { label: 'Premium Activated', value: orderDetails.premiumActivated ? 'YES' : 'NO' },
                      { label: 'Signature Verified', value: orderDetails.signatureVerified ? 'YES' : 'NO' },
                      { label: 'Provider API Verified', value: orderDetails.providerVerified ? 'YES' : 'NO' },
                      { label: 'Manual Review', value: orderDetails.manualReviewStatus || 'NONE' },
                      { label: 'Reviewed By', value: orderDetails.reviewedByAdminEmail || '—' },
                      { label: 'Reviewed At', value: orderDetails.reviewedAt ? new Date(orderDetails.reviewedAt).toLocaleString() : '—' },
                      { label: 'Review Reason', value: orderDetails.reviewReason || '—' },
                      { label: 'Paid At', value: orderDetails.paidAt ? new Date(orderDetails.paidAt).toLocaleString() : '—' },
                      { label: 'Created At', value: orderDetails.createdAt ? new Date(orderDetails.createdAt).toLocaleString() : '—' }
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{item.label}</div>
                        <div className="mt-0.5 break-words text-xs text-slate-200">{String(item.value)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 rounded-xl border border-slate-800 bg-black/30 p-4 font-mono text-[10px]">
                    {[
                      { label: 'Provider Payment ID', value: orderDetails.providerPaymentId },
                      { label: 'Provider Invoice ID', value: orderDetails.providerInvoiceId },
                      { label: 'Transaction Hash', value: orderDetails.transactionId },
                      { label: 'Internal Payment ID', value: orderDetails.paymentId }
                    ].map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-3 border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                        <span className="shrink-0 text-slate-500">{item.label}:</span>
                        <span className="min-w-0 break-all text-right text-slate-300">{item.value || '—'}</span>
                      </div>
                    ))}
                  </div>

                  {orderDetails.subscriptionId && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <div className="mb-2 font-display text-[10px] font-black uppercase tracking-wider text-emerald-300">
                        Linked Subscription
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                        <div>Status: <span className="font-bold text-emerald-300">{orderDetails.subscriptionId.status}</span></div>
                        <div>Revoked: {orderDetails.subscriptionId.isRevoked ? 'YES' : 'NO'}</div>
                        <div>Start: {orderDetails.subscriptionId.startDate ? new Date(orderDetails.subscriptionId.startDate).toLocaleString() : '—'}</div>
                        <div>End: {orderDetails.subscriptionId.endDate ? new Date(orderDetails.subscriptionId.endDate).toLocaleString() : '—'}</div>
                      </div>
                    </div>
                  )}

                  {orderDetails.failureReason && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                      <span className="font-bold uppercase">Review note: </span>
                      {orderDetails.failureReason}
                    </div>
                  )}

                  <div>
                    <div className="mb-2 font-display text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Recent Webhook Events
                    </div>
                    <div className="overflow-hidden rounded-xl border border-slate-800">
                      <table className="w-full text-left text-[10px] text-slate-300">
                        <thead className="bg-slate-900/60 text-[9px] uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-3 py-2">Event</th>
                            <th className="px-3 py-2">Processing</th>
                            <th className="px-3 py-2">Signature</th>
                            <th className="px-3 py-2 text-right">Received</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {(orderDetails.recentWebhookEvents || []).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                                No webhook events recorded.
                              </td>
                            </tr>
                          ) : (
                            orderDetails.recentWebhookEvents.map((event: any) => (
                              <tr key={event._id}>
                                <td className="px-3 py-2 font-mono uppercase text-amber-300">{event.eventType}</td>
                                <td className="px-3 py-2">{event.processingStatus}</td>
                                <td className="px-3 py-2">{event.signatureValid ? 'VALID' : 'INVALID'}</td>
                                <td className="px-3 py-2 text-right font-mono text-slate-500">
                                  {new Date(event.receivedAt).toLocaleString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Manual Approve / Reject Confirmation Dialog */}
      {manualAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#070b14] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-sm font-black uppercase tracking-wider text-white">
                {manualAction === 'approve' ? 'Confirm Manual Approval' : 'Confirm Payment Rejection'}
              </h3>
              <button
                type="button"
                onClick={() => setManualAction(null)}
                disabled={manualSubmitting}
                className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 hover:text-white disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div
                className={`rounded-xl border p-3 text-[11px] ${
                  manualAction === 'approve'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                }`}
              >
                {manualAction === 'approve' ? (
                  <>
                    The server will re-query NOWPayments and independently validate the payment ID, order ID, price,
                    currency and settled amount. Premium is activated only if the provider returns{' '}
                    <span className="font-mono font-bold">finished</span>. Duplicate approvals are blocked automatically.
                  </>
                ) : (
                  <>
                    Rejecting marks this payment as <span className="font-mono font-bold">REJECTED</span>, notifies the
                    user, and records the administrator, timestamp and reason. The payment record is preserved.
                  </>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {manualAction === 'approve' ? 'Approval reason / provider evidence *' : 'Rejection reason *'}
                </label>
                <textarea
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  rows={3}
                  placeholder="Required for the immutable audit log"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {manualMessage?.type === 'error' && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {manualMessage.text}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setManualAction(null)}
                  disabled={manualSubmitting}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleManualAction}
                  disabled={manualSubmitting || manualReason.trim().length < 3}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-black shadow-md disabled:opacity-50 ${
                    manualAction === 'approve'
                      ? 'bg-emerald-500 hover:bg-emerald-400'
                      : 'bg-rose-500 hover:bg-rose-400'
                  }`}
                >
                  {manualSubmitting ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : manualAction === 'approve' ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {manualSubmitting
                    ? 'Verifying…'
                    : manualAction === 'approve'
                    ? 'Verify & Approve'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
