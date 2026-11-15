'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { authClient } from '../../../lib/auth-client';
import {
  Activity,
  Database,
  Gauge,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  Timer,
  AlertTriangle,
  CheckCircle2,
  Zap
} from 'lucide-react';

function MetricCard({
  label,
  value,
  sub,
  icon,
  tone = 'default'
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  tone?: 'default' | 'good' | 'warn' | 'bad';
}) {
  const toneClass = {
    default: 'text-white',
    good: 'text-emerald-400',
    warn: 'text-amber-400',
    bad: 'text-rose-400'
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5 shadow-xl">
      <div className="flex items-center justify-between text-slate-500">
        <span className="font-display text-[10px] font-bold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className={`mt-2 text-2xl font-black ${toneClass}`}>{value}</div>
      {sub && <div className="mt-1 text-[10px] text-slate-500">{sub}</div>}
    </div>
  );
}

export default function AdminSystemPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const result = await authClient.getAdminSystemHealth();
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Could not load system health.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <p className="font-display text-xs uppercase tracking-widest text-slate-500">Measuring system health…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-400" />
        <h2 className="font-display text-lg font-bold uppercase text-white">System Health Unavailable</h2>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
        <button
          onClick={() => load()}
          className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold uppercase text-rose-300"
        >
          Retry
        </button>
      </div>
    );
  }

  const performance = data.performance || {};
  const requests = performance.requests || {};
  const cache = data.cache || {};
  const baseline = data.securityBaseline || {};
  const collections = data.collections || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-wider text-white">
            System Performance & Security
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Measured API latency, cache efficiency, database indexes and security baseline.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Measurements
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="API p95"
          value={`${requests.p95Ms ?? 0} ms`}
          sub={`p50 ${requests.p50Ms ?? 0} ms • p99 ${requests.p99Ms ?? 0} ms`}
          icon={<Timer className="h-4 w-4 text-amber-400" />}
          tone="good"
        />
        <MetricCard
          label="Sampled Requests"
          value={requests.total ?? 0}
          sub={`${requests.slow ?? 0} slow requests (≥500 ms)`}
          icon={<Activity className="h-4 w-4 text-sky-400" />}
        />
        <MetricCard
          label="Cache Hit Rate"
          value={`${cache.hitRate ?? 0}%`}
          sub={`${cache.hits ?? 0} hits • ${cache.misses ?? 0} misses • ${cache.memoryEntries ?? 0} entries`}
          icon={<Zap className="h-4 w-4 text-emerald-400" />}
          tone="good"
        />
        <MetricCard
          label="Redis Layer"
          value={cache.redisConfigured ? (cache.redisHealthy ? 'Healthy' : 'Fallback') : 'Memory only'}
          sub={cache.redisLastError || 'Graceful fallback is active'}
          icon={<HardDrive className="h-4 w-4 text-purple-400" />}
          tone={cache.redisConfigured && !cache.redisHealthy ? 'warn' : 'good'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-400" />
            <h2 className="font-display text-xs font-black uppercase tracking-wider text-white">Database & Indexes</h2>
          </div>
          <div className="space-y-2 text-xs">
            <Row label="Connection" value={data.database?.connected ? 'Connected' : 'Disconnected'} good={data.database?.connected} />
            <Row label="MongoDB host" value={data.database?.host || '—'} />
            <Row label="Database" value={data.database?.name || '—'} />
            <Row label="Critical indexes" value={data.indexes?.ready ? 'Ready' : 'Pending / failed'} good={data.indexes?.ready} />
            {data.indexes?.lastError && <div className="text-rose-400">{data.indexes.lastError}</div>}
            <Row label="Environment" value={data.environment || '—'} />
            <Row label="Node.js" value={data.nodeVersion || '—'} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h2 className="font-display text-xs font-black uppercase tracking-wider text-white">Security Baseline</h2>
          </div>
          <div className="space-y-2 text-xs">
            <Row label="Plaintext password fields" value={baseline.plaintextPasswordFields ?? 0} good={(baseline.plaintextPasswordFields ?? 0) === 0} />
            <Row label="Raw dev OTP fields" value={baseline.rawDevelopmentOtpFields ?? 0} good={(baseline.rawDevelopmentOtpFields ?? 0) === 0} />
            <Row label="Password hashing" value={`bcrypt cost ${baseline.bcryptCost || 12}`} good />
            <Row label="CSRF origin guard" value={baseline.csrfOriginGuard ? 'Enabled' : 'Disabled'} good={baseline.csrfOriginGuard} />
            <Row label="Rate limiting" value={baseline.rateLimiting ? 'Enabled' : 'Disabled'} good={baseline.rateLimiting} />
            <Row label="Payment provider" value={data.paymentProvider?.apiKeyConfigured ? `${data.paymentProvider?.mode} configured` : 'Not configured'} good={data.paymentProvider?.apiKeyConfigured} />
            <Row label="Payment webhook secret" value={data.paymentProvider?.ipnSecretConfigured ? 'Configured' : 'Missing'} good={data.paymentProvider?.ipnSecretConfigured} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-amber-400" />
            <h2 className="font-display text-xs font-black uppercase tracking-wider text-white">Data Volumes</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Users', collections.users],
              ['Active users', collections.activeUsers],
              ['Active subscriptions', collections.activeSubscriptions],
              ['Payments', collections.payments],
              ['Successful payments', collections.successfulPayments],
              ['Contact messages', collections.contactMessages],
              ['New contact messages', collections.newContactMessages],
              ['Security events (24h)', collections.securityEvents24h],
              ['Failed logins (24h)', collections.failedLogins24h],
              ['Referral clicks', collections.referralClicks],
              ['Audit logs', collections.auditLogs]
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
                <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
                <div className="mt-0.5 font-bold text-slate-200">{Number(value || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-400" />
            <h2 className="font-display text-xs font-black uppercase tracking-wider text-white">Top Request Paths</h2>
          </div>
          <div className="space-y-1.5">
            {(performance.topPaths || []).length === 0 ? (
              <p className="text-xs text-slate-500">No requests measured yet.</p>
            ) : (
              performance.topPaths.map((row: any) => (
                <div key={row.path} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-[10px]">
                  <code className="truncate text-slate-300">{row.path}</code>
                  <span className="shrink-0 font-mono text-amber-300">{row.count}</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 text-[10px] text-slate-500">
            Process uptime: {Math.floor((performance.processUptimeSeconds || 0) / 60)} min • RSS: {performance.memory?.rssMb || 0} MB
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-200">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          These figures are measured in-process from real requests since the current backend instance started. They are
          not projected production numbers; use repeated samples after deployment to track p95 latency and cache hit rate.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, good }: { label: string; value: React.ReactNode; good?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-1.5 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className={good === undefined ? 'text-slate-300' : good ? 'font-semibold text-emerald-400' : 'font-semibold text-rose-400'}>
        {value}
      </span>
    </div>
  );
}
