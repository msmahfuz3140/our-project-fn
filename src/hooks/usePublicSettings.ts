'use client';

import { useCallback, useEffect, useState } from 'react';
import { authClient } from '../lib/auth-client';

export interface PublicWebsiteSettings {
  siteName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  brandColors?: { primary?: string; accent?: string; background?: string };
  supportContact?: { email?: string; telegram?: string; discord?: string };
  socialLinks?: { twitter?: string; telegram?: string; youtube?: string; discord?: string };
  homepageContent?: { heroTitle?: string; heroSubtitle?: string; announcementBanner?: string };
  footerContent?: { copyrightText?: string; disclaimerText?: string };
  faqItems?: Array<{ question: string; answer: string; category?: string; order?: number }>;
  legalPolicies?: Record<string, string>;
  updatedAt?: string;
}

/**
 * Shared public settings loader. The underlying authClient cache deduplicates
 * requests across every component and persists public data for fast navigation.
 */
export function usePublicSettings() {
  const [settings, setSettings] = useState<PublicWebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await authClient.getPublicWebsiteSettings();
      setSettings(data || null);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Website settings are temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { settings, loading, error, refresh: load };
}
