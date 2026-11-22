'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AuthUser,
  AuthResponse,
  LoginInput,
  RegisterInput,
  VerifyOtpInput,
  ResendOtpInput
} from '../shared/auth';
import { authClient, hasSessionHint, markSessionActive, clearStoredToken } from '../lib/auth-client';
import {
  clearDisclaimerPendingAfterLogin,
  markDisclaimerPendingAfterLogin,
  resetDisclaimerAcknowledgement
} from '../lib/disclaimer-storage';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<AuthResponse>;
  register: (input: RegisterInput) => Promise<AuthResponse>;
  verifyOtp: (input: VerifyOtpInput) => Promise<AuthResponse>;
  completeAdminTwoFactor: (response: AuthResponse) => Promise<void>;
  resendOtp: (input: ResendOtpInput) => Promise<{ success: boolean; cooldownSeconds: number }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    // Sessions normally live in an HttpOnly cookie, which JavaScript cannot
    // inspect. The non-secret presence hint tells us whether a server check is
    // worthwhile; otherwise guests avoid a guaranteed 401 on every page load.
    if (!hasSessionHint()) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await authClient.getMe();
      markSessionActive();
      setUser(me);
      setToken(hasSessionHint() ? 'cookie-session' : null);
    } catch {
      clearStoredToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (input: LoginInput): Promise<AuthResponse> => {
    const res = await authClient.login(input);

    // Admin password verification is only the first factor. Do not establish
    // a client session until the TOTP challenge has been completed.
    if (res.requiresAdmin2FA) {
      setUser(null);
      setToken(null);
      return res;
    }

    // A fresh login should show the mandatory disclaimer exactly once again.
    resetDisclaimerAcknowledgement(res.user.id);
    markDisclaimerPendingAfterLogin();
    // Credential-issuing responses intentionally omit account-state fields.
    // Hydrate the authenticated user (including mustChangePassword) from /auth/me
    // so the forced-password-change guard keeps working.
    let hydratedUser = res.user;
    try {
      hydratedUser = await authClient.getMe();
      markSessionActive();
    } catch {
      // Keep the sanitised login user if the follow-up read is unavailable.
    }
    setUser(hydratedUser);
    setToken(res.token || null);
    return { ...res, user: hydratedUser };
  };

  const completeAdminTwoFactor = async (res: AuthResponse): Promise<void> => {
    resetDisclaimerAcknowledgement(res.user.id);
    markDisclaimerPendingAfterLogin();
    setUser(res.user);
    setToken(res.token || 'cookie-session');
    try {
      const hydrated = await authClient.getMe();
      markSessionActive();
      setUser(hydrated);
    } catch {
      // The signed-in response is still sufficient for the current page.
    }
  };

  const register = async (input: RegisterInput): Promise<AuthResponse> => {
    const res = await authClient.register(input);
    if (res.token) {
      resetDisclaimerAcknowledgement(res.user.id);
      markDisclaimerPendingAfterLogin();
      setUser(res.user);
      setToken(res.token);
    }
    return res;
  };

  const verifyOtp = async (input: VerifyOtpInput): Promise<AuthResponse> => {
    const res = await authClient.verifyOtp(input);
    resetDisclaimerAcknowledgement(res.user.id);
    markDisclaimerPendingAfterLogin();
    setUser(res.user);
    setToken(res.token || null);
    return res;
  };

  const resendOtp = async (input: ResendOtpInput): Promise<{ success: boolean; cooldownSeconds: number }> => {
    return authClient.resendOtp(input);
  };

  const logout = async (): Promise<void> => {
    await authClient.logout();
    resetDisclaimerAcknowledgement();
    clearDisclaimerPendingAfterLogin();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && user.isActive !== false && (user.isEmailVerified || user.isPhoneVerified),
        login,
        register,
        verifyOtp,
        completeAdminTwoFactor,
        resendOtp,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
