'use client';
// The care team's read-only view of a patient's food diary for one day: what they
// logged plus the hospital meals with recorded intake, against their targets.
// Opening it is recorded in the patient's activity log (once a day per provider).
import * as React from 'react';
import { GlassWater, Footprints, Activity } from 'lucide-react';
import { useApi, apiPath, apiSend } from '@/lib/api-client';
import { addDays } from '@/domain/dates.js';
import { DateNav } from '@/components/cb/date-nav';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { MacroRings } from '@/components/diary/macro-rings';
import { MinorBars } from '@/components/diary/macro-bars';
import { MealCard } from '@/components/diary/meal-card';
import { fmt, type Diary } from '@/components/diary/types';
import { useT } from '@/components/site/lang';
import { C } from './common';

export function FoodTab({ id, today }: { id: string; today: string }) {
  const { t } = useT();
  const [date, setDate] = React.useState(today);
  const key = apiPath(`/api/health/${encodeURIComponent(id)}/diary`, { date });
  const { data, error } = useApi<Diary>(key);
  React.useEffect(() => { void apiSend('POST', C(id, '/diary-view')).catch(() => {}); }, [id]);
  const d = data && data.date === date ? data : null;
  const kcal = d?.totals.kcal ?? 0;
  const goal = d?.targets?.kcal ?? null;
  const any = d ? d.meals.some((m) => m.entries.length) : false;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateNav date={date} onChange={setDate} min={addDays(today, -60)} max={today} id="food-date" label="Diary date" />
        <span className="text-sm text-muted-foreground">{t('Read-only. Hospital meals appear once their intake is recorded.')}</span>
      </div>
      {error && !d ? <Notice tone="danger" title={t('We couldn’t load this day.')}>{t(error.message)}</Notice> : null}
      {!d ? <LoadingBlock label={t('Loading the food diary…')} rows={3} /> : (
        <>
          <Card aria-labelledby="food-sum-h">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="food-sum-h" className="text-lg sm:text-xl">{t('Day total')}</h2>
              <p className="m-0 font-display text-lg font-semibold text-heading tabular" dir="auto">
                {goal ? t('{kcal} of {target} kcal', { kcal: fmt(kcal), target: fmt(goal) }) : t('{n} kcal', { n: fmt(kcal) })}
              </p>
            </div>
            {any ? <MacroRings totals={d.totals} targets={d.targets} missing={d.missing} /> : <p className="m-0 text-sm text-muted-foreground">{t('Nothing logged on this day.')}</p>}
            {any ? <MinorBars totals={d.totals} targets={d.targets} missing={d.missing} /> : null}
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0 text-sm" aria-label={t('Daily trackers')}>
              <li className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5"><GlassWater className="size-4 text-primary" aria-hidden />{t('Water')}: <b className="tabular">{d.daily?.water ?? '–'}</b>{d.daily?.water != null ? ` ${t('cups')}` : ''}</li>
              <li className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5"><Footprints className="size-4 text-primary" aria-hidden />{t('Steps')}: <b className="tabular">{d.daily?.steps != null ? d.daily.steps.toLocaleString('en-US') : '–'}</b></li>
              <li className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5"><Activity className="size-4 text-primary" aria-hidden />{t('Active minutes')}: <b className="tabular">{d.daily?.activity ?? '–'}</b></li>
            </ul>
            {d.targetsBasis === 'care-team' && d.targets ? <p className="m-0 text-xs text-muted-foreground">{t('Targets set by the care team.')}</p> : null}
          </Card>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {d.meals.map((m) => <MealCard key={m.id} meal={m} readOnly />)}
          </div>
        </>
      )}
    </div>
  );
}
