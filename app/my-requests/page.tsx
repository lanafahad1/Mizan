import { forbidden } from 'next/navigation';
import { requirePermission, getViewer } from '@/lib/server/session';
import { serviceCall, getReference, param } from '@/lib/server/data';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { addDays, todayIso } from '@/domain/dates.js';
import { LinkFirst } from '@/components/patient/link-account';
import { MyRequestsView } from './my-requests-view';

export async function generateMetadata() {
  const t = await getT();
  return privateMetadata(t('My Requests'));
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MyRequestsPage({ searchParams }: Props) {
  const actor = await requirePermission('patient:read', '/my-requests');
  if (actor.role !== 'patient') forbidden();
  const viewer = await getViewer();
  const pid = viewer?.patientId;
  if (!pid) return <LinkFirst title="My Requests" />;
  const sp = await searchParams;
  const initial = await serviceCall((s) => s.listPatientRequests(actor, pid));
  const ref = await getReference();
  const today = todayIso();
  const vocab = { periods: ref.vocab.periods, requestTypes: ref.vocab.requestTypes, reportKinds: ref.vocab.reportKinds, allergens: ref.vocab.allergens };
  return <MyRequestsView pid={pid} demoId={viewer!.patientDemoId ?? ''} initial={initial} focusId={param(sp.id) ?? null} vocab={vocab} today={today} maxDate={addDays(today, 6)} />;
}
