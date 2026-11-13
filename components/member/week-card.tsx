'use client';
// This week: calories of the last 7 days against the daily target, days logged
// and the weight change. The line chart is decorative; the same numbers are written
// out for screen readers (and on hover via each point's title).
import * as React from 'react';
import Link from 'next/link';
import { CalendarDays, Scale } from 'lucide-react';
import { formatDate } from '@/lib/format';
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
        <h2 id="week-h" className="flex items-center gap-2 text-lg sm:text-xl"><CalendarDays className="size-5 text-primary" aria-hidden />{t('This week')}</h2>
        <span className="text-sm text-muted-foreground">{t('{from} – {to}', { from: formatDate(week.from, { month: 'short', day: 'numeric' }, lang), to: formatDate(week.to, { month: 'short', day: 'numeric' }, lang) })}</span>
      </div>

      <ul className="sr-only">{week.days.map((d) => <li key={d.date}>{describe(d)}</li>)}</ul>
      <WeekLine days={week.days} target={target} today={today} dayName={dayName} describe={describe} />
      <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-chart-1" />{target ? t('Within') : t('Logged')}</span>
        {target ? <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-chart-5 shadow-[0_0_0_1px_var(--warning)]" />{t('Over')}</span> : null}
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-chart-2" />{t('Today')}</span>
        {week.days.some((d) => !d.logged) ? <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full border-[1.5px] border-input bg-card" />{t('Nothing logged')}</span> : null}
      </p>

      <dl className="m-0 grid grid-cols-2 gap-3">
        <div className="flex flex-col rounded-[14px] bg-muted px-3 py-2.5">
          <dt className="text-sm text-muted-foreground">{t('Days logged')}</dt>
          <dd className="m-0 font-display text-xl font-semibold text-heading tabular">{t('{n} of 7', { n: week.daysLogged })}</dd>
        </div>
        <div className="flex flex-col rounded-[14px] bg-muted px-3 py-2.5">
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

/** A round top for the y axis so the three ticks (0, half, top) are clean numbers: 1k, 2k, 3k… */
const nice = (v: number) => (v <= 1000 ? Math.ceil(v / 200) * 200 : Math.ceil(v / 1000) * 1000);
const r1 = (n: number) => Math.round(n * 10) / 10;
const kLabel = (v: number) => (v === 0 ? '0' : v >= 1000 ? `${(v / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k` : String(v));

/**
 * The week as a line with a soft area under it. Each logged day is a point: within target (indigo),
 * over target (amber) or today (sky, larger). A dashed line marks the target. The y axis starts at 0
 * and every label stays inside the drawing.
 */
function WeekLine({ days, target, today, dayName, describe }: {
  days: Week['days']; target: number | null; today: string; dayName: (iso: string) => string; describe: (d: Week['days'][number]) => string;
}) {
  const { t } = useT();
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(340);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth((w) => { const next = Math.max(260, Math.floor(el.clientWidth)); return Math.abs(next - w) > 2 ? next : w; });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = 168; const padL = 30; const padR = 10; const padT = 18; const padB = 24;
  const iw = width - padL - padR; const ih = H - padT - padB;
  const top = nice(Math.max(target ?? 0, ...days.map((d) => d.kcal), 500) * 1.08);
  const y = (v: number) => r1(padT + ih - (v / top) * ih);
  const step = iw / days.length;
  const x = (i: number) => r1(padL + step * i + step / 2);
  const base = y(0);
  // Logged days in runs (a day with nothing logged breaks the line).
  const runs: number[][] = [];
  days.forEach((d, i) => { if (!d.logged) return; const last = runs[runs.length - 1]; if (last && last[last.length - 1] === i - 1) last.push(i); else runs.push([i]); });
  const line = (run: number[]) => run.map((i, k) => `${k ? 'L' : 'M'}${x(i)} ${y(days[i].kcal)}`).join(' ');
  const ticks = [0, top / 2, top];
  return (
    <div ref={ref} aria-hidden className="w-full" dir="ltr">
      <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} className="block max-w-full overflow-visible">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={padL} x2={width - padR} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth={1} />
            <text x={padL - 6} y={y(v) + 3.5} textAnchor="end" fontSize={10.5} fontWeight={600} className="fill-muted-foreground tabular">{kLabel(Math.round(v))}</text>
          </g>
        ))}
        {runs.map((run) => (
          <g key={run[0]}>
            {run.length > 1 ? <path d={`${line(run)} L${x(run[run.length - 1])} ${base} L${x(run[0])} ${base} Z`} className="fill-secondary" /> : null}
            {run.length > 1 ? <path d={line(run)} fill="none" className="stroke-primary" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" /> : null}
          </g>
        ))}
        {target ? (
          <g>
            <line x1={padL} x2={width - padR} y1={y(target)} y2={y(target)} className="stroke-foreground" strokeWidth={1.25} strokeDasharray="4 4" opacity={0.7} />
            <text x={padL + 4} y={y(target) - 5} textAnchor="start" fontSize={10.5} fontWeight={700} paintOrder="stroke" stroke="var(--card)" strokeWidth={3} strokeLinejoin="round" className="fill-foreground tabular">{t('Target {n}', { n: n0(target) })}</text>
          </g>
        ) : null}
        {days.map((d, i) => {
          const isToday = d.date === today;
          if (!d.logged) return <circle key={d.date} cx={x(i)} cy={base} r={3.5} className="fill-card stroke-input" strokeWidth={1.5}><title>{describe(d)}</title></circle>;
          const over = Boolean(target && d.kcal > target);
          const cls = isToday ? 'fill-chart-2 stroke-card' : over ? 'fill-chart-5 stroke-warning' : 'fill-chart-1 stroke-card';
          return <circle key={d.date} cx={x(i)} cy={y(d.kcal)} r={isToday ? 6 : 4.5} className={cls} strokeWidth={isToday ? 2.5 : over ? 1.5 : 2}><title>{describe(d)}</title></circle>;
        })}
        {days.map((d, i) => (
          <text key={d.date} x={x(i)} y={H - 7} textAnchor="middle" fontSize={11} fontWeight={d.date === today ? 700 : 500} className={d.date === today ? 'fill-foreground' : 'fill-muted-foreground'}>{dayName(d.date)}</text>
        ))}
      </svg>
    </div>
  );
}
