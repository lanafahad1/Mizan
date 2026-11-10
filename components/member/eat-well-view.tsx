'use client';
// Eat well: one page, one level of tabs — Meal ideas | My plan | Shopping list |
// Healthy habits. The tab is kept in the address (?tab=) so it can be linked.
// (The medical disclaimer is in the site footer.)
import * as React from 'react';
import { Lightbulb, ClipboardList, ShoppingBasket, Footprints } from 'lucide-react';
import { PageHead, PageBody } from '@/components/site/page-head';
import { Tabs, TabsList, TabsTab, TabsPanel } from '@/components/ui/tabs';
import { IdeasView, type Idea, type IdeaSource } from '@/app/meal-ideas/ideas-view';
import { PlanTab, ShoppingTab, HabitsTab } from '@/app/my-plan/plan-view';
import { useT } from '@/components/site/lang';
import { EAT_WELL_TABS, type EatWellTab } from './eat-well-tabs';

// Phones get the short label so all four tabs fit without scrolling.
const TABS: { id: EatWellTab; label: string; short: string; icon: React.ComponentType<{ 'aria-hidden'?: boolean }> }[] = [
  { id: 'ideas', label: 'Meal ideas', short: 'Ideas', icon: Lightbulb },
  { id: 'plan', label: 'My plan', short: 'Plan', icon: ClipboardList },
  { id: 'shopping', label: 'Shopping list', short: 'Shopping', icon: ShoppingBasket },
  { id: 'habits', label: 'Healthy habits', short: 'Habits', icon: Footprints },
];

export function EatWellView({ tab: initialTab, kind, targetKcal, targetsBasis, planKcal, ideas }: {
  tab: EatWellTab; kind: 'member' | 'patient'; targetKcal: number | null; targetsBasis: string | null; planKcal: number | null;
  ideas: { ideas: Idea[]; hidden: number; allergies: string[]; shares: Record<string, number>; sources: IdeaSource[] };
}) {
  const { t } = useT();
  const [tab, setTab] = React.useState<EatWellTab>(initialTab);
  React.useEffect(() => { setTab(initialTab); }, [initialTab]);
  const change = (v: unknown) => {
    const next = (EAT_WELL_TABS as readonly string[]).includes(String(v)) ? (v as EatWellTab) : 'ideas';
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', next);
    url.hash = '';
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
  };
  const plan = { kind, targetKcal, targetsBasis, planKcal };
  return (
    <>
      <PageHead space="member" eyebrow={kind === 'member' ? t('Private to you') : t('Hospital care')} title={t('Eat well')} className="print:hidden">
        <p>{t('Find meals you’ll enjoy, follow a simple plan from the Ministry of Health, and shop with a ready-made list.')}</p>
      </PageHead>
      <PageBody space="member">
        <Tabs value={tab} onValueChange={change} className="flex flex-col gap-5">
          <div className="print:hidden">
            <TabsList aria-label={t('Eat well sections')} className="max-sm:flex max-sm:w-full">
              {TABS.map((x) => {
                const Ico = x.icon;
                return (
                  <TabsTab key={x.id} value={x.id} className="min-h-11 justify-center max-sm:min-w-0 max-sm:flex-1 max-sm:px-1.5 max-sm:[&_svg]:hidden">
                    <Ico aria-hidden /><span className="sm:hidden">{t(x.short)}</span><span className="max-sm:hidden">{t(x.label)}</span>
                  </TabsTab>
                );
              })}
            </TabsList>
          </div>
          <TabsPanel value="ideas" className="outline-none">
            <IdeasView kind={kind} targetKcal={targetKcal} targetsBasis={targetsBasis} {...ideas} />
          </TabsPanel>
          <TabsPanel value="plan" className="outline-none"><PlanTab {...plan} /></TabsPanel>
          <TabsPanel value="shopping" className="outline-none"><ShoppingTab {...plan} /></TabsPanel>
          <TabsPanel value="habits" className="outline-none"><HabitsTab /></TabsPanel>
        </Tabs>
      </PageBody>
    </>
  );
}
