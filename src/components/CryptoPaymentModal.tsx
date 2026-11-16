'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  ShieldCheck,
  AlertCircle,
  QrCode,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { authClient, PurchaseOrderResult, OrderDetails } from '../lib/auth-client';
import { SubscriptionPlan, formatCentsToUsd } from '../shared/plans';
import { useAuth } from '../context/AuthContext';
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
    badge: 'Recommended • Fast & Low Fee'
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
    id: 'USDTERC20',
    name: 'USDT',
    network: 'Ethereum (ERC-20)',
    symbol: '₮',
    iconBg: 'bg-teal-500/20 text-teal-400 border-teal-500/30'
  },
  {
    id: 'LTC',
    name: 'Litecoin',
    network: 'Litecoin (LTC)',
    symbol: 'Ł',
    iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  },
  {
    id: 'TRX',
    name: 'Tron',
    network: 'Tron (TRX)',
    symbol: '◈',
    iconBg: 'bg-red-500/20 text-red-400 border-red-500/30'
  },
  {
    id: 'SOL',
    name: 'Solana',
    network: 'Solana (SOL)',
    symbol: '◎',
    iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  },
  {
    id: 'BNBBSC',
    name: 'BNB',
    network: 'BNB Chain (BEP-20)',
    symbol: 'BNB',
    iconBg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  }
];

interface CryptoPaymentModalProps {
  plan: SubscriptionPlan;
  onClose: () => void;
}

export function CryptoPaymentModal({ plan, onClose }: CryptoPaymentModalProps) {
  const { refreshUser } = useAuth();
  const [selectedCoin, setSelectedCoin] = useState<CryptoOption>(CRYPTO_OPTIONS[0]);
  const [order, setOrder] = useState<PurchaseOrderResult | OrderDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<'amount' | 'address' | null>(null);
  const [status, setStatus] = useState<'WAITING' | 'CONFIRMING' | 'CONFIRMED' | 'FINISHED' | 'FAILED'>('WAITING');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isFulfilledRef = useRef<boolean>(false);
  const activeOrderRef = useRef<string | null>(null);

  // Initialize or switch currency
  const initPayment = useCallback(async (coin: CryptoOption) => {
    setLoading(true);
    setError(null);
    setQrDataUrl('');

    try {
      const result = await authClient.createPurchaseOrder(plan.id, coin.id);
      setOrder(result);
      activeOrderRef.current = result.orderId;

      if (result.payAddress) {
        const qr = await QRCode.toDataURL(result.payAddress, {
          margin: 1,
          width: 240,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
        setQrDataUrl(qr);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to generate cryptocurrency deposit address. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [plan.id]);

  useEffect(() => {
    void initPayment(selectedCoin);
  }, [selectedCoin, initPayment]);

  // Live polling for payment completion
  useEffect(() => {
    if (!order?.orderId || isFulfilledRef.current) return;

    const interval = setInterval(async () => {
      try {
        const details = await authClient.getOrder(order.orderId);
        if (!details) return;

        // If status changed to terminal
        if (details.isFulfilled || details.status === 'FINISHED' || details.status === 'CONFIRMED') {
          if (!isFulfilledRef.current) {
            isFulfilledRef.current = true;
            setStatus('FINISHED');
            setToastMessage('🎉 Payment Received! Subscription Activated Successfully!');
            await refreshUser().catch(() => null);
          }
        } else if (details.status === 'CONFIRMING' || details.status === 'SENDING') {
          setStatus('CONFIRMING');
        } else if (details.status === 'FAILED' || details.status === 'EXPIRED') {
          setStatus('FAILED');
        }
      } catch {
        // Silent poll error handling
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [order?.orderId, refreshUser]);

  const handleCopy = async (text: string, field: 'amount' | 'address') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      // Fallback
    }
  };

  const isComplete = status === 'FINISHED' || status === 'CONFIRMED' || order?.status === 'FINISHED' || order?.status === 'CONFIRMED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-emerald-950/95 border border-emerald-500/60 text-white px-5 py-3 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.35)] animate-in slide-in-from-top-4 duration-300">
          <div className="p-1 rounded-full bg-emerald-500 text-black">
            <Check className="h-4 w-4 stroke-[3]" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Purchase Successful</p>
            <p className="text-xs text-emerald-100">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-amber-500/25 bg-[#0a0d14] p-5 sm:p-7 shadow-[0_0_60px_rgba(245,158,11,0.15)] text-slate-100 scrollbar-thin scrollbar-thumb-white/10">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-72 h-36 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-36 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-1.5">
              <Zap className="h-3 w-3 text-amber-400" />
              Direct Crypto Payment
            </div>
            <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-white">
              {plan.name}
            </h3>
            <p className="text-xs text-slate-400">
              {plan.duration?.value ? `${plan.duration.value} ${plan.duration.unit.toLowerCase()}` : `${plan.durationDays} Days`} Access • Fixed Valuation <span className="font-bold text-amber-400">${formatCentsToUsd(plan.priceCents)} USD</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Currency Selection Tabs */}
        {!isComplete && (
          <div className="mb-5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2">
              Select Payment Cryptocurrency:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CRYPTO_OPTIONS.map((coin) => {
                const isSelected = selectedCoin.id === coin.id;
                return (
                  <button
                    key={coin.id}
                    type="button"
                    onClick={() => {
                      if (loading || isSelected) return;
                      setSelectedCoin(coin);
                    }}
                    className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.25)] text-white'
                        : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border ${coin.iconBg}`}>
                        {coin.symbol}
                      </span>
                      <span className="text-xs font-bold text-white">{coin.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate max-w-[95px]">{coin.network}</span>
                    {coin.badge && (
                      <span className="absolute -top-1.5 right-1 px-1.5 py-0.2 bg-amber-500 text-black text-[8px] font-black uppercase rounded-full">
                        Hot
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-10 w-10 text-amber-400 animate-spin mb-3" />
            <p className="text-sm font-bold text-white">Generating Dedicated Deposit Address...</p>
            <p className="text-xs text-slate-400 mt-1">Connecting directly with NOWPayments liquidity gateway</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-4 rounded-2xl border border-red-500/30 bg-red-950/20 text-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-xs text-red-300 font-bold mb-3">{error}</p>
            <button
              onClick={() => initPayment(selectedCoin)}
              className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Completed State */}
        {!loading && isComplete && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-pulse">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              </div>
              <Sparkles className="h-6 w-6 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
            </div>

            <h4 className="font-display text-2xl font-black uppercase tracking-tight text-white mb-2">
              Purchase Complete!
            </h4>
            <p className="text-xs sm:text-sm text-emerald-300 max-w-sm mb-6">
              Your cryptocurrency payment has been verified on the blockchain. Your Premium account access is now fully active!
            </p>

            <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 mb-6 text-left">
              <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                <span className="text-slate-400">Purchased Plan:</span>
                <span className="font-bold text-white">{plan.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono text-amber-400">{order?.orderId}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1">
                <span className="text-slate-400">Access Status:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> ACTIVE
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Link
                href="/dashboard/tool"
                onClick={onClose}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-display text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
              >
                Launch Intelligence Tool <ArrowRight className="h-4 w-4" />
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

        {/* Active Payment View (QR Code + Address + Amount) */}
        {!loading && !error && !isComplete && order && (
          <div className="space-y-4">
            
            {/* Live Status Bar */}
            <div className="flex items-center justify-between p-3 rounded-2xl border border-white/10 bg-black/40">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    {status === 'CONFIRMING' ? 'Payment Detected — Confirming...' : 'Awaiting Payment Deposit'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Auto-checking blockchain updates every 3.5s
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {selectedCoin.network}
                </span>
              </div>
            </div>

            {/* Main QR Code & Amount Card */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.04] to-black/60">
              
              {/* QR Code Container */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="p-2.5 bg-white rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.15)]">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Deposit QR Code"
                      className="w-36 h-36 sm:w-40 sm:h-40 rounded-lg"
                    />
                  ) : (
                    <div className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center bg-slate-100 text-slate-400">
                      <QrCode className="h-10 w-10 animate-pulse" />
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 mt-1.5 tracking-tight">
                  Scan with crypto wallet
                </span>
              </div>

              {/* Exact Amount and Copy */}
              <div className="flex-1 w-full space-y-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Send Exactly This Amount:
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-1 p-2.5 rounded-xl border border-amber-500/30 bg-black/60">
                    <div className="truncate">
                      <span className="font-mono text-base sm:text-lg font-black text-amber-400">
                        {order.payAmount ?? plan.priceUsd}{' '}
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {selectedCoin.name}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1.5">
                        (~${formatCentsToUsd(plan.priceCents)} USD)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(String(order.payAmount ?? plan.priceUsd), 'amount')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition-colors"
                    >
                      {copiedField === 'amount' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400">Copied</span>
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

                {/* Important Network Notice */}
                <div className="p-2.5 rounded-xl border border-amber-500/15 bg-amber-500/[0.05] text-[11px] text-slate-300 space-y-1">
                  <p className="flex items-center gap-1.5 font-bold text-amber-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                    Network: {selectedCoin.network}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Transfer strictly via the specified network to prevent token loss.
                  </p>
                </div>
              </div>
            </div>

            {/* Deposit Address Box */}
            {order.payAddress && (
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                  Deposit Address:
                </label>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-white/10 bg-black/60">
                  <p className="font-mono text-xs text-white truncate select-all pr-2">
                    {order.payAddress}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.payAddress!, 'address')}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs font-bold transition-colors"
                  >
                    {copiedField === 'address' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[11px] text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="text-[11px]">Copy Address</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Hosted Page Alternative & Order Info */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/5 text-[11px] text-slate-400">
              <span className="font-mono text-[10px]">Order: {order.orderId}</span>
              
              {order.checkoutUrl && order.checkoutUrl.startsWith('http') && !order.checkoutUrl.includes('localhost') && (
                <a
                  href={order.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  Prefer hosted browser page? Open on NOWPayments <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
