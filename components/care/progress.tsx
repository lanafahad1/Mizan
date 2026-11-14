'use client';
// Progress over time: weight towards the goal, blood pressure and blood sugar,
// the last 7 days of calories, days logged in a row, sleep, small wins and (patients) weekly check-ins.
// One view for "My progress" (who = "me": members and patients) and the care
// team's Progress tab (who = patient id).
import * as React from 'react';
import Link from 'next/link';
import { Scale, HeartPulse, Flame } from 'lucide-react';
import { useApi } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Figure, LineChart, VIZ } from '@/components/staff/charts';
import { KpiRow, KpiTile } from '@/components/staff/ui';
import { WeekCard } from '@/components/member/week-card';
import { formatDate } from '@/lib/format';
import { useT } from '@/components/site/lang';
import { C, type CareRef } from './common';
import { GoalsCard } from './goals';
import { CheckinHistory, type Checkins } from './checkin';
import { SleepProgress } from './sleep';
import { WinsCard } from '@/components/member/wins';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Progress = any;
const f1 = (v: number | null | undefined, d = 1) => (v == null ? '–' : v.toLocaleString('en-US', { maximumFractionDigits: d }));

function scale(vals: number[], extra: number[] = []) {
  const all = [...vals, ...extra];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const pad = Math.max(1, (hi - lo) * 0.2);
  return { yMin: Math.max(0, Math.floor(lo - pad)), yMax: Math.ceil(hi + pad) };
}

function WeightCard({ p, team }: { p: Progress; team: boolean }) {
  const { t, lang } = useT();
  const w = p.weights as { date: string; value: number; source?: string }[];
  const target = p.goal?.targetWeight ?? null;
  const { yMin, yMax } = w.length ? scale(w.map((x) => x.value), target != null ? [target] : []) : { yMin: 0, yMax: 1 };
  const change = w.length >= 2 ? Math.round((w.at(-1)!.value - w[0].value) * 10) / 10 : null;
  return (
    <Card className="h-full min-w-0" aria-labelledby="wt-h">
      <CardHeader>
        <div className="flex items-center gap-2"><Scale aria-hidden className="size-5 text-primary" /><CardTitle id="wt-h">{t('Weight')}</CardTitle></div>
        {!team ? <Link href="/my-health?add=weight" className="text-sm font-semibold">{t('Add today’s weight')}</Link> : null}
      </CardHeader>
      {w.length >= 2 ? (
        <>
          {change != null ? <p className="m-0 text-sm">{t('Change since {date}:', { date: formatDate(w[0].date, { day: 'numeric', month: 'short' }, lang) })} <b className="tabular" dir="ltr">{change > 0 ? '+' : ''}{f1(change)} {t('kg')}</b></p> : null}
          <Figure title={t('Weight over time')} caption={target != null ? t('Last {n} weights, kg. The dashed line is the target weight.', { n: w.length }) : t('Last {n} weights, kg.', { n: w.length })}
            headers={[t('Date'), t('Weight (kg)')]} rows={w.map((x) => [formatDate(x.date, undefined, lang), f1(x.value)])}>
            <div dir="ltr" className="contents">
              <LineChart points={w.map((x) => ({ label: formatDate(x.date, undefined, lang), short: x.date.slice(5), date: x.date, value: x.value }))} yMin={yMin} yMax={yMax} fmt={(v) => f1(v)} unit={t('kg')}
                goal={target != null ? { value: target, label: t('Target {n} kg', { n: f1(target) }) } : null} />
            </div>
          </Figure>
        </>
      ) : (
        <CardDescription>{w.length ? t('One weight so far ({n} kg). Add another to see the trend.', { n: f1(w[0].value) }) : team ? t('No weight recorded yet. Add one under Health & targets.') : t('No weight yet. Add your weight to see the trend here.')}</CardDescription>
      )}
    </Card>
  );
}

function ReadingsCard({ p }: { p: Progress }) {
  const { t, lang } = useT();
  const bp = p.bp as { date: string; value: number; value2: number }[];
  const gl = (p.glucose as { date: string; value: number; unit: string; context: string | null }[]).filter((r) => r.unit === (p.glucose.at(-1)?.unit ?? 'mg/dL'));
  const limits = p.goal?.limits ?? {};
  if (!bp.length && !gl.length) return null;
  return (
    <Card aria-labelledby="rd-h">
      <CardHeader><div className="flex items-center gap-2"><HeartPulse aria-hidden className="size-5 text-primary" /><CardTitle id="rd-h">{t('Blood pressure and blood sugar')}</CardTitle></div><span className="text-sm text-muted-foreground">{t('Last 90 days')}</span></CardHeader>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {bp.length ? (
          bp.length >= 2 ? (
            <Figure title={t('Blood pressure (upper number)')} caption={t('{n} readings, mmHg. The table has both numbers.', { n: bp.length })}
              headers={[t('Date'), t('Reading (mmHg)')]} rows={bp.map((r) => [formatDate(r.date, undefined, lang), `${r.value}/${r.value2}`])}>
              <div dir="ltr" className="contents">
                <LineChart points={bp.map((r) => ({ label: formatDate(r.date, undefined, lang), short: r.date.slice(5), date: r.date, value: r.value, detail: `${r.value}/${r.value2} mmHg` }))} {...scale(bp.map((r) => r.value), limits.systolicMax ? [limits.systolicMax] : [])}
                  fmt={(v) => f1(v, 0)} unit="mmHg" color={VIZ.c2} goal={limits.systolicMax ? { value: limits.systolicMax, label: t('Limit {n}', { n: limits.systolicMax }) } : null} />
              </div>
            </Figure>
          ) : <p className="m-0 text-sm">{t('Blood pressure:')} <b dir="ltr">{bp[0].value}/{bp[0].value2}</b> {t('mmHg')} ({formatDate(bp[0].date, undefined, lang)})</p>
        ) : null}
        {gl.length ? (
          gl.length >= 2 ? (
            <Figure title={t('Blood sugar')} caption={t('{n} readings, {unit}.', { n: gl.length, unit: t(gl[0].unit) })}
              headers={[t('Date'), t('Reading ({unit})', { unit: t(gl[0].unit) }), t('When')]} rows={gl.map((r) => [formatDate(r.date, undefined, lang), f1(r.value), r.context ? t(r.context === 'fasting' ? 'Fasting' : r.context === 'after-meal' ? 'After a meal (2 h)' : r.context === 'before-meal' ? 'Before a meal' : 'Other time') : ''])}>
              <div dir="ltr" className="contents">
                <LineChart points={gl.map((r) => ({ label: formatDate(r.date, undefined, lang), short: r.date.slice(5), date: r.date, value: r.value, detail: r.context === 'fasting' ? t('Fasting') : undefined }))} {...scale(gl.map((r) => r.value), limits.glucoseFastingMax && gl[0].unit === 'mg/dL' ? [limits.glucoseFastingMax] : [])}
                  fmt={(v) => f1(v, gl[0].unit === 'mmol/L' ? 1 : 0)} unit={t(gl[0].unit)} goal={limits.glucoseFastingMax && gl[0].unit === 'mg/dL' ? { value: limits.glucoseFastingMax, label: t('Fasting limit {n}', { n: limits.glucoseFastingMax }) } : null} />
              </div>
            </Figure>
          ) : <p className="m-0 text-sm">{t('Blood sugar:')} <b dir="ltr">{f1(gl[0].value)}</b> {t(gl[0].unit)} ({formatDate(gl[0].date, undefined, lang)})</p>
        ) : null}
      </div>
    </Card>
  );
}

/** Progress for "me" or, for the care team, a patient. */
export function ProgressView({ who, initial, team = false, canEditGoals = false, careRef }: { who: string; initial: Progress; team?: boolean; canEditGoals?: boolean; careRef: CareRef }) {
  const { t, lang } = useT();
  const { data } = useApi<Progress>(C(who, '/progress'), initial);
  const p = data ?? initial;
  const member = p.kind === 'member';
  const latest = p.weights.at(-1);
  const checkins = p.checkins as Checkins | undefined;
  const fields = member ? careRef.goalFields.filter((f) => f.key === 'targetWeight') : careRef.goalFields;
  return (
    <div className="flex flex-col gap-5">
      <KpiRow className="[grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))]">
        <KpiTile label="Weight now" value={latest ? <span><bdi dir="ltr">{f1(latest.value)}</bdi> <span className="text-base font-medium text-muted-foreground">{t('kg')}</span></span> : '–'} sub={latest ? formatDate(latest.date, { day: 'numeric', month: 'short' }, lang) : t('No weight yet')} />
        <KpiTile label="Days logged in a row" value={p.streak} sub={p.streak ? t('Food logged each day, up to today') : t('Log a meal today to start')} tone={p.streak >= 3 ? 'ok' : 'default'} />
        <KpiTile label="Days logged, last 30 days" value={p.daysLogged30} of={t('of {n}', { n: 30 })} />
        {checkins ? <KpiTile label="This week’s check-in" value={checkins.thisWeek ? t('Done') : t('Not yet')} tone={checkins.thisWeek ? 'ok' : 'warn'} sub={`${formatDate(checkins.weekStart, { day: 'numeric', month: 'short' }, lang)} – ${formatDate(checkins.weekEnd, { day: 'numeric', month: 'short' }, lang)}`} /> : null}
      </KpiRow>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <WeightCard p={p} team={team} />
        <GoalsCard who={who} data={{ goal: p.goal, progress: p.progress }} canEdit={canEditGoals} team={team} member={member} fields={fields} limitFields={member ? [] : careRef.limitFields} />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <WeekCard week={p.week} links={!team} />
        <Card aria-labelledby="streak-h">
          <CardHeader><div className="flex items-center gap-2"><Flame aria-hidden className="size-5 text-primary" /><CardTitle id="streak-h">{t('Keeping it up')}</CardTitle></div></CardHeader>
          <p className="m-0 text-[.95rem]">
            {p.streak >= 2 ? (team ? t('The patient has logged food {n} days in a row.', { n: p.streak }) : t('You’ve logged food {n} days in a row. Keep going!', { n: p.streak }))
              : p.streak === 1 ? (team ? t('Food was logged yesterday or today.') : t('One day logged. Log tomorrow too to start a streak.'))
                : (team ? t('No food logged yesterday or today.') : t('Log what you eat today to start a streak.'))}
          </p>
          <p className="m-0 text-sm text-muted-foreground">{t('{n} of the last 30 days have food logged.', { n: p.daysLogged30 })} {p.kind === 'patient' ? t('Hospital meals count once their intake is recorded.') : ''}</p>
          {!team ? <Link href="/today" className="self-start text-sm font-semibold">{t('Open your diary')}</Link> : null}
        </Card>
      </div>
      <SleepProgress week={p.week} team={team} />
      {p.wins ? <WinsCard wins={p.wins} team={team} /> : null}
      <ReadingsCard p={p} />
      {team && checkins ? <CheckinHistory data={checkins} /> : null}
    </div>
  );
}
