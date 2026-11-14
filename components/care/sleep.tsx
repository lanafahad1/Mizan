'use client';
// Sleep over the last 7 nights (hours typed in by the person, on the day they woke up),
// against the MOH advice for adults: 7–8 hours a night (SLEEP_TIPS, MOH Calorie Guide).
// Used by "My progress" (with the sleep tracker to add last night) and the care team's
// Progress tab (read only). The bars are decorative; the same numbers are in a list.
import * as React from 'react';
import { Moon } from 'lucide-react';
import { Accordion } from '@/components/ui/accordion';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { SleepCard } from '@/components/member/trackers';
import { h1, type Week } from '@/components/member/daily';
import { SLEEP_TIPS, MOH_GUIDE_META } from '@/data/moh-calorie-guide.js';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';

const TOP = 12; // hours at the top of the bars

export function SleepProgress({ week, team = false }: { week: Week; team?: boolean }) {
  const { t, lang } = useT();
  const nights = week.days.map((d) => ({ date: d.date, hours: d.sleep ?? null }));
  const logged = nights.filter((n) => n.hours != null) as { date: string; hours: number }[];
  const avg = logged.length ? logged.reduce((a, n) => a + n.hours, 0) / logged.length : null;
  const last = nights.at(-1)?.hours ?? null;
  const day = (iso: string) => formatDate(iso, { weekday: lang === 'ar' ? 'narrow' : 'short' }, lang);
  const longDay = (iso: string) => formatDate(iso, { weekday: 'long', month: 'short', day: 'numeric' }, lang);
  const chart = (
    <Card className="min-w-0" aria-labelledby="sleep-h">
      <CardHeader>
        <div className="flex items-center gap-2"><Moon aria-hidden className="size-5 text-primary" /><CardTitle id="sleep-h">{t('Sleep')}</CardTitle></div>
        <span className="text-sm text-muted-foreground">{t('Last 7 nights')}</span>
      </CardHeader>
      <p className="m-0 text-[.95rem]">
        {avg == null ? (team ? t('No sleep logged in the last 7 nights.') : t('No sleep logged yet. Add last night’s sleep to see it here.'))
          : logged.length === 1 ? t('{n} hours on the one night logged this week.', { n: h1(logged[0].hours) })
            : t('Average {n} hours over {k} nights logged.', { n: h1(Math.round(avg * 10) / 10), k: logged.length })}
      </p>
      <ul className="sr-only">{nights.map((n) => <li key={n.date}>{longDay(n.date)}: {n.hours == null ? t('not logged') : t('{n} hours', { n: h1(n.hours) })}</li>)}</ul>
      <div aria-hidden className="relative grid h-36 grid-cols-7 items-end gap-1.5 border-b border-border pb-0" dir="ltr">
        {/* The MOH band: 7–8 hours. */}
        <span className="pointer-events-none absolute inset-x-0 rounded-sm bg-success-soft" style={{ bottom: `${(7 / TOP) * 100}%`, height: `${(1 / TOP) * 100}%` }} />
        {nights.map((n, i) => (
          <div key={n.date} className="relative flex h-full flex-col items-center justify-end">
            {n.hours != null ? (
              <>
                <span className="mb-0.5 text-[.7rem] font-semibold text-heading tabular">{h1(n.hours)}</span>
                <span className={cn('mz-bar w-full max-w-7 rounded-t-[8px]', n.hours >= 7 ? 'bg-primary' : 'bg-chart-3')} style={{ height: `${Math.min(1, n.hours / TOP) * 100}%`, '--i': i } as React.CSSProperties} />
              </>
            ) : <span className="mb-0.5 size-2 rounded-full border-[1.5px] border-input bg-card" />}
          </div>
        ))}
      </div>
      <div aria-hidden className="-mt-2 grid grid-cols-7 gap-1.5 text-center text-[.72rem] text-muted-foreground" dir="ltr">
        {nights.map((n) => <span key={n.date} className={n.date === week.to ? 'font-bold text-foreground' : undefined}>{day(n.date)}</span>)}
      </div>
      <p className="m-0 flex items-start gap-2 text-sm text-muted-foreground"><span aria-hidden className="mt-1 h-3 w-5 shrink-0 rounded-sm bg-success-soft ring-1 ring-success-border" /><span>{t('Green band: 7–8 hours.')} {t(SLEEP_TIPS[0])}</span></p>
      <Accordion className="border-t border-border" headClassName="min-h-11 py-2 font-display text-sm font-medium text-heading" title={t('Sleep tips from the Ministry of Health')}>
        <ul className="m-0 list-disc pb-2 ps-5 text-sm">{SLEEP_TIPS.slice(1).map((x) => <li key={x}>{t(x)}</li>)}</ul>
      </Accordion>
      <p className="m-0 text-xs text-muted-foreground">
        {t('Source:')} <a href={MOH_GUIDE_META.url} target="_blank" rel="noopener noreferrer">{lang === 'ar' ? MOH_GUIDE_META.titleAr : t('Saudi Ministry of Health, Calorie Guide for Weight Loss')}<span className="sr-only"> {t('(opens in a new tab)')}</span></a>
      </p>
    </Card>
  );
  if (team) return chart;
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
      <SleepCard value={last} />
      {chart}
    </div>
  );
}
