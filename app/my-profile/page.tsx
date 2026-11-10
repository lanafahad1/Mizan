import { forbidden } from 'next/navigation';
import { requirePermission, getViewer } from '@/lib/server/session';
import { serviceCall, getReference, param } from '@/lib/server/data';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { todayIso } from '@/domain/dates.js';
import { LinkFirst } from '@/components/patient/link-account';
import { MyProfileView } from './my-profile-view';

export async function generateMetadata() {
  const t = await getT();
  return privateMetadata(t('My Food Profile'));
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MyProfilePage({ searchParams }: Props) {
  const actor = await requirePermission('patient:read', '/my-profile');
  if (actor.role !== 'patient') forbidden();
  const viewer = await getViewer();
  const pid = viewer?.patientId;
  if (!pid) return <LinkFirst title="My Food Profile" />;
  const sp = await searchParams;
  const initial = await serviceCall((s) => s.getPatient(actor, pid));
  const ref = await getReference();
  const reference = { vocab: ref.vocab, ingredients: ref.ingredients, dietCategories: ref.dietCategories, dietSupport: ref.dietSupport };
  return <MyProfileView pid={pid} initial={initial} reference={reference} openReport={param(sp.report) === '1'} today={todayIso()} />;
}
