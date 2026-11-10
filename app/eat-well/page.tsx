import { forbidden } from 'next/navigation';
import { requireActor, getViewer } from '@/lib/server/session';
import { serviceCall, param } from '@/lib/server/data';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { LinkFirst } from '@/components/patient/link-account';
import { buildIdeas, ideaSources, allergenLabel, MEAL_SHARES } from '@/components/member/ideas-data';
import { EatWellView } from '@/components/member/eat-well-view';
import { EAT_WELL_TABS, type EatWellTab } from '@/components/member/eat-well-tabs';

export async function generateMetadata() {
  const t = await getT();
  return privateMetadata(t('Eat well'));
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Eat well: meal ideas, the MOH meal plan, its shopping list and MOH healthy habits (members and hospital patients). */
export default async function EatWellPage({ searchParams }: Props) {
  const actor = await requireActor('/eat-well');
  if (actor.role !== 'member' && actor.role !== 'patient') forbidden();
  if (actor.role === 'patient') {
    const viewer = await getViewer();
    if (!viewer?.patientId) return <LinkFirst title={(await getT())('Eat well')} />;
  }
  const sp = await searchParams;
  const raw = param(sp.tab);
  const tab: EatWellTab = (EAT_WELL_TABS as readonly string[]).includes(raw ?? '') ? (raw as EatWellTab) : 'ideas';
  const overview = await serviceCall((s) => s.getHealthOverview(actor, 'me'));
  const allergies: string[] = overview.profile?.allergies ?? [];
  const { ideas, hidden } = buildIdeas(allergies);
  return (
    <EatWellView
      tab={tab}
      kind={overview.kind === 'patient' ? 'patient' : 'member'}
      targetKcal={overview.targets?.kcal ?? null}
      targetsBasis={overview.targetsBasis ?? null}
      planKcal={overview.plan?.kcal ?? null}
      ideas={{ ideas, hidden, allergies: allergies.map(allergenLabel), shares: MEAL_SHARES, sources: ideaSources() }}
    />
  );
}
