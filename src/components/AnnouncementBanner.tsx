'use client';

import React from 'react';
import { Megaphone } from 'lucide-react';
import { usePublicSettings } from '../hooks/usePublicSettings';

export function AnnouncementBanner() {
  const { settings } = usePublicSettings();
  const text = settings?.homepageContent?.announcementBanner?.trim();
  if (!text) return null;

  return (
    <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent px-4 py-2 text-center">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-[11px] font-medium text-amber-200">
        <Megaphone className="h-3.5 w-3.5 shrink-0 text-amber-400" />
        <span>{text}</span>
      </div>
    </div>
  );
}
