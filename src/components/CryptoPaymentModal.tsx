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
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Coins,
  Send
} from 'lucide-react';
import { authClient, PurchaseOrderResult, OrderDetails } from '../lib/auth-client';
import { SubscriptionPlan, formatCentsToUsd } from '../shared/plans';
import { useAuth } from '../context/AuthContext';
import { usePublicSettings } from '../hooks/usePublicSettings';
import Link from 'next/link';

export interface CryptoOption {
  id: string;
  name: string;
  network: string;
  symbol: string;
  iconBg: string;
  badge?: string;
  minNotice?: string;
}

export const CRYPTO_OPTIONS: CryptoOption[] = [
  {
    id: 'USDTTRC20',
    name: 'USDT',
    network: 'TRON (TRC-20)',
    symbol: '₮',
    iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    badge: 'Popular',
    minNotice: 'Min ~$12'
  },
  {
    id: 'TRX',
    name: 'Tron',
    network: 'Tron (TRX)',
    symbol: '◈',
    iconBg: 'bg-red-500/20 text-red-400 border-red-500/30',
    badge: 'From $0.20',
    minNotice: 'Min $0.20'
  },
  {
    id: 'BTC',
    name: 'Bitcoin',
    network: 'Bitcoin (BTC)',
    symbol: '₿',
    iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    minNotice: 'Min ~$2'
  },
  {
    id: 'ETH',
    name: 'Ethereum',
    network: 'Ethereum (ERC-20)',
    symbol: 'Ξ',
    iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    minNotice: 'Min ~$2'
  },
  {
    id: 'LTC',
    name: 'Litecoin',
    network: 'Litecoin (LTC)',
    symbol: 'Ł',
    iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    badge: 'Low Fee',
    minNotice: 'Min $0.80'
  },
  {
    id: 'SOL',
    name: 'Solana',
    network: 'Solana (SOL)',
    symbol: '◎',
    iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    minNotice: 'Min ~$2'
  },
  {
    id: 'XMR',
    name: 'Monero',
    network: 'Monero (XMR)',
    symbol: 'ɱ',
    iconBg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    badge: 'Private',
    minNotice: 'Min ~$2'
  },
  {
    id: 'TON',
    name: 'Toncoin',
    network: 'TON Network',
    symbol: '💎',
    iconBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    badge: 'Telegram',
    minNotice: 'Min ~$2'
  },
  {
    id: 'DOGE',
    name: 'Dogecoin',
    network: 'Dogecoin (DOGE)',
    symbol: 'Ð',
    iconBg: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
    minNotice: 'Min ~$3'
  },
  {
    id: 'XRP',
    name: 'Ripple',
    network: 'XRP Ledger',
    symbol: '✕',
    iconBg: 'bg-zinc-400/20 text-zinc-300 border-zinc-400/30',
    badge: 'Fast',
    minNotice: 'Min $0.50'
  },
  {
    id: 'BNBBSC',
    name: 'BNB',
    network: 'BNB Chain (BEP-20)',
    symbol: 'BNB',
    iconBg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    minNotice: 'Min ~$3'
  },
  {
    id: 'USDTERC20',
    name: 'USDT',
    network: 'Ethereum (ERC-20)',
    symbol: '₮',
    iconBg: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    minNotice: 'Min ~$15'
  }
];

interface CryptoPaymentModalProps {
  plan: SubscriptionPlan;
  onClose: () => void;
}

export function CryptoPaymentModal({ plan, onClose }: CryptoPaymentModalProps) {
  const { refreshUser } = useAuth();
  const { settings } = usePublicSettings();
  
  // Resolve Telegram support desk URL dynamically
  const rawTelegram = settings?.supportContact?.telegram || settings?.socialLinks?.telegram || 'https://t.me/roulettetools_support';
  const telegramUrl = rawTelegram.startsWith('http')
    ? rawTelegram
    : (rawTelegram.startsWith('@') ? `https://t.me/${rawTelegram.slice(1)}` : `https://t.me/${rawTelegram}`);
  
  // Smart initial coin selection: for micro/test plans under $12, use TRX by default
  const defaultCoin = (plan.priceUsd < 12 || plan.priceCents < 1200)
    ? CRYPTO_OPTIONS.find((c) => c.id === 'TRX') || CRYPTO_OPTIONS[1]
    : CRYPTO_OPTIONS[0];

  const [selectedCoin, setSelectedCoin] = useState<CryptoOption>(defaultCoin);
  const [order, setOrder] = useState<PurchaseOrderResult | OrderDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<'amount' | 'address' | null>(null);
  const [status, setStatus] = useState<'WAITING' | 'CONFIRMING' | 'CONFIRMED' | 'FINISHED' | 'FAILED'>('WAITING');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isFulfilledRef = useRef<boolean>(false);
  const activeOrderRef = useRef<string | null>(null);

  // Initialize payment order and generate edge-to-edge QR code
  const initPayment = useCallback(async (coin: CryptoOption) => {
    setLoading(true);
    setError(null);
    setQrDataUrl('');

    try {
      const result = await authClient.createPurchaseOrder(plan.id, coin.id);
      setOrder(result);
      activeOrderRef.current = result.orderId;

      if (result.payAddress) {
        // Generate edge-to-edge crisp QR code without excess white margins (margin: 0)
        const qr = await QRCode.toDataURL(result.payAddress, {
          margin: 0,
          width: 320,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
        setQrDataUrl(qr);
      } else {
        setError(`Unable to generate a deposit address for ${coin.name}. Please switch to TRX or LTC.`);
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

  // Real-time polling for payment completion
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-emerald-950/95 border border-emerald-500/60 text-white px-4 sm:px-5 py-3 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-in slide-in-from-top-4 duration-300 max-w-[90vw]">
          <div className="p-1.5 rounded-full bg-emerald-500 text-black shrink-0">
            <Check className="h-4 w-4 stroke-[3]" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Purchase Successful</p>
            <p className="text-xs text-emerald-100">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-[#0a0d14] p-3.5 sm:p-6 md:p-7 shadow-[0_0_60px_rgba(245,158,11,0.2)] text-slate-100 scrollbar-thin scrollbar-thumb-white/10">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-72 h-36 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-36 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
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
              {plan.duration?.value ? `${plan.duration.value} ${plan.duration.unit.toLowerCase()}` : `${plan.durationDays} Days`} Access • Valuation <span className="font-bold text-amber-400">${formatCentsToUsd(plan.priceCents)} USD</span>
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

        {/* Currency Selection Tabs */}
        {!isComplete && (
          <div className="mb-4">
            <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                Select Crypto Option:
              </label>
              {plan.priceUsd < 12 && (
                <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/25">
                  Micro-plan: TRX or XRP recommended
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 sm:gap-2">
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
                    className={`relative flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.25)] text-white'
                        : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                      <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black border shrink-0 ${coin.iconBg}`}>
                        {coin.symbol}
                      </span>
                      <span className="text-[11px] sm:text-xs font-bold text-white truncate max-w-[55px] sm:max-w-none">{coin.name}</span>
                    </div>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 truncate max-w-[70px] sm:max-w-[95px]">{coin.network}</span>
                    {coin.badge && (
                      <span className="absolute -top-1.5 right-1 px-1 py-0.1 bg-amber-500 text-black text-[7px] sm:text-[8px] font-black uppercase rounded-full leading-tight">
                        {coin.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Telegram Support Option for Non-Crypto Users */}
            <div className="mt-2.5 sm:mt-3 rounded-xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-sky-900/15 to-transparent p-2.5 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-[0_0_20px_rgba(14,165,233,0.08)]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0 text-sky-400">
                  <Send className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs font-bold text-white flex items-center gap-1.5">
                    Don&apos;t have cryptocurrency?
                    <span className="text-[9px] font-semibold text-sky-400 bg-sky-500/15 px-1.5 py-0.2 rounded border border-sky-500/25">
                      Direct Support
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-300">
                    Contact Telegram support to activate VIP access via alternative assistance.
                  </p>
                </div>
              </div>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black text-[11px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all shrink-0 cursor-pointer"
              >
                <Send className="h-3 w-3" />
                <span>Chat on Telegram</span>
              </a>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-10 w-10 text-amber-400 animate-spin mb-3" />
            <p className="text-sm font-bold text-white">Generating Dedicated Deposit Address...</p>
            <p className="text-xs text-slate-400 mt-1">Connecting to blockchain gateway for {selectedCoin.name}</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-950/30 text-center mb-4">
            <AlertCircle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
            <p className="text-xs text-amber-200 font-bold mb-3">{error}</p>
            
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const trx = CRYPTO_OPTIONS.find((c) => c.id === 'TRX');
                  if (trx) setSelectedCoin(trx);
                }}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-xs font-bold hover:brightness-110 shadow-lg transition-all"
              >
                👉 Switch to TRX (Tron - Min $0.20)
              </button>
              <button
                type="button"
                onClick={() => {
                  const ltc = CRYPTO_OPTIONS.find((c) => c.id === 'LTC');
                  if (ltc) setSelectedCoin(ltc);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-colors"
              >
                Switch to Litecoin
              </button>
              <button
                type="button"
                onClick={() => initPayment(selectedCoin)}
                className="px-3 py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-colors"
              >
                Retry
              </button>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-black rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Send className="h-3 w-3" />
                Telegram Support
              </a>
            </div>
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

            <h4 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-2">
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
          <div className="space-y-3.5 sm:space-y-4">
            
            {/* Live Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border border-white/10 bg-black/40">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    {status === 'CONFIRMING' ? 'Payment Detected — Confirming blocks...' : 'Awaiting Payment Transfer'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Checking blockchain status every 3.5s
                  </p>
                </div>
              </div>

              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Network: {selectedCoin.network}
                </span>
              </div>
            </div>

            {/* QR Code and Exact Amount Container */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.05] via-black/60 to-black/80 items-center">
              
              {/* QR Code Container - Fills the white box completely */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center">
                <div className="w-36 h-36 sm:w-44 sm:h-44 p-2 bg-white rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.2)] flex items-center justify-center overflow-hidden">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Deposit QR Code"
                      className="w-full h-full object-contain block"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center">
                      <QrCode className="h-8 w-8 animate-pulse mb-1 text-slate-500" />
                      <span className="text-[10px] text-slate-500 font-semibold">Generating QR...</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5 font-medium tracking-tight text-center">
                  Scan QR with your crypto wallet
                </span>
              </div>

              {/* Exact Amount and Network Details */}
              <div className="sm:col-span-7 space-y-3 w-full">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Send Exactly This Amount:
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-1 p-2 sm:p-2.5 rounded-xl border border-amber-500/40 bg-black/70 shadow-inner">
                    <div className="truncate">
                      <span className="font-mono text-base sm:text-lg font-black text-amber-400">
                        {order.payAmount ?? plan.priceUsd}{' '}
                      </span>
                      <span className="text-xs font-black text-white">
                        {selectedCoin.name}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1.5 block sm:inline">
                        (~${formatCentsToUsd(plan.priceCents)} USD)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(String(order.payAmount ?? plan.priceUsd), 'amount')}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 text-xs font-bold transition-all cursor-pointer"
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

                {/* Network Notice */}
                <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] text-[11px] text-slate-200 space-y-1">
                  <p className="flex items-center gap-1.5 font-bold text-amber-300">
                    <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
                    Network: {selectedCoin.network}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Send funds strictly via the specified network to prevent permanent loss.
                  </p>
                </div>
              </div>
            </div>

            {/* Official Deposit Address Card - Prominent & Full Width */}
            <div className="p-3 sm:p-3.5 rounded-2xl border-2 border-amber-500/40 bg-black/70 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] uppercase tracking-wider font-extrabold text-amber-400 flex items-center gap-1">
                  <span>Official Deposit Address:</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedCoin.network}
                </span>
              </div>

              {order.payAddress ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 rounded-xl border border-white/15 bg-white/[0.04]">
                  <p className="font-mono text-xs sm:text-[13px] font-bold text-white break-all select-all pr-1">
                    {order.payAddress}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.payAddress!, 'address')}
                    className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer"
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
                <div className="p-3 text-center text-xs text-amber-300">
                  <p>Deposit address not generated yet.</p>
                  <button
                    onClick={() => initPayment(selectedCoin)}
                    className="mt-2 text-xs font-bold text-amber-400 underline"
                  >
                    Click to refresh
                  </button>
                </div>
              )}
            </div>

            {/* Order Identifier */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono text-[10px]">Reference Order: {order.orderId}</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="h-3 w-3" /> Encrypted Direct Transfer
              </span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
