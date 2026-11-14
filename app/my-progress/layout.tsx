import { forbidden } from 'next/navigation';
import { requireActor } from '@/lib/server/session';

/** Members and patients only (checked here too, so the 403 page is sent with a 403 status). */
export default async function ProgressLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor('/my-progress');
  if (actor.role !== 'member' && actor.role !== 'patient') forbidden();
  return children;
}
