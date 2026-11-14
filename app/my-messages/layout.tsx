import { forbidden } from 'next/navigation';
import { requirePermission } from '@/lib/server/session';

/** Patient-only (checked here too, so the 403 page is sent with a 403 status). */
export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const actor = await requirePermission('care:own', '/my-messages');
  if (actor.role !== 'patient') forbidden();
  return children;
}
