import { forbidden } from 'next/navigation';
import { requireActor, getViewer } from '@/lib/server/session';
import { serviceCall } from '@/lib/server/data';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { LinkFirst } from '@/components/patient/link-account';
import { MyProgressView } from './my-progress-view';

export async function generateMetadata() {
  const t = await getT();
  return privateMetadata(t('My progress'));
}

/** "My progress" for members (their own data only) and patients (with goals, notes, check-ins and care team). */
export default async function MyProgressPage() {
  const actor = await requireActor('/my-progress');
  if (actor.role !== 'member' && actor.role !== 'patient') forbidden();
  if (actor.role === 'patient' && !(await getViewer())?.patientId) return <LinkFirst title="My progress" />;
  const [progress, careRef] = await Promise.all([
    serviceCall((s) => s.getProgress(actor, 'me')),
    serviceCall((s) => s.careReference()),
  ]);
  if (actor.role === 'member') return <MyProgressView progress={progress} careRef={careRef} />;
  const [team, notes] = await Promise.all([
    serviceCall((s) => s.getCareTeam(actor, 'me')),
    serviceCall((s) => s.listNotes(actor, 'me')),
  ]);
  return <MyProgressView progress={progress} careRef={careRef} team={team} notes={notes} />;
}
