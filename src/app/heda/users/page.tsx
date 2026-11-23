import UsersClient from './UsersClient';

/**
 * The Users page relies on client-side hash/query filters and authenticated
 * API state. Opting this route segment out of instant-navigation validation
 * prevents Next.js from dropping the segment during client navigation, which
 * can otherwise surface as a misleading "not found" page.
 */
export const instant = false;

export default function AdminUsersPage() {
  return <UsersClient />;
}
