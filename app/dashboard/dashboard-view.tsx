'use client';
import * as React from 'react';
import Link from 'next/link';
import { Info, Calendar, TriangleAlert, Activity, ThumbsUp, MessageSquare, HeartPulse, ClipboardList, CalendarClock, Gauge } from 'lucide-react';
import { useApi, apiPath } from '@/lib/api-client';
import { PageHead, PageBody } from '@/components/site/page-head';
import { FlagChips, AppetiteChip } from '@/components/cb/status';
import { Pid } from '@/components/cb/misc';
import { periodLabel } from '@/components/cb/labels';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Accordion } from '@/components/ui/accordion';
import { formatDate, formatLongDate } from '@/lib/format';
import { useT } from '@/components/site/lang';
import { Panel, KpiTile, KpiRow } from '@/components/staff/ui';
import { Figure, Legend, LineChart, HBarChart, StackedChart, VIZ, type Series } from '@/components/staff/charts';
import { NeedsAttention, type Attention } from '@/components/care/attention';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Dashboard = any;

/** Chronic-condition summary built in page.tsx from the patient list and each patient's health space. */
export type Chronic = {
  admitted: number;
  conditions: { id: string; label: string; count: number }[];
  bmi: { id: string; label: string; count: number }[];
  waiting: { patientId: string; demoId: string; name: string; submittedAt: string | null }[];
  due: { patientId: string; demoId: string; name: string; nextReviewOn: string; overdue: boolean }[];
};

// Ordinal ramp (one hue, light → dark), validated with the dataviz palette checker.
const STATES: Series[] = [
  { key: 'none', label: 'Not scheduled', color: VIZ.o1 },
  { key: 'offered', label: 'Options offered', color: VIZ.o2 },
  { key: 'selected', label: 'Choice submitted', color: VIZ.o3, ink: 'light' },
  { key: 'confirmedPlus', label: 'Confirmed, prepared or delivered', color: VIZ.o4, ink: 'light' },
];
const pct = (v: number) => `${Math.round(v)}%`;

function AttentionList({ children }: { children: React.ReactNode }) {
  return <ul className="m-0 flex list-none flex-col divide-y divide-border p-0">{children}</ul>;
}
function AttentionItem({ children }: { children: React.ReactNode }) {
  return <li className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0">{children}</li>;
}

function ChronicSection({ c }: { c: Chronic }) {
  const { t, lang } = useT();
  const obese = c.bmi.filter((b) => b.id.startsWith('obese')).reduce((s, b) => s + b.count, 0);
  const measured = c.bmi.filter((b) => b.id !== 'none').reduce((s, b) => s + b.count, 0);
  const overdue = c.due.filter((d) => d.overdue).length;
  const healthLink = (pid: string) => `/patients/${pid}?tab=health`;
  return (
    <div className="flex flex-col gap-4">
      <KpiRow>
        <KpiTile label="Admitted patients" value={c.admitted} sub={t('{n} with weight and height recorded', { n: measured })} />
        <KpiTile label="BMI 30 or more (obesity)" value={obese} of={measured ? t('of {n}', { n: measured }) : undefined} sub="from the latest weight and height (MOH BMI categories)" />
        <KpiTile tone={c.waiting.length ? 'warn' : 'default'} label="Assessments waiting for review" value={c.waiting.length} sub="sent by patients" />
        <KpiTile tone={overdue ? 'danger' : 'default'} label="Reviews due in 7 days" value={c.due.length} sub={overdue ? t('{n} overdue', { n: overdue }) : 'none overdue'} />
      </KpiRow>
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <Panel id="cond-h" icon={HeartPulse} title="Patients by condition" className="lg:col-span-6">
          <Figure title="Admitted patients with each condition" caption="From the conditions recorded in each patient’s record by the care team. A patient can have more than one."
            headers={['Condition', 'Patients']} rows={c.conditions.map((x) => [x.label, x.count])}>
            <HBarChart unit="Patients" fmt={(v) => String(v)} items={c.conditions.map((x) => ({ label: x.label, value: x.count }))} />
          </Figure>
        </Panel>
        <Panel id="bmi-h" icon={Gauge} title="BMI of admitted patients" className="lg:col-span-6">
          <Figure title="Patients by BMI category" caption="Latest weight and height in each patient’s health space. Categories: MOH BMI calculator (under 18.5 underweight, 18.5–24.9 healthy, 25–29.9 overweight, 30 or more obesity classes 1–3)."
            headers={['BMI category', 'Patients']} rows={c.bmi.map((x) => [x.label, x.count])}>
            <HBarChart unit="Patients" color={VIZ.c2} fmt={(v) => String(v)} items={c.bmi.map((x) => ({ label: x.label, value: x.count }))} />
          </Figure>
        </Panel>
        <Panel id="wait-h" icon={ClipboardList} title="Assessments waiting for review" className="lg:col-span-6">
          {c.waiting.length ? (
            <AttentionList>
              {c.waiting.map((w) => (
                <AttentionItem key={`${w.patientId}-${w.submittedAt}`}>
                  <Link href={healthLink(w.patientId)} className="font-semibold"><Pid>{w.demoId}</Pid> {w.name}</Link>
                  <span className="text-sm text-muted-foreground">{w.submittedAt ? t('Sent {date}', { date: formatDate(w.submittedAt.slice(0, 10), undefined, lang) }) : t('Sent for review')}</span>
                </AttentionItem>
              ))}
            </AttentionList>
          ) : <p className="text-muted-foreground">{t('No assessments waiting. When a patient sends their nutrition assessment, you’ll see it here.')}</p>}
        </Panel>
        <Panel id="due-h" icon={CalendarClock} title="Reviews due in the next 7 days" className="lg:col-span-6">
          {c.due.length ? (
            <AttentionList>
              {c.due.map((d) => (
                <AttentionItem key={d.patientId}>
                  <Link href={healthLink(d.patientId)} className="font-semibold"><Pid>{d.demoId}</Pid> {d.name}</Link>
                  <span className="flex flex-wrap items-center gap-1.5 text-sm">
                    {d.overdue ? <Badge variant="danger"><TriangleAlert aria-hidden />{t('Overdue')}</Badge> : <Badge variant="neutral"><CalendarClock aria-hidden />{t('Due')}</Badge>}
                    {formatLongDate(d.nextReviewOn, lang)}
                  </span>
                </AttentionItem>
              ))}
            </AttentionList>
          ) : <p className="text-muted-foreground">{t('No reviews due in the next 7 days.')}</p>}
        </Panel>
      </div>
    </div>
  );
}

export function DashboardView({ initial, requestedDate, chronic, attention }: { initial: Dashboard; requestedDate: string | null; chronic: Chronic; attention?: Attention }) {
  const key = apiPath('/api/dashboard', { date: requestedDate });
  const { data, error } = useApi<Dashboard>(key, initial);
  const { t: tr, lang } = useT();
  const d = data ?? initial;
  const t = d.today;
  const w = d.week;
  const byPeriod = t.byPeriod.map((p: any) => ({ ...p, label: tr(p.label), confirmedPlus: p.confirmed + p.prepared + p.delivered }));
  const range = `${formatDate(w.from, { month: 'short', day: 'numeric' }, lang)}–${formatDate(w.to, { month: 'short', day: 'numeric' }, lang)}`;
  const days = d.trends.map((x: any) => ({ ...x, label: formatDate(x.date, { weekday: 'long', month: 'short', day: 'numeric' }, lang), short: formatDate(x.date, { weekday: 'short' }, lang) }));
  const [generated, setGenerated] = React.useState<string>('');
  React.useEffect(() => { setGenerated(new Date(d.generatedAt).toLocaleString(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : undefined)); }, [d.generatedAt, lang]);

  return (
    <>
      <PageHead eyebrow={tr('Hospital nutrition team')} title={tr('Nutrition Team Dashboard')} className="max-w-[1320px]">
        <p>{tr('Start with chronic conditions and reviews due, then today’s meals, changes to review, appetite and refusals, and the last 7 days of acceptance and satisfaction ({range}).', { range })}</p>
      </PageHead>
      <PageBody className="max-w-[1320px]">
        {error ? <Notice tone="danger" title={tr('We couldn’t refresh the dashboard.')}>{tr(error.message)} {tr('The figures below may be out of date. Check your connection and try again.')}</Notice> : null}
        <NeedsAttention initial={attention} />
        <Notice tone="info" title={tr('About these figures')} role="note">{tr(d.notice)}</Notice>
        <p className="eyebrow m-0 text-[.8rem]">{tr('Chronic conditions')}</p>
        <ChronicSection c={chronic} />

        <p className="eyebrow m-0 mt-4 border-t border-border pt-6 text-[.8rem]">{tr('Meal service')}</p>
        {requestedDate && requestedDate !== w.to ? <p className="text-sm text-muted-foreground">{tr('Meal workflow for {date}. The 7-day trends always end today.', { date: formatLongDate(d.date, lang) })}</p> : null}

        <KpiRow>
          <KpiTile label="Meal periods confirmed today" value={t.confirmed} of={tr('of {n}', { n: t.mealPeriods })} sub={tr('{delivered} delivered · {fed} patients receiving meals · {npo} NPO', { delivered: t.delivered, fed: t.fed, npo: t.npo })} />
          <KpiTile label="Waiting on the patient or the team" value={t.awaitingChoice + t.awaitingConfirmation} sub={tr('{offered} options offered · {confirm} choices to confirm', { offered: t.awaitingChoice, confirm: t.awaitingConfirmation })} />
          <KpiTile tone="danger" href="/patients?filter=hold" label="Meals on hold or changed" value={d.counts.hold} sub={tr(t.hold === 1 ? 'patients · {n} meal period on hold today' : 'patients · {n} meal periods on hold today', { n: t.hold })} />
          <KpiTile tone="warn" href="/patients?filter=review" label="Patients needing admin review" value={d.counts.review} sub={tr(d.awaitingReview.length === 1 ? '{n} meal period with review-only options' : '{n} meal periods with review-only options', { n: d.awaitingReview.length })} />
          <KpiTile tone="danger" href="/patients?filter=no-options" label="No suitable options" value={d.counts.noOptions} sub="patients" />
          <KpiTile href="/requests" label="Pending patient requests" value={d.requests.open} sub={tr('{n} about allergies or diet', { n: d.requests.clinical })} />
        </KpiRow>

        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <Panel id="sel-h" icon={Calendar} title="Today’s meal selections" className="lg:col-span-7"
            action={<Link href={apiPath('/schedule', { date: requestedDate })} className={buttonVariants({ variant: 'outline', size: 'sm' })}>{tr('Meal schedule')}</Link>}>
            <Figure title="Meal periods by selection status"
              caption={tr('Patients receiving meals, {date}. Meal periods on hold or cancelled are listed in the table.', { date: formatLongDate(d.date, lang) })}
              legend={<Legend series={STATES} />}
              headers={['Meal period', ...STATES.map((s) => s.label), 'On hold', 'Cancelled']}
              rows={byPeriod.map((p: any) => [p.label, p.none, p.offered, p.selected, p.confirmedPlus, p.hold, p.cancelled])}>
              <StackedChart unit="Meal periods" series={STATES} rows={byPeriod.map((p: any) => ({ label: p.label, segments: Object.fromEntries(STATES.map((s) => [s.key, p[s.key]])) }))} />
            </Figure>
          </Panel>

          <Panel id="att-h" icon={TriangleAlert} title="Changes after an order" className="lg:col-span-5">
            {d.changes.length ? (
              <AttentionList>
                {d.changes.map((c: any) => (
                  <AttentionItem key={`${c.entryId}-${c.id}`}>
                    <Link href={`/patients/${c.patientId}?date=${c.date}`} className="font-semibold">{tr(periodLabel(c.period))} {formatDate(c.date, undefined, lang)}: {tr(c.mealName ?? 'offered options')}</Link>
                    <span className="text-sm">{tr(c.causeLabel)}: {tr(c.change)}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {c.entryStatus === 'on-hold' ? <Badge variant="danger"><TriangleAlert aria-hidden />{tr('On hold')}</Badge> : <Badge variant="warn">{tr('Not reviewed')}</Badge>}
                      {c.kitchenAffected ? <Badge variant="outline">{tr(c.kitchenAck ? 'Kitchen acknowledged' : 'Kitchen alerted')}</Badge> : null}
                    </span>
                  </AttentionItem>
                ))}
              </AttentionList>
            ) : <p className="text-muted-foreground">{tr('No changes waiting for review.')}</p>}
            {d.attention.length ? (
              <>
                <h3 className="mt-1 text-base">{tr('Patients needing review')}</h3>
                <AttentionList>
                  {d.attention.map((a: any) => (
                    <AttentionItem key={a.id}>
                      <Link href={`/patients/${a.id}`} className="font-semibold"><Pid>{a.demoId}</Pid> {a.preferredName}</Link>
                      <span className="text-sm text-muted-foreground">{tr('Ward {ward}', { ward: a.ward })} · {tr('Bed {bed}', { bed: a.bed })}</span>
                      <FlagChips flags={a.flags} />
                    </AttentionItem>
                  ))}
                </AttentionList>
              </>
            ) : null}
          </Panel>

          <Panel id="app-h" icon={Activity} title="Low appetite or repeated refusal" className="lg:col-span-5">
            {d.intakeConcerns.length ? (
              <AttentionList>
                {d.intakeConcerns.map((a: any) => (
                  <AttentionItem key={a.id}>
                    <Link href={`/patients/${a.id}?tab=intake`} className="font-semibold"><Pid>{a.demoId}</Pid> {a.preferredName}</Link>
                    <span className="text-sm text-muted-foreground">{tr('Ward {ward}', { ward: a.ward })} · {tr('Bed {bed}', { bed: a.bed })}</span>
                    <span className="flex flex-wrap gap-1.5"><AppetiteChip level={a.appetite} /><FlagChips flags={a.flags} /></span>
                  </AttentionItem>
                ))}
              </AttentionList>
            ) : <p className="text-muted-foreground">{tr('No patients flagged.')}</p>}
            <p className="text-sm text-muted-foreground">{tr('A patient is flagged after 2 or more refusals, or 3 or more meals with none or some eaten, in their last 6 recorded meals. These are prototype thresholds to prompt a review.')}</p>
            <dl className="grid grid-cols-3 gap-2" aria-label={tr('Admitted patients by appetite')}>
              {d.appetite.map((a: any) => (
                <div key={a.id} className="flex flex-col rounded-[14px] border border-border bg-background px-3 py-2">
                  <dd className="order-1 font-display text-xl font-semibold text-heading tabular">{a.count}</dd>
                  <dt className="order-2 text-xs text-muted-foreground">{tr(a.label)}</dt>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel id="acc-h" icon={ThumbsUp} title="Meal acceptance and satisfaction" className="lg:col-span-7"
            action={<span className="text-sm text-muted-foreground">{tr('{n} meals with intake, {range}', { n: w.recorded, range })}</span>}>
            <Accordion className="rounded-[14px] border border-border bg-background/60" headClassName="min-h-11 px-3.5 py-2.5 font-display text-sm font-medium text-heading"
              title={<span className="inline-flex items-center gap-2"><Info className="size-4" aria-hidden />{tr('How meals are counted ({records} records → {meals} meals)', { records: w.records, meals: w.recorded })}</span>}>
              <div className="flex flex-col gap-2 px-3.5 pb-3.5 text-sm">
                <ul className="m-0 list-disc ps-5">{d.outcomeRule.map((x: string) => <li key={x}>{tr(x)}</li>)}</ul>
                <p>{tr('Last 7 days: {both} meals recorded by both the patient and a healthcare provider, {patient} by the patient only, {staff} by a healthcare provider only.', { both: w.both, patient: w.patientOnly, staff: w.staffOnly })} {w.notRecorded ? tr(w.notRecorded === 1 ? '{n} delivered meal has no intake record yet (missing data, not counted).' : '{n} delivered meals have no intake record yet (missing data, not counted).', { n: w.notRecorded }) : tr('Every delivered meal has an intake record.')}</p>
              </div>
            </Accordion>
            <KpiRow>
              <KpiTile label="Meals accepted (7 days)" value={w.acceptanceRate == null ? '—' : pct(w.acceptanceRate)} sub={tr('of {n} meals with intake', { n: w.recorded })} />
              <KpiTile label="Mean satisfaction (1–5)" value={w.satisfaction ?? '—'} of="/ 5" sub={tr('{n} meals rated', { n: w.rated })} />
            </KpiRow>
            <div className="grid gap-5 xl:grid-cols-2">
              <Figure title="Meals accepted (% of meals with intake)" caption="Per day, admitted patients. Each meal counted once. Days without records show a gap."
                headers={['Day', 'Meals recorded', 'Accepted', 'Accepted %']} rows={days.map((x: any) => [x.label, x.recorded, x.accepted, x.acceptanceRate == null ? '—' : `${x.acceptanceRate}%`])}>
                <LineChart unit="Accepted" yMax={100} fmt={pct} points={days.map((x: any) => ({ label: x.label, short: x.short, value: x.acceptanceRate, detail: tr('{accepted} of {recorded} meals', { accepted: x.accepted, recorded: x.recorded }) }))} />
              </Figure>
              <Figure title="Mean satisfaction (scale 1–5)" caption="Per day, meals with a rating (patient’s own rating first)."
                headers={['Day', 'Ratings', 'Mean']} rows={days.map((x: any) => [x.label, x.rated, x.satisfaction ?? '—'])}>
                <LineChart unit="Mean satisfaction" yMax={5} ticks={5} fmt={(v) => (Number.isInteger(v) ? String(v) : v.toFixed(1))} points={days.map((x: any) => ({ label: x.label, short: x.short, value: x.satisfaction, detail: tr('{n} ratings', { n: x.rated }) }))} />
              </Figure>
            </div>
          </Panel>

          <Panel id="rs-h" icon={MessageSquare} title="Why meals weren’t finished" className="lg:col-span-12" action={<span className="text-sm text-muted-foreground">{tr('last 7 days')}</span>}>
            {w.reasons.length ? (
              <Figure title="Times each reason was given" caption="A meal can have more than one reason." headers={['Reason', 'Times given']} rows={w.reasons.map((r: any) => [r.label, r.count])}>
                <HBarChart unit="Times given" fmt={(v) => String(v)} items={[...w.reasons].sort((a: any, b: any) => b.count - a.count).map((r: any) => ({ label: r.label, value: r.count }))} />
              </Figure>
            ) : <p className="text-muted-foreground">{tr('No reasons recorded.')}</p>}
          </Panel>
        </div>
        <p className="text-sm text-muted-foreground">{tr('Updated {when}. Breakfast, lunch, dinner and snack count as separate meal periods.', { when: generated || d.generatedAt.slice(0, 16).replace('T', ' ') })}</p>
      </PageBody>
    </>
  );
}
