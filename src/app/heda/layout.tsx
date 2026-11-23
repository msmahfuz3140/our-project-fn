import AdminLayoutClient from './AdminLayoutClient';

/**
 * Admin pages use client-side query/hash filters and authenticated API state.
 * Opting the whole Admin Panel segment out of instant-navigation validation
 * prevents Next.js from dropping a segment during client navigation, which can
 * otherwise surface as a misleading "not found" page.
 */
export const instant = false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
