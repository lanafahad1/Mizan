'use client';
import * as React from 'react';
import Link from 'next/link';
import { List, TriangleAlert, Info } from 'lucide-react';
import { useApi, apiPath } from '@/lib/api-client';
import { PageHead, PageBody } from '@/components/site/page-head';
import { DateNav } from '@/components/cb/date-nav';
import { EntryChip } from '@/components/cb/status';
import { DietCodes } from '@/components/cb/diet';
import { Pid, Stat, EmptyState } from '@/components/cb/misc';
import { portionLabel } from '@/components/cb/labels';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { NativeSelect, Label } from '@/components/ui/input';
import { Table, Th, Td } from '@/components/ui/table';
import { Notice } from '@/components/ui/notice';
import { WARDS, PERIODS } from '@/domain/constants.js';
import { useT } from '@/components/site/lang';
import { formatDate } from '@/lib/format';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Schedule = any;

export function ScheduleView({ initial, initialWard }: { initial: Schedule; initialWard: string }) {
  const { t, lang } = useT();
  const [date, setDate] = React.useState<string>(initial.date);
  const [ward, setWard] = React.useState(initialWard);
  const key = apiPath('/api/schedule', { date, ward });
  // The first key matches the server data, so SWR starts from it without a request.
  const { data, error, isLoading } = useApi<Schedule>(key, key === apiPath('/api/schedule', { date: initial.date, ward: initialWard }) ? initial : undefined);

  const update = (next: { date?: string; ward?: string }) => {
    const d = next.date ?? date; const w = next.ward ?? ward;
    setDate(d); setWard(w);
    window.history.replaceState(null, '', apiPath('/schedule', { date: d, ward: w }));
  };
  const s = data ?? initial;
  const c = s.counts;

  return (
    <>
      <PageHead space="staff" eyebrow={t('Meal schedule')} title={t('Meals by patient and meal period')}>
        <p>{t('See every admitted patient’s meals for one day. Confirmed meals go to the kitchen; offered, chosen and held meals are shown so you can follow up. Discharged patients aren’t listed.')}</p>
      </PageHead>
      <PageBody space="staff">
        <div className="flex flex-col gap-4 rounded-[20px] border border-border bg-card p-4 md:flex-row md:flex-wrap md:items-end">
          <div className="flex flex-col gap-1.5"><span className="font-display text-sm font-medium text-heading">{t('Date')}</span><DateNav date={date} onChange={(d) => update({ date: d })} id="sc-date" /></div>
          <div className="flex flex-col gap-1.5 md:w-60">
            <Label htmlFor="sc-ward">{t('Ward')}</Label>
            <NativeSelect id="sc-ward" value={ward} onChange={(e) => update({ ward: e.target.value })}>
              <option value="">{t('All wards')}</option>
              {WARDS.map((w: { id: string; label: string }) => <option key={w.id} value={w.id}>{t(w.label)}</option>)}
            </NativeSelect>
          </div>
          <Link href={apiPath('/kitchen', { date })} className={buttonVariants({ variant: 'outline', size: 'sm' })}><List aria-hidden />{t('Kitchen summary')}</Link>
        </div>
        {error ? <Notice tone="danger" title={t('We couldn’t load the schedule.')}>{t(error.message)} {t('Check your connection and try again.')}</Notice> : null}
        <div aria-busy={isLoading} className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          <Stat value={c.offered} label="Options offered" /><Stat value={c.selected} label="Choice submitted" /><Stat value={c.confirmed} label="Confirmed" /><Stat value={c.prepared} label="Prepared" />
          <Stat value={c.delivered} label="Delivered" /><Stat value={c['on-hold']} label="On hold" tone={c['on-hold'] ? 'danger' : 'default'} /><Stat value={c.none} label="Not scheduled" /><Stat value={c.npo} label="Nothing by mouth" />
        </div>
        {s.rows.length ? (
          <Table caption={t('Meal schedule for {weekday} {date}', { weekday: lang === 'ar' ? formatDate(s.date, { weekday: 'long' }, lang) : s.weekday, date: s.date })}>
            <thead><tr><Th scope="col">{t('Patient')}</Th><Th scope="col">{t('Diet')}</Th>{PERIODS.map((p: { id: string; label: string }) => <Th key={p.id} scope="col">{t(p.label)}</Th>)}</tr></thead>
            <tbody>
              {s.rows.map((r: any) => (
                <tr key={r.id}>
                  <Td><div className="flex min-w-36 flex-col gap-1"><span><Pid>{r.demoId}</Pid> <Link href={`/patients/${r.id}?date=${s.date}`}>{r.preferredName}</Link></span><span className="text-xs text-muted-foreground">{t('Ward {ward}', { ward: r.ward })} · {t('Bed {bed}', { bed: r.bed })}</span>{r.allergyAlert ? <Badge variant="danger" className="w-fit"><TriangleAlert aria-hidden />{t('Allergy alert')}</Badge> : null}</div></Td>
                  <Td><DietCodes codes={r.dietCodes} labels={r.dietLabels} /></Td>
                  {r.periods.map((p: any) => (
                    <Td key={p.period}>
                      <div className="flex min-w-32 flex-col gap-1">
                        <EntryChip status={p.status} short />
                        {p.meal ? <span className="text-xs"><b>{t(p.meal)}</b><br />{t(portionLabel(p.portion))}{p.replaced ? ` · ${t('replacement')}` : ''}</span> : p.options ? <span className="text-xs text-muted-foreground">{t(p.options > 1 ? '{n} options' : '{n} option', { n: p.options })}</span> : null}
                      </div>
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <EmptyState title="No admitted patients for this ward">{t('Choose another ward, or check the Patients page.')}</EmptyState>}
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Info className="size-4" aria-hidden /> {t('Tap or press Enter on a diet code to see what it means.')}</p>
      </PageBody>
    </>
  );
}
