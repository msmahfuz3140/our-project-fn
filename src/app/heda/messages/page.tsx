'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { authClient } from '../../../lib/auth-client';
import { useDebounce } from '../../../hooks/useDebounce';
import {
  Mail,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'NEW' | 'READ' | 'RESOLVED' | 'SPAM';
  createdAt: string;
  resolvedAt?: string;
}

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [reason, setReason] = useState('Contact message triage');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await authClient.getAdminContactMessages({
        page,
        limit: 20,
        status: status === 'ALL' ? undefined : status,
        search: debouncedSearch.trim() || undefined
      });
      setMessages(result?.messages || []);
      setTotal(result?.total || 0);
      setTotalPages(result?.totalPages || 1);
    } catch (err: any) {
      setError(err?.message || 'Could not load contact messages.');
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (message: ContactMessage, nextStatus: ContactMessage['status']) => {
    setSaving(true);
    setError('');
    try {
      await authClient.updateAdminContactMessage(message._id, {
        status: nextStatus,
        reason: reason.trim() || 'Contact message triage'
      });
      setSelected(null);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not update the message.');
    } finally {
      setSaving(false);
    }
  };

  const statusStyle = (value: string) =>
    value === 'NEW'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
      : value === 'RESOLVED'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
        : value === 'SPAM'
          ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          : 'border-sky-500/30 bg-sky-500/10 text-sky-300';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-wider text-white">Contact Messages</h1>
          <p className="mt-1 text-sm text-slate-400">Persisted inquiries from the public contact form.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</div>
      )}

      <div className="grid gap-3 rounded-2xl border border-slate-800 bg-[#070b14] p-4 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, subject or message…"
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-300 focus:border-amber-500 focus:outline-none"
        >
          <option value="ALL">All statuses</option>
          <option value="NEW">New</option>
          <option value="READ">Read</option>
          <option value="RESOLVED">Resolved</option>
          <option value="SPAM">Spam</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#070b14]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/40 font-display text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3.5">From</th>
                <th className="px-4 py-3.5">Subject</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                    No contact messages match this filter.
                  </td>
                </tr>
              ) : (
                messages.map((message) => (
                  <tr
                    key={message._id}
                    onClick={() => {
                      setSelected(message);
                      setReason('Contact message triage');
                    }}
                    className="cursor-pointer transition-colors hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold text-white">{message.name}</div>
                      <div className="text-[11px] text-slate-400">{message.email}</div>
                    </td>
                    <td className="max-w-md px-4 py-4">
                      <div className="truncate font-medium text-slate-200">{message.subject}</div>
                      <div className="truncate text-[11px] text-slate-500">{message.message}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${statusStyle(message.status)}`}>
                        {message.status === 'NEW' ? <Clock className="h-3 w-3" /> : message.status === 'RESOLVED' ? <CheckCircle2 className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                        {message.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-[10px] text-slate-400">
                      {new Date(message.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/40 px-4 py-3">
          <div className="text-xs text-slate-400">
            Showing {messages.length} of {total} messages
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs text-slate-400">Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-300 disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#070b14] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h2 className="font-display text-sm font-black uppercase tracking-wider text-white">{selected.subject}</h2>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {selected.name} • {selected.email}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="whitespace-pre-wrap rounded-xl border border-slate-800 bg-black/30 p-4 text-xs leading-relaxed text-slate-300">
                {selected.message}
              </div>
              <div className="text-[10px] text-slate-500">
                Received {new Date(selected.createdAt).toLocaleString()} • Status {selected.status}
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Audit reason
                </label>
                <input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(['READ', 'RESOLVED', 'SPAM'] as const).map((nextStatus) => (
                  <button
                    key={nextStatus}
                    disabled={saving || selected.status === nextStatus}
                    onClick={() => updateStatus(selected, nextStatus)}
                    className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-200 hover:bg-slate-700 disabled:opacity-40"
                  >
                    Mark {nextStatus}
                  </button>
                ))}
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                  className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-300"
                >
                  Reply by Email
                </a>
              </div>
              {saving && (
                <div className="flex items-center gap-2 text-[10px] text-amber-300">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Saving status…
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
