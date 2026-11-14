import { forbidden } from 'next/navigation';
import { requireActor, getViewer } from '@/lib/server/session';
import { serviceCall, param } from '@/lib/server/data';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { isoDate } from '@/lib/format';
import { addDays } from '@/domain/dates.js';
import { LinkFirst } from '@/components/patient/link-account';
import type { Diary } from '@/components/diary/types';
import { SOURCES } from '@/domain/rules.js';
import { TodayView } from './today-view';

/** Titles and links of the MOH Ramadan pages, for the tips card (the full list is on /sources). */
const RAMADAN_SOURCE_IDS = ['MOH-SUHOOR', 'MOH-RAMADAN-CHRONIC', 'MOH-RAMADAN-HEART', 'MOH-RAMADAN-BP', 'MOH-RAMADAN-DIABETES'];
const ramadanSources = () => Object.fromEntries(RAMADAN_SOURCE_IDS.map((id) => {
  const s = (SOURCES as unknown as Record<string, { title: string; url: string | null }>)[id];
  return [id, { title: s.title, url: s.url }];
}));

export async function generateMetadata() {
  const t = await getT();
  return privateMetadata(t('Diary'));
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Food diary for members (personal use) and hospital patients (their own record). */
export default async function TodayPage({ searchParams }: Props) {
  const actor = await requireActor('/today');
  if (actor.role !== 'member' && actor.role !== 'patient') forbidden();
  if (actor.role === 'patient') {
    const viewer = await getViewer();
    if (!viewer?.patientId) return <LinkFirst title={(await getT())("Today")} />;
  }

  const sp = await searchParams;
  const date = isoDate(param(sp.date));
  let initial = (await serviceCall((s) => s.getDiary(actor, 'me', { date }))) as Diary;
  // A link outside the diary's window (60 days back to tomorrow) opens today instead.
  if (date && (initial.date < addDays(initial.today, -60) || initial.date > addDays(initial.today, 1))) {
    initial = (await serviceCall((s) => s.getDiary(actor, 'me', {}))) as Diary;
  }
  return <TodayView initial={initial} role={actor.role} sources={ramadanSources()} />;
}
