'use client';
// This week: calories of the last 7 days against the daily target, days logged
// and the weight change. The bars are decorative; the same numbers are written
// out for screen readers (and on tap/hover via each bar's title).
import Link from 'next/link';
import { CalendarDays, Scale } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { n0, type Week } from './daily';

export function WeekCard({ week }: { week: Week }) {
  const { t, lang } = useT();
  const target = week.target;
  const top = Math.max(target ?? 0, ...week.days.map((d) => d.kcal), 1) * 1.1;
  const H = 112;
  const today = week.to;
  const dayName = (iso: string) => formatDate(iso, { weekday: lang === 'ar' ? 'narrow' : 'short' }, lang);
  const longDay = (iso: string) => formatDate(iso, { weekday: 'long', month: 'short', day: 'numeric' }, lang);
  const describe = (d: Week['days'][number]) => !d.logged ? t('{day}: nothing logged', { day: longDay(d.date) })
    : target ? t('{day}: {n} kcal of {target}{over}', { day: longDay(d.date), n: n0(d.kcal), target: n0(target), over: d.kcal > target ? ` (${t('over target')})` : '' })
      : t('{day}: {n} kcal', { day: longDay(d.date), n: n0(d.kcal) });
  const wc = week.weightChange;
  return (
    <section aria-labelledby="week-h" className="flex flex-col gap-4 rounded-[20px] border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="week-h" className="flex items-center gap-2 text-lg sm:text-xl"><CalendarDays className="size-5 text-sage-deep" aria-hidden />{t('This week')}</h2>
        <span className="text-sm text-muted-foreground">{t('{from} – {to}', { from: formatDate(week.from, { month: 'short', day: 'numeric' }, lang), to: formatDate(week.to, { month: 'short', day: 'numeric' }, lang) })}</span>
      </div>

      <ul className="sr-only">{week.days.map((d) => <li key={d.date}>{describe(d)}</li>)}</ul>
      <div aria-hidden className="relative" dir="ltr">
        <div className="relative flex items-end gap-1.5 sm:gap-3" style={{ height: H }}>
          {target ? (
            <div className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-rose-ink/50" style={{ bottom: Math.round((target / top) * H) }}>
              <span className="absolute -top-5 end-0 rounded-full bg-card px-1.5 text-[11px] font-semibold text-rose-ink tabular">{t('target {n}', { n: n0(target) })}</span>
            </div>
          ) : null}
          {week.days.map((d) => {
            const h = d.logged ? Math.max(6, Math.round((d.kcal / top) * H)) : 4;
            const over = Boolean(target && d.kcal > target);
            return (
              <div key={d.date} title={describe(d)} className="flex h-full flex-1 flex-col justify-end">
                <span className={cn('block w-full rounded-t-[8px]', !d.logged ? 'bg-border' : over ? 'bg-pink-deep' : 'bg-sage', d.date === today && 'ring-2 ring-primary ring-offset-1 ring-offset-card')} style={{ height: h }} />
              </div>
            );
          })}
        </div>
        <div className="mt-1.5 flex gap-1.5 sm:gap-3">
          {week.days.map((d) => (
            <span key={d.date} className={cn('flex-1 truncate text-center text-[11px] text-muted-foreground', d.date === today && 'font-bold text-heading')}>{dayName(d.date)}</span>
          ))}
        </div>
      </div>
      <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-sage" />{target ? t('Within target') : t('Logged')}</span>
        {target ? <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-pink-deep" />{t('Over target')}</span> : null}
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-border" />{t('Nothing logged')}</span>
      </p>

      <dl className="m-0 grid grid-cols-2 gap-3">
        <div className="flex flex-col rounded-[14px] bg-background px-3 py-2.5">
          <dt className="text-sm text-muted-foreground">{t('Days logged')}</dt>
          <dd className="m-0 font-display text-xl font-semibold text-heading tabular">{t('{n} of 7', { n: week.daysLogged })}</dd>
        </div>
        <div className="flex flex-col rounded-[14px] bg-background px-3 py-2.5">
          <dt className="flex items-center gap-1 text-sm text-muted-foreground"><Scale className="size-3.5" aria-hidden />{t('Weight change')}</dt>
          <dd className="m-0 font-display text-xl font-semibold text-heading tabular">
            {wc == null ? <Link href="/my-health?add=weight" className="font-sans text-sm font-semibold">{t('Add a weight')}</Link> : <span dir="ltr">{wc > 0 ? '+' : ''}{wc.toLocaleString('en-US', { maximumFractionDigits: 1 })} {t('kg')}</span>}
          </dd>
        </div>
      </dl>
      <Link href="/today" className="self-start text-sm font-semibold">{t('Open your diary')}</Link>
    </section>
  );
}
