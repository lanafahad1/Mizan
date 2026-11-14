import { requirePermission } from '@/lib/server/session';

/** Healthcare providers and admins (checked here too, so the 403 page is sent with a 403 status). */
export default async function Layout({ children }: { children: React.ReactNode }) {
  await requirePermission('care:read', '/messages');
  return children;
}
