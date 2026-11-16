'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const AUTH_PATHS = ['/change-password', '/golin', '/gerister', '/forgot-password', '/verify-otp'];

/**
 * Enforces the temporary-password flow. When an administrator sets a temporary
 * password, the user is redirected to /change-password before using the app.
 */
export function PasswordChangeGuard() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user?.mustChangePassword) return;
    if (AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return;
    router.replace('/change-password');
  }, [isLoading, user?.mustChangePassword, pathname, router]);

  return null;
}
