import {
  RegisterInput,
  LoginInput,
  VerifyOtpInput,
  ResendOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  AuthResponse,
  AuthUser
} from '../shared/auth';
import { SubscriptionPlan } from '../shared/plans';

export const API_BASE = (() => {
  const isProduction = process.env.NODE_ENV === 'production';
  const configured = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  const productionProxy = '/api/v1';

  const normalize = (value: string): string => {
    let normalized = value.trim().replace(/\/+$/, '');
    if (!normalized) return '';
    if (normalized === productionProxy) return productionProxy;
    if (!/^https?:\/\//i.test(normalized)) return '';
    if (isProduction && /localhost|127\.0\.0\.1/i.test(normalized)) return '';
    if (isProduction && normalized.includes('api.rouletteaccuracy.com')) return '';
    if (
      isProduction &&
      !/^https:\/\/(our-project-bk\.vercel\.app|(www\.)?accuracy\.tools)(\/|$)/i.test(normalized)
    ) {
      return '';
    }
    if (/\/api\/v1$/i.test(normalized)) {
      return normalized;
    }
    if (/\/api$/i.test(normalized)) return `${normalized}/v1`;
    return `${normalized}/api/v1`;
  };

  const configuredBase = normalize(configured);
  if (configuredBase) return configuredBase;

  // Production fallback is a same-origin Next.js proxy. This guarantees that a
  // missing/stale Vercel build variable can never send browsers to localhost.
  if (isProduction) return productionProxy;

  return 'http://localhost:5050/api/v1';
})();

/**
 * Legacy bearer token support.
 *
 * New sessions are stored only in the backend's HttpOnly cookie. These helpers
 * remain so an existing deployment can finish its sessions gracefully and so
 * server-side/native API clients can still send a bearer token.
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const local = localStorage.getItem('sloot_token') || localStorage.getItem('auth_token');
  if (local) return local;
  const session = sessionStorage.getItem('sloot_token');
  if (session) return session;
  // Legacy deployments stored the JWT in a JavaScript-readable cookie.
  const legacyCookie = document.cookie.match(/(?:^|;\s*)(?:sloot_token|token)=([^;]+)/);
  return legacyCookie ? decodeURIComponent(legacyCookie[1]) : null;
}

export function hasSessionHint(): boolean {
  if (typeof window === 'undefined') return false;
  if (getStoredToken()) return true;
  if (sessionStorage.getItem('sloot_authed') === '1') return true;
  return document.cookie.split(';').some((part) => part.trim() === 'sloot_auth=1');
}

/** Marks this tab as authenticated for cache partitioning (no credential). */
export function markSessionActive(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem('sloot_authed', '1');
  } catch {
    // Storage can be unavailable in hardened/private browser modes.
  }
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sloot_token');
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('sloot_token');
  sessionStorage.removeItem('sloot_authed');
  const isSecure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `sloot_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isSecure}`;
  document.cookie = `sloot_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isSecure}`;
}

/**
 * If a browser refuses the HttpOnly session cookie (for example a third-party
 * cookie policy on a direct cross-site API deployment), keep the token for the
 * current tab only instead of falling back to persistent localStorage.
 */
function persistTabScopedFallback(token?: string | null): void {
  if (!token || typeof window === 'undefined') return;
  if (hasSessionHint()) return;
  try {
    sessionStorage.setItem('sloot_token', token);
  } catch {
    // Storage can be unavailable in hardened/private browser modes.
  }
}

import { apiCache } from './api-cache';

export interface RequestOptions extends RequestInit {
  bypassCache?: boolean;
  ttlMs?: number;
  staleMs?: number;
  persist?: boolean;
}

export function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'undefined' && value !== 'null') {
      searchParams.set(key, String(value));
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

function buildAuthHeaders(options: RequestInit = {}): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function performFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = buildAuthHeaders(options);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: options.credentials || 'include',
      ...options,
      headers,
      signal: options.signal || controller.signal
    });
  } catch (err: any) {
    const timedOut = err?.name === 'AbortError';
    const requestError = new Error(
      timedOut
        ? 'The server took too long to respond. Please try again.'
        : 'Unable to reach the server. Please check your internet connection and try again.'
    ) as Error & { code?: string; status?: number };
    requestError.code = timedOut ? 'CLIENT_TIMEOUT' : 'NETWORK_ERROR';
    throw requestError;
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg) as Error & { code?: string; status: number; details?: any };
    err.code = data?.error?.code;
    err.status = response.status;
    err.details = data?.error?.details;
    throw err;
  }

  return (data?.data ?? data) as T;
}

/**
 * Raw request used by the Dealer Signature proxy.
 *
 * The proxy endpoints already return the provider envelope:
 *   { success: true, data: {...}, meta: {...} }
 *
 * The normal `request()` helper unwraps `.data`, which previously made the
 * tool check `res.success` / `res.data` on an already-unwrapped object and
 * silently discard every API response. Keeping the envelope intact here fixes
 * that class of bug for all DS endpoints.
 */
async function performFetchRaw<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const headers = buildAuthHeaders(options);
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 15000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: options.credentials || 'include',
      ...options,
      headers,
      signal: options.signal || controller.signal
    });
  } catch (err: any) {
    const timedOut = err?.name === 'AbortError';
    const requestError = new Error(
      timedOut
        ? `The API request timed out after ${Math.round(timeoutMs / 1000)} seconds.`
        : err?.message || 'Network request failed.'
    ) as Error & { code?: string; status?: number };
    requestError.code = timedOut ? 'CLIENT_TIMEOUT' : 'NETWORK_ERROR';
    throw requestError;
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success === false) {
    const errorMsg =
      data?.error?.message ||
      data?.message ||
      `Request failed with status ${response.status}`;
    const err = new Error(errorMsg) as Error & {
      code?: string;
      status: number;
      details?: any;
      meta?: any;
    };
    err.code = data?.error?.code;
    err.status = response.status;
    err.details = data?.error?.details;
    err.meta = data?.meta;
    throw err;
  }

  return data as T;
}

async function requestRaw<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const authenticated = hasSessionHint();
  const cacheKey = `raw:${authenticated ? 'auth:' : 'pub:'}${endpoint}`;

  if (method === 'GET') {
    return apiCache.dedupe(
      cacheKey,
      () => performFetchRaw<T>(endpoint, options),
      { ttlMs: options.ttlMs, staleMs: options.staleMs ?? (authenticated ? 0 : undefined), bypassCache: options.bypassCache, persist: options.persist }
    );
  }

  return performFetchRaw<T>(endpoint, options);
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();

  // If GET request, route through in-memory cache and deduplication
  if (method === 'GET') {
    const authenticated = hasSessionHint();
    const cacheKey = `${authenticated ? 'auth:' : 'pub:'}${endpoint}`;
    return apiCache.dedupe(
      cacheKey,
      () => performFetch<T>(endpoint, options),
      {
        ttlMs: options.ttlMs,
        staleMs: options.staleMs ?? (authenticated ? 0 : undefined),
        bypassCache: options.bypassCache,
        persist: options.persist ?? !authenticated
      }
    );
  }

  // Mutating requests invalidate matching cache keys immediately
  const result = await performFetch<T>(endpoint, options);
  // Invalidate all client-side cached queries immediately on ANY mutation
  apiCache.clear();
  return result;
}

export interface PurchaseOrderResult {
  orderId: string;
  paymentId: string;
  providerPaymentId?: string;
  providerInvoiceId?: string;
  planId: string;
  planName: string;
  priceUsd: number;
  priceCents: number;
  status: string;
  checkoutUrl: string;
  payAddress?: string;
  payAmount?: number;
  payCurrency: string;
  network?: string;
  paymentMode?: 'LIVE' | 'SANDBOX' | 'SIMULATION';
  simulated?: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface OrderDetails {
  orderId: string;
  paymentId: string;
  providerPaymentId?: string;
  providerInvoiceId?: string;
  planId: string;
  planName: string;
  priceUsd: number;
  priceCents: number;
  priceCurrency?: string;
  duration: { unit: 'DAYS' | 'MONTHS'; value: number };
  durationDays: number;
  status: string;
  providerStatus?: string;
  isFulfilled?: boolean;
  verified?: boolean;
  signatureVerified?: boolean;
  providerVerified?: boolean;
  actuallyPaid?: number;
  payAmount?: number;
  payCurrency?: string;
  payAddress?: string;
  network?: string;
  expiresAt?: string;
  paymentMethod?: string;
  transactionId?: string;
  checkoutUrl?: string;
  failureReason?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
  subscription?: {
    id: string;
    status: string;
    startDate?: string;
    endDate?: string;
    isRevoked?: boolean;
    planId?: string;
  } | null;
}

export interface PaymentHistoryItem {
  orderId: string;
  paymentId: string;
  providerPaymentId?: string;
  planId: string;
  planName: string;
  priceAmount: number;
  priceCurrency: string;
  priceCents: number;
  payAmount?: number;
  actuallyPaid?: number;
  payCurrency: string;
  paymentMethod?: string;
  transactionId?: string;
  status: string;
  providerStatus?: string;
  verified: boolean;
  isFulfilled: boolean;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  subscription?: {
    id: string;
    status: string;
    startDate?: string;
    endDate?: string;
  } | null;
}

export interface PaymentHistoryResponse {
  payments: PaymentHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


/**
 * Download a private CSV/file without ever putting the bearer token in a URL.
 */
export async function downloadAuthenticatedFile(endpoint: string, filename: string): Promise<void> {
  const token = getStoredToken();
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include'
    });
  } catch {
    throw new Error('Unable to reach the server to download this file. Please check your connection.');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error?.message || data?.message || `Download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export const authClient = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    persistTabScopedFallback(res.token);
    markSessionActive();
    return res;
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    persistTabScopedFallback(res.token);
    markSessionActive();
    return res;
  },

  async verifyOtp(input: VerifyOtpInput): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    persistTabScopedFallback(res.token);
    markSessionActive();
    return res;
  },

  async resendOtp(input: ResendOtpInput): Promise<{ success: boolean; cooldownSeconds: number }> {
    return request<{ success: boolean; cooldownSeconds: number }>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  async resetPassword(input: ResetPasswordInput): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  async changePassword(input: ChangePasswordInput): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  async getMe(): Promise<AuthUser> {
    const res = await request<any>('/auth/me', { bypassCache: true, ttlMs: 0 });
    return res?.user || res;
  },

  async updateProfile(input: { name?: string; phone?: string }): Promise<AuthUser> {
    const res = await request<any>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(input)
    });
    return res?.user || res;
  },

  async getMySubscription(): Promise<{ active: any; history: any[] }> {
    return request<{ active: any; history: any[] }>('/subscriptions/my-subscription');
  },

  async getMyDashboardSummary(): Promise<any> {
    return request<any>('/dashboard/me', { bypassCache: true });
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors on logout
    } finally {
      clearStoredToken();
    }
  },

  // Plan Management & Purchase Flow
  async getPlans(): Promise<SubscriptionPlan[]> {
    return request<SubscriptionPlan[]>('/subscriptions/plans', {
      ttlMs: 60_000,
      staleMs: 300_000,
      persist: true
    });
  },

  async createPurchaseOrder(planId: string, payCurrency = 'USDTTRC20'): Promise<PurchaseOrderResult> {
    return request<PurchaseOrderResult>('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ planId, payCurrency })
    });
  },

  async getOrder(orderId: string): Promise<OrderDetails> {
    return request<OrderDetails>(`/payments/order/${encodeURIComponent(orderId)}`);
  },

  async getPaymentStatus(identifier: string): Promise<OrderDetails> {
    return request<OrderDetails>(`/payments/${encodeURIComponent(identifier)}`, {
      bypassCache: true,
      ttlMs: 0
    });
  },

  async getPaymentHistory(params?: { page?: number; limit?: number }): Promise<PaymentHistoryResponse> {
    return request<PaymentHistoryResponse>(`/payments/history${buildQueryString(params)}`, {
      bypassCache: true,
      ttlMs: 0
    });
  },

  // Contact Inquiries
  async submitContact(input: { name: string; email: string; subject: string; message: string; turnstileToken?: string }): Promise<{ message: string }> {
    return request<{ message: string }>('/contact', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  // Authoritative Server-Side Subscription Access Verification
  async getAccessStatus(): Promise<import('../shared/subscriptions').AccessStatusResponse> {
    return request<import('../shared/subscriptions').AccessStatusResponse>('/subscriptions/access-status', {
      bypassCache: true,
      ttlMs: 0
    });
  },

  // Secret Code Tool Unlock
  async unlockToolWithSecretCode(secretCode: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/subscriptions/unlock-tool', {
      method: 'POST',
      body: JSON.stringify({ secretCode })
    });
  },

  // Admin Subscription Management
  async grantManualSubscription(input: import('../shared/subscriptions').GrantManualSubscriptionInput): Promise<any> {
    return request('/subscriptions/admin/grant', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  async extendSubscription(input: import('../shared/subscriptions').ExtendSubscriptionInput): Promise<any> {
    return request('/subscriptions/admin/extend', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  async revokeSubscription(input: import('../shared/subscriptions').RevokeSubscriptionInput): Promise<any> {
    return request('/subscriptions/admin/revoke', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  async approveAdminSubscription(subscriptionId: string): Promise<any> {
    return request(`/subscriptions/admin/${subscriptionId}/approve`, {
      method: 'POST'
    });
  },

  async manualUnlockAdminSubscription(subscriptionId: string): Promise<any> {
    return request(`/subscriptions/admin/${subscriptionId}/manual-unlock`, {
      method: 'POST'
    });
  },

  async listAllSubscriptions(): Promise<any[]> {
    return request<any[]>('/subscriptions/admin/list');
  },

  // Payment Currencies & Admin Orders
  async getPaymentCurrencies(): Promise<string[]> {
    return request<string[]>('/payments/currencies');
  },

  async getAdminPaymentOrders(params?: Record<string, any>): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/payments/admin/orders${qs}`);
  },

  async getAdminPaymentSummary(): Promise<import('../shared/subscriptions').AdminPaymentSummary> {
    return request<import('../shared/subscriptions').AdminPaymentSummary>('/payments/admin/summary');
  },

  async exportAdminPayments(startDate?: string, endDate?: string): Promise<{ csv: string; count: number; totalGrossUsd: number }> {
    const query = new URLSearchParams();
    if (startDate) query.set('startDate', startDate);
    if (endDate) query.set('endDate', endDate);
    return request<{ csv: string; count: number; totalGrossUsd: number }>(`/payments/admin/export?${query.toString()}`);
  },

  // Main Admin Management
  clearCache(): void {
    apiCache.clear();
  },

  async getAdminDashboardMetrics(bypassCache?: boolean): Promise<any> {
    return request<any>('/admin/dashboard-metrics', { bypassCache });
  },

  async getAdminSystemHealth(): Promise<any> {
    return request<any>('/admin/system/health', { bypassCache: true });
  },

  async getAdminUsers(params?: Record<string, any>, bypassCache?: boolean): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/admin/users${qs}`, { bypassCache });
  },

  async getAdminUserDetails(userId: string): Promise<any> {
    return request<any>(`/admin/users/${userId}`);
  },

  async updateAdminUserProfile(userId: string, data: any): Promise<any> {
    return request<any>(`/admin/users/${userId}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async changeAdminUserStatus(userId: string, data: { action: 'BLOCK' | 'UNBLOCK' | 'SUSPEND'; reason: string; suspendedUntil?: string }): Promise<any> {
    return request<any>(`/admin/users/${userId}/status`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminUser(userId: string, reason: string): Promise<any> {
    return request<any>(`/admin/users/${userId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason })
    });
  },

  async getAdminAuditLogs(params?: Record<string, any>): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/admin/audit-logs${qs}`);
  },

  async getAdminDualApprovals(status?: string): Promise<any[]> {
    const qs = status ? `?status=${status}` : '';
    return request<any[]>(`/admin/dual-approvals${qs}`);
  },

  async requestAdminDualApproval(data: any): Promise<any> {
    return request<any>('/admin/dual-approvals/request', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async approveAdminDualApproval(requestId: string): Promise<any> {
    return request<any>(`/admin/dual-approvals/${requestId}/approve`, {
      method: 'POST'
    });
  },

  async rejectAdminDualApproval(requestId: string, reason: string): Promise<any> {
    return request<any>(`/admin/dual-approvals/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  async getAdminSubscriptions(params?: Record<string, any>): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/subscriptions/admin/list${qs}`);
  },

  async grantAdminManualSubscription(data: {
    targetEmail: string;
    planId?: string;
    durationValue?: number;
    durationUnit?: 'DAYS' | 'MONTHS';
    customPlanName?: string;
    startDate?: string;
    reason: string;
  }): Promise<any> {
    return request<any>('/subscriptions/admin/grant', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async extendAdminSubscription(data: { subscriptionId: string; extensionValue: number; extensionUnit: string; reason: string }): Promise<any> {
    return request<any>('/subscriptions/admin/extend', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async revokeAdminSubscription(data: { subscriptionId: string; reason: string }): Promise<any> {
    return request<any>('/subscriptions/admin/revoke', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async unbanAdminSubscription(data: { subscriptionId: string; reason?: string; extensionDays?: number }): Promise<any> {
    return request<any>('/subscriptions/admin/unban', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async banAdminUserToolAccess(data: { userId: string; reason?: string }): Promise<any> {
    return request<any>('/subscriptions/admin/ban-tool', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async unbanAdminUserToolAccess(data: { userId: string; reason?: string }): Promise<any> {
    return request<any>('/subscriptions/admin/unban-tool', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getAdminOrders(params?: Record<string, any>): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/payments/admin/orders${qs}`, { bypassCache: true });
  },

  async getAdminOrdersSummary(): Promise<any> {
    return request<any>('/payments/admin/summary', { bypassCache: true });
  },

  async getAdminPaymentHealth(): Promise<any> {
    return request<any>('/payments/admin/health', { bypassCache: true });
  },

  async reconcileAdminPayments(limit?: number): Promise<any> {
    return request<any>('/payments/admin/reconcile', {
      method: 'POST',
      body: JSON.stringify({ limit: limit || 25 })
    });
  },

  async getAdminPaymentDetails(orderId: string): Promise<any> {
    return request<any>(`/payments/admin/orders/${encodeURIComponent(orderId)}`, { bypassCache: true });
  },

  async approveAdminPayment(orderId: string, reason: string): Promise<any> {
    return request<any>(`/payments/admin/orders/${encodeURIComponent(orderId)}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  async rejectAdminPayment(orderId: string, reason: string): Promise<any> {
    return request<any>(`/payments/admin/orders/${encodeURIComponent(orderId)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  async getAdminPlans(): Promise<any[]> {
    return request<any[]>('/admin/plans');
  },

  async createAdminPlan(data: any): Promise<any> {
    return request<any>('/admin/plans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAdminPlan(planId: string, data: any): Promise<any> {
    return request<any>(`/admin/plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminPlan(planId: string): Promise<any> {
    return request<any>(`/admin/plans/${planId}`, {
      method: 'DELETE'
    });
  },

  // --- Moderator Management (Main Admin) ---
  async getAdminModerators(params?: Record<string, any>): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/admin/moderators${qs}`);
  },

  async getAdminModeratorDetails(moderatorId: string): Promise<any> {
    return request<any>(`/admin/moderators/${moderatorId}`);
  },

  async createAdminStaffUser(data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: 'SUPER_ADMIN' | 'MODERATOR';
    commissionRate?: number;
    notes?: string;
    reason?: string;
  }): Promise<any> {
    return request<any>('/admin/users/create-staff', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async createAdminModerator(data: { name: string; email: string; phone?: string; password: string; commissionRate?: number; notes?: string }): Promise<any> {
    return request<any>('/admin/moderators', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAdminModeratorStatus(moderatorId: string, data: { status: string; reason: string; suspendedUntil?: string }): Promise<any> {
    return request<any>(`/admin/moderators/${moderatorId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async resetAdminModeratorPassword(moderatorId: string, data: { newPassword?: string; reason: string }): Promise<any> {
    return request<any>(`/admin/moderators/${moderatorId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAdminModeratorCommissionRate(moderatorId: string, data: { commissionRate: number; reason: string }): Promise<any> {
    return request<any>(`/admin/moderators/${moderatorId}/commission-rate`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // --- Referral & Commission Telemetry (Main Admin) ---
  async getAdminReferralOverview(): Promise<any> {
    return request<any>('/admin/referrals/overview');
  },

  async getAdminCommissions(params?: Record<string, any>): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/admin/referrals/commissions${qs}`);
  },

  async getAdminReferralRelationships(params?: Record<string, any>): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/admin/referrals/relationships${qs}`, { bypassCache: true });
  },

  async updateAdminCommissionStatus(commissionId: string, data: { status: string; reason: string }): Promise<any> {
    return request<any>(`/admin/referrals/commissions/${commissionId}/status`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getAdminCommissionPolicy(): Promise<any> {
    return request<any>('/admin/referrals/policy');
  },

  async updateAdminCommissionPolicy(data: {
    defaultRate: number;
    normalUserRate?: number;
    referralEnabled?: boolean;
    reason: string;
  }): Promise<any> {
    return request<any>('/admin/referrals/policy', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getAdminReferralFraudAlerts(): Promise<any[]> {
    return request<any[]>('/admin/referrals/fraud-alerts');
  },

  // --- Wallet & Withdrawals ---
  async getMyWallet(params?: Record<string, any>): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/wallet/me${qs}`, { bypassCache: true, ttlMs: 0 });
  },

  async getMyWalletTransactions(params?: Record<string, any>): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/wallet/transactions${qs}`, { bypassCache: true, ttlMs: 0 });
  },

  async getMyWithdrawals(params?: Record<string, any>): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/wallet/withdrawals${qs}`, { bypassCache: true, ttlMs: 0 });
  },

  async requestWithdrawal(data: {
    amountUsd: number;
    walletAddress: string;
    network: string;
    idempotencyKey?: string;
  }): Promise<any> {
    return request<any>('/wallet/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getAdminReferralWallets(params?: Record<string, any>): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/admin/referrals/wallets${qs}`, { bypassCache: true });
  },

  async getAdminWalletStats(): Promise<any> {
    return request<any>('/admin/referrals/wallet-stats', { bypassCache: true });
  },

  async adjustAdminWallet(data: {
    userId: string;
    direction: 'ADD' | 'DEDUCT';
    amountUsd: number;
    reason: string;
    idempotencyKey?: string;
  }): Promise<any> {
    return request<any>('/admin/referrals/wallets/adjust', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getAdminWalletTransactions(params?: Record<string, any>): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/admin/referrals/transactions${qs}`, { bypassCache: true });
  },

  async getAdminWithdrawals(params?: Record<string, any>): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/admin/referrals/withdrawals${qs}`, { bypassCache: true });
  },

  async approveAdminWithdrawal(id: string, note?: string): Promise<any> {
    return request<any>(`/admin/referrals/withdrawals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ note })
    });
  },

  async rejectAdminWithdrawal(id: string, reason: string): Promise<any> {
    return request<any>(`/admin/referrals/withdrawals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  async markAdminWithdrawalPaid(id: string, transactionHash?: string): Promise<any> {
    return request<any>(`/admin/referrals/withdrawals/${id}/paid`, {
      method: 'POST',
      body: JSON.stringify({ transactionHash })
    });
  },

  // --- Moderator Self Dashboard ---
  async getModeratorSelfDashboard(): Promise<any> {
    return request<any>('/moderator/dashboard');
  },

  async getModeratorSelfCommissions(params?: Record<string, any>): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/moderator/commissions${qs}`);
  },

  async getModeratorSelfReferredUsers(params?: Record<string, any>): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/moderator/referred-users${qs}`);
  },

  // --- Financial Accounting & Payouts ---
  async getAdminFinancialSummary(): Promise<any> {
    return request<any>('/admin/financial/summary', { bypassCache: true });
  },

  async getAdminFinancialTransactions(params?: {
    type?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    return request<any>(`/admin/financial/transactions${buildQueryString(params)}`, {
      bypassCache: true
    });
  },

  async createAdminPayout(input: {
    amountUsd: number | string;
    description?: string;
    method?: string;
    reference?: string;
    idempotencyKey: string;
  }): Promise<any> {
    return request<any>('/admin/financial/payouts', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  // --- Phase 8: Tool Management & Operational Status ---
  async getPublicToolStatus(): Promise<any> {
    return request<any>('/tool/status', {
      ttlMs: 60_000,
      staleMs: 300_000,
      persist: true
    });
  },

  async trackReferralClick(input: { referralCode: string; path?: string; referrer?: string }): Promise<void> {
    try {
      await request('/referrals/click', {
        method: 'POST',
        body: JSON.stringify(input)
      });
    } catch {
      // Click analytics must never block registration.
    }
  },

  async getAdminToolSettings(): Promise<any> {
    return request<any>('/admin/tool/settings');
  },

  async updateAdminToolSettings(updates: any, reason?: string): Promise<any> {
    return request<any>('/admin/tool/settings', {
      method: 'PATCH',
      body: JSON.stringify({ ...updates, reason: reason || updates.reason || 'Admin tool settings update' })
    });
  },

  // --- Phase 8: Website CMS & Settings ---
  async getPublicWebsiteSettings(): Promise<any> {
    return request<any>('/settings/public', {
      ttlMs: 15_000,
      staleMs: 30_000,
      persist: true
    });
  },

  async getAdminWebsiteSettings(): Promise<any> {
    return request<any>('/admin/settings');
  },

  async updateAdminWebsiteSettings(settings: any, reason?: string): Promise<any> {
    return request<any>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings, reason: reason || settings.reason || 'Admin website settings update' })
    });
  },

  // --- Phase 8: Platform Reports & Analytics ---
  async getReportsSummary(filters?: Record<string, any>): Promise<any> {
    return request<any>(`/admin/reports/summary${buildQueryString(filters)}`);
  },

  getReportExportUrl(reportType: string, filters?: Record<string, any>): string {
    return `${API_BASE}/admin/reports/export${buildQueryString({ reportType, ...(filters || {}) })}`;
  },

  // --- Phase 8: In-App Notifications ---
  async getUserNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/notifications${qs}`);
  },

  async markNotificationAsRead(id: string): Promise<any> {
    return request<any>(`/notifications/${id}/read`, {
      method: 'PATCH'
    });
  },

  async markAllNotificationsAsRead(): Promise<any> {
    return request<any>('/notifications/read-all', {
      method: 'POST'
    });
  },

  async broadcastAnnouncement(
    titleOrData: string | { title: string; message: string; targetRole?: string },
    message?: string,
    targetRole?: string
  ): Promise<any> {
    const payload = typeof titleOrData === 'object'
      ? titleOrData
      : { title: titleOrData, message, targetRole };
    return request<any>('/admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // --- Extended Admin: Support Tickets ---
  async getAdminTickets(params?: Record<string, any>): Promise<any> {
    const qs = buildQueryString(params);
    return request<any>(`/admin/tickets${qs}`);
  },

  async getAdminContactMessages(params?: Record<string, any>): Promise<any> {
    return request<any>(`/contact/admin/messages${buildQueryString(params)}`, { bypassCache: true });
  },

  async updateAdminContactMessage(id: string, data: { status: string; reason: string }): Promise<any> {
    return request<any>(`/contact/admin/messages/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async getAdminTicketDetails(ticketId: string): Promise<any> {
    return request<any>(`/admin/tickets/${ticketId}`);
  },

  async replyAdminTicket(ticketId: string, data: { message: string; isInternalNote?: boolean }): Promise<any> {
    return request<any>(`/admin/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAdminTicketStatus(ticketId: string, data: { status: string; reason?: string }): Promise<any> {
    return request<any>(`/admin/tickets/${ticketId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async assignAdminTicket(ticketId: string, adminId: string): Promise<any> {
    return request<any>(`/admin/tickets/${ticketId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ adminId })
    });
  },

  // --- Extended Admin: Security Operations Center ---
  async getAdminSecurityOverview(): Promise<any> {
    return request<any>('/admin/security/overview');
  },

  async getAdminSecurityAlerts(): Promise<any[]> {
    return request<any[]>('/admin/security/alerts');
  },

  async revokeAdminUserSessions(userId: string, reason: string): Promise<any> {
    return request<any>(`/admin/security/revoke-sessions/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  // --- Extended Admin: Roulette Tool Telemetry ---
  async getAdminToolTelemetry(): Promise<any> {
    return request<any>('/admin/tool/telemetry');
  },

  // --- Extended Admin: AI Admin Assistant ---
  async queryAdminAiAssistant(query: string): Promise<any> {
    return request<any>('/admin/ai-assistant/query', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  },

  // --- Extended Admin: Notification Management ---
  async getAdminNotificationMetrics(): Promise<any> {
    return request<any>('/admin/notifications/metrics');
  },

  async sendAdminTargetedNotification(data: { title: string; message: string; targetType: string; targetUserId?: string; link?: string }): Promise<any> {
    return request<any>('/admin/notifications/targeted', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // --- Dealer Signature API Proxy Methods ---
  async getDsConfig(): Promise<{ configured: boolean; apiUrl?: string; keyMasked?: string }> {
    const res = await request<{ success: boolean; data: { configured: boolean; apiUrl?: string; keyMasked?: string } }>('/ds/config', {
      bypassCache: true
    });
    return res?.data ?? (res as any);
  },

  async getDsStatus(): Promise<any> {
    return requestRaw<any>('/ds/status', { bypassCache: true });
  },

  async getDsTables(params?: { provider?: string; search?: string; filter?: string; sort?: string; limit?: number; window?: number }): Promise<any> {
    return requestRaw<any>(`/ds/tables${buildQueryString(params)}`, { bypassCache: true });
  },

  async getDsTable(tableId: string): Promise<any> {
    return requestRaw<any>(`/ds/tables/${encodeURIComponent(tableId)}`, { bypassCache: true });
  },

  async getDsTablePrediction(tableId: string, direction: string = 'CW', window: number = 25): Promise<any> {
    return requestRaw<any>(
      `/ds/tables/${encodeURIComponent(tableId)}/prediction?direction=${encodeURIComponent(direction)}&window=${encodeURIComponent(String(window))}`,
      { bypassCache: true }
    );
  },

  async getDsTableRhythm(tableId: string): Promise<any> {
    return requestRaw<any>(
      `/ds/tables/${encodeURIComponent(tableId)}/rhythm`,
      { bypassCache: true }
    );
  },

  async getDsTableTravelChart(tableId: string, direction: string = 'CW', window: number = 25): Promise<any> {
    return requestRaw<any>(
      `/ds/tables/${encodeURIComponent(tableId)}/travel-chart?direction=${encodeURIComponent(direction)}&window=${encodeURIComponent(String(window))}`,
      { bypassCache: true }
    );
  },

  async getDsTablePattern(tableId: string, direction: string = 'CW', window: number = 25): Promise<any> {
    return requestRaw<any>(
      `/ds/tables/${encodeURIComponent(tableId)}/pattern?direction=${encodeURIComponent(direction)}&window=${encodeURIComponent(String(window))}`,
      { bypassCache: true }
    );
  },

  async getDsTableHistory(tableId: string, params?: { period?: string; page?: number; limit?: number; window?: number }): Promise<any> {
    return requestRaw<any>(`/ds/tables/${encodeURIComponent(tableId)}/history${buildQueryString(params)}`, {
      bypassCache: true
    });
  },

  async getDsScanner(params?: { min_spins?: number; min_accuracy?: number; min_rhythm?: number; direction?: string; sort?: string; window?: number }): Promise<any> {
    return requestRaw<any>('/ds/scanner', {
      method: 'POST',
      body: JSON.stringify(params || {}),
      bypassCache: true
    });
  },

  // --- Admin API Settings diagnostics ---
  async getAdminDsDiagnostics(): Promise<any> {
    return request<any>('/admin/tool/ds-diagnostics', { bypassCache: true });
  },

  async testAdminDsConnection(payload?: { dsApiUrl?: string; dsApiKey?: string }): Promise<any> {
    return request<any>('/admin/tool/ds-test', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
      bypassCache: true
    });
  },

  getStoredToken(): string | null {
    return getStoredToken();
  }
};
