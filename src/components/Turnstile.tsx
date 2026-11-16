'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef
} from 'react';
import { ShieldCheck, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

export interface TurnstileRef {
  reset: () => void;
  getToken: () => string;
}

export interface TurnstileProps {
  siteKey?: string;
  action?: string;
  onSuccess: (token: string) => void;
  onError?: (errorCode?: string) => void;
  onExpire?: () => void;
  theme?: 'dark' | 'light' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          action?: string;
          theme?: 'dark' | 'light' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
          callback?: (token: string) => void;
          'error-callback'?: (errorCode?: string) => void;
          'expired-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
const DEFAULT_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

export const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(
  (
    {
      siteKey = DEFAULT_SITE_KEY,
      action,
      onSuccess,
      onError,
      onExpire,
      theme = 'dark',
      size = 'normal',
      className = ''
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const tokenRef = useRef<string>('');

    const [status, setStatus] = useState<
      'loading' | 'ready' | 'success' | 'expired' | 'error'
    >('loading');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Reset widget
    const reset = useCallback(() => {
      tokenRef.current = '';
      setStatus('ready');
      setErrorMessage(null);

      if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          // Fallback if widget instance was invalidated
        }
      }
    }, []);

    // Expose reset and getToken methods via ref
    useImperativeHandle(
      ref,
      () => ({
        reset,
        getToken: () => tokenRef.current
      }),
      [reset]
    );

    // Render widget once script is ready
    const renderWidget = useCallback(() => {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;

      try {
        containerRef.current.innerHTML = '';
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme,
          size,
          callback: (token: string) => {
            tokenRef.current = token;
            setStatus('success');
            setErrorMessage(null);
            onSuccess(token);
          },
          'error-callback': (code?: string) => {
            tokenRef.current = '';
            setStatus('error');
            const msg = code ? `Verification failed (${code})` : 'Verification check encountered an error';
            setErrorMessage(msg);
            onError?.(code);
          },
          'expired-callback': () => {
            tokenRef.current = '';
            setStatus('expired');
            setErrorMessage('Security verification expired. Please verify again.');
            onExpire?.();
          }
        });

        widgetIdRef.current = id;
        setStatus('ready');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err?.message || 'Could not initialize security check.');
      }
    }, [siteKey, action, theme, size, onSuccess, onError, onExpire]);

    // Load Turnstile Script
    useEffect(() => {
      if (typeof window === 'undefined') return;

      // If script is already loaded and window.turnstile is available
      if (window.turnstile) {
        renderWidget();
        return;
      }

      // Check if script element already exists
      let script = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = TURNSTILE_SCRIPT_ID;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          renderWidget();
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.turnstile) {
          setStatus('error');
          setErrorMessage('Security check timed out loading. Please refresh.');
        }
      }, 10000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }, [renderWidget]);

    // Clean up on unmount
    useEffect(() => {
      return () => {
        if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // Ignore removal errors on component teardown
          }
          widgetIdRef.current = null;
        }
      };
    }, []);

    return (
      <div className={`my-3 flex flex-col items-center justify-center ${className}`}>
        {/* Loading Skeleton */}
        {status === 'loading' && (
          <div className="flex h-[65px] w-full max-w-[300px] items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-black/40 px-4 text-xs text-slate-400 shadow-inner">
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
            <span className="font-display text-[11px] uppercase tracking-wider text-slate-400">
              Loading Cloudflare Check...
            </span>
          </div>
        )}

        {/* Turnstile Container */}
        <div
          ref={containerRef}
          className={`min-h-[65px] ${status === 'loading' ? 'hidden' : 'block'}`}
        />

        {/* Expired State */}
        {status === 'expired' && (
          <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
            <RefreshCw className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            <span>Verification expired.</span>
            <button
              type="button"
              onClick={reset}
              className="ml-1 font-bold text-amber-400 underline hover:text-amber-300"
            >
              Verify Again
            </button>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
            <span>{errorMessage || 'Verification error'}</span>
            <button
              type="button"
              onClick={reset}
              className="ml-1 font-bold text-red-400 underline hover:text-red-300"
            >
              Retry
            </button>
          </div>
        )}

        {/* Verified Badge Indicator */}
        {status === 'success' && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-medium tracking-tight">Human Verification Complete</span>
          </div>
        )}
      </div>
    );
  }
);

Turnstile.displayName = 'Turnstile';
