'use client';
import * as React from 'react';
import Link from 'next/link';
import { Plus, ChevronRight, X, TriangleAlert, Info } from 'lucide-react';
import { useApi, apiPath } from '@/lib/api-client';
import { PageHead, PageBody } from '@/components/site/page-head';
import { DateNav } from '@/components/cb/date-nav';
import { DietNames } from '@/components/cb/diet';
import { AllergyChips, AppetiteChip, FlagChips, PeriodStrip } from '@/components/cb/status';
import { PatientHeader, EmptyState } from '@/components/cb/misc';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input, NativeSelect, Label } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { WARDS, PERIODS } from '@/domain/constants.js';
import { useT } from '@/components/site/lang';
import { todayIso, addDays } from '@/domain/dates.js';
import { cn } from '@/lib/utils';
import { CellLabel, FreshCache } from './common';
import { FILTERS } from './filters';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Overview = any;
type Row = any;

// One filtering system: a single "Show" control (with counts), plus admission status, date, ward and search.
const match = (row: Row, f: string) => {
  const codes: string[] = row.flags.map((x: { code: string }) => x.code);
  if (f === 'all') return true;
  if (f === 'attention') return codes.some((c) => ['hold', 'changes', 'review', 'no-options', 'refusal', 'low-intake'].includes(c));
  if (f === 'hold') return codes.includes('hold') || codes.includes('changes');
  if (f === 'intake') return codes.includes('refusal') || codes.includes('low-intake');
  return codes.includes(f);
};

type Query = { date: string; ward: string; include: 'admitted' | 'discharged'; filter: string; q: string };

type ViewProps = { initial: Overview; initialQuery: Query; canCreate: boolean };

/** Patient Overview. A page-scoped SWR cache means the server's data is always the starting point. */
export function PatientsView(props: ViewProps) {
  return <FreshCache><OverviewList {...props} /></FreshCache>;
}

function OverviewList({ initial, initialQuery, canCreate }: ViewProps) {
  const { t, lang } = useT();
  const [query, setQueryState] = React.useState<Query>(initialQuery);
  const { date, ward, include, filter, q } = query;
  const key = apiPath('/api/patients', { date, include, ward });
  const initialKey = apiPath('/api/patients', { date: initialQuery.date, include: initialQuery.include, ward: initialQuery.ward });
  const { data, error, isValidating } = useApi<Overview>(key, key === initialKey ? initial : undefined);
  const d = data ?? initial;
  const loadingOther = isValidating && (d.date !== date || d.include !== include);

  const setQuery = (next: Partial<Query>) => {
    const merged = { ...query, ...next };
    setQueryState(merged);
    window.history.replaceState(null, '', apiPath('/patients', {
      date: merged.date === todayIso() ? '' : merged.date, ward: merged.ward, include: merged.include === 'admitted' ? '' : merged.include,
      filter: merged.filter === 'all' ? '' : merged.filter, q: merged.q,
    }));
  };

  const term = q.trim().toLowerCase();
  const rows: Row[] = d.patients.filter((r: Row) => match(r, filter) && (!term || `${r.demoId} ${r.preferredName} ${r.bed} ${r.wardLabel}`.toLowerCase().includes(term)));
  const c = d.counts;
  const today = todayIso();

  return (
    <>
      <PageHead eyebrow={t('Hospital nutrition team')} title={t('Patient Overview')} space="staff"
        actions={canCreate ? <Link href="/patients/new" className={buttonVariants({ className: 'w-full sm:w-auto' })}><Plus aria-hidden />{t('New patient profile')}</Link> : null}>
        <p>{t('Prescribed diets, recorded allergies, appetite and meal status at a glance. Patients with meals on hold, needing review or with no suitable option come first.')}</p>
      </PageHead>
      <PageBody space="staff">
        <div className="grid gap-4 rounded-[20px] border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_minmax(10rem,.8fr)_auto_minmax(11rem,.9fr)_minmax(12rem,1fr)] lg:items-end">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pt-show">{t('Show')}</Label>
            <NativeSelect id="pt-show" value={filter} onChange={(e) => setQuery({ filter: e.target.value })}>
              {FILTERS.map(([f, l, k]) => <option key={f} value={f}>{t(l)} ({c[k] ?? 0})</option>)}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pt-adm">{t('Admission status')}</Label>
            <NativeSelect id="pt-adm" value={include} onChange={(e) => setQuery({ include: e.target.value as Query['include'], filter: 'all' })}>
              <option value="admitted">{t('Admitted ({n})', { n: d.admitted })}</option>
              <option value="discharged">{t('Discharged ({n})', { n: d.discharged })}</option>
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
            <span className="font-display text-sm font-medium text-heading">{t('Date')}</span>
            <DateNav date={date} onChange={(x) => setQuery({ date: x })} min={addDays(today, -13)} max={addDays(today, 6)} id="pt-date" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pt-ward">{t('Ward')}</Label>
            <NativeSelect id="pt-ward" value={ward} onChange={(e) => setQuery({ ward: e.target.value })}>
              <option value="">{t('All wards')}</option>
              {WARDS.map((w: { id: string; label: string }) => <option key={w.id} value={w.id}>{t(w.label)}</option>)}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pt-q">{t('Find a patient')}</Label>
            <Input id="pt-q" type="search" placeholder={t('CB-1001, name or bed')} value={q} onChange={(e) => setQuery({ q: e.target.value })} autoComplete="off" />
          </div>
        </div>

        {error ? <Notice tone="danger" title={t('We couldn’t load the patient list.')}>{t(error.message)} {t('Check your connection and try again.')}</Notice> : null}

        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p aria-live="polite">{loadingOther ? t('Loading patients…') : t(rows.length === 1 ? '{n} patient shown' : '{n} patients shown', { n: rows.length })}</p>
          <p>{t('Meal periods: {list}. Each shows its status in words; tap a diet code to see what it means.', { list: PERIODS.map((p: { label: string }) => { const l = t(p.label); return `${l.slice(0, 1)} ${lang === 'ar' ? l : l.toLowerCase()}`; }).join(lang === 'ar' ? '، ' : ', ') })}</p>
        </div>

        <div aria-busy={loadingOther} className={cn('transition-opacity', loadingOther && 'opacity-60')}>
          {rows.length ? (
            <ul aria-label={t('Patients')} className="flex flex-col gap-2.5">
              {rows.map((r: Row) => <PatientRow key={r.id} r={r} date={d.date} isToday={d.date === today} />)}
            </ul>
          ) : (
            <EmptyState title="No patients match" action={<Button variant="outline" onClick={() => setQuery({ filter: 'all', q: '', ward: '' })}>{t('Clear filters')}</Button>}>
              <p>{q ? `${t('Nobody matches “{q}”.', { q })} ` : ''}{t(include === 'admitted' ? 'Try “All”, another ward, or the discharged list.' : 'Try “All”, another ward, or the admitted list.')}</p>
            </EmptyState>
          )}
        </div>

        <p className="flex items-start gap-1.5 text-sm text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" aria-hidden /> {t('Flags are prompts for the nutrition team. They come from the patient record, today’s menu screening, changes after an order and recorded intake, and never change a diet order automatically.')}</p>
      </PageBody>
    </>
  );
}

function PatientRow({ r, date, isToday }: { r: Row; date: string; isToday: boolean }) {
  const { t, lang } = useT();
  const flagged = r.flags.some((f: { code: string }) => ['review', 'no-options', 'hold'].includes(f.code));
  return (
    <li className={cn(
      'grid grid-cols-2 gap-x-4 gap-y-3 rounded-[18px] border border-border bg-card p-4 [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&>div]:gap-1',
      'md:grid-cols-3 xl:grid-cols-[minmax(150px,1fr)_minmax(180px,1.3fr)_minmax(150px,1.1fr)_auto_auto_minmax(150px,1.1fr)_auto] xl:items-center',
      flagged && 'border-s-[5px] border-s-destructive',
    )}>
      <div className="col-span-2 md:col-span-1">
        <PatientHeader b={r} link={false} />
        {r.status === 'discharged' ? <Badge variant="outline" className="w-fit"><X aria-hidden />{t('Discharged {date}', { date: r.dischargedOn ?? '' })}</Badge> : null}
      </div>
      <div>
        <CellLabel>{t('Diet')}</CellLabel>
        <DietNames codes={r.dietCodes} labels={r.dietLabels} />
        {r.textureLevel ? <span className="text-sm text-muted-foreground">{t(r.textureLevel)}</span> : null}
      </div>
      <div>
        <CellLabel>{t('Allergies')}</CellLabel>
        <AllergyChips b={r} />
        {r.reportedAllergies?.length ? <Badge variant="warn" className="w-fit whitespace-normal"><TriangleAlert aria-hidden />{t('Reported: {list} (pending)', { list: r.reportedAllergies.map((x: string) => t(x)).join(lang === 'ar' ? '، ' : ', ') })}</Badge> : null}
      </div>
      <div>
        <CellLabel>{t('Appetite')}</CellLabel>
        <span><AppetiteChip level={r.appetite} /></span>
      </div>
      <div>
        <CellLabel>{t(isToday ? 'Today' : 'Meals')}</CellLabel>
        <PeriodStrip periods={r.periods} />
      </div>
      <div className="col-span-2 md:col-span-1">
        <CellLabel>{t('Flags')}</CellLabel>
        {r.flags.length ? <FlagChips flags={r.flags} /> : <span className="text-sm text-muted-foreground">{t('No flags')}</span>}
      </div>
      <div className="col-span-2 md:col-span-3 md:items-end xl:col-span-1">
        <Link href={apiPath(`/patients/${r.id}`, { date })} aria-label={t('Open {id}', { id: `${r.demoId}${r.preferredName ? ` (${r.preferredName})` : ''}` })}
          className={buttonVariants({ variant: 'outline', className: 'w-full md:w-auto' })}>
          {t('Open')}<ChevronRight aria-hidden className="rtl:rotate-180" />
        </Link>
      </div>
    </li>
  );
}
