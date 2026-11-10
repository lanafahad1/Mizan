'use client';
import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, Check, X, User, TriangleAlert, Calendar, Activity, MessageSquare, List, HeartPulse } from 'lucide-react';
import { useApi, apiPath } from '@/lib/api-client';
import { PageBody, containerClass } from '@/components/site/page-head';
import { cn } from '@/lib/utils';
import { DietNames } from '@/components/cb/diet';
import { AllergyChips, AppetiteChip } from '@/components/cb/status';
import { Pid } from '@/components/cb/misc';
import { Badge } from '@/components/ui/badge';
import { Notice } from '@/components/ui/notice';
import { Tabs, TabsList, TabsTab, TabsPanel } from '@/components/ui/tabs';
import { todayIso } from '@/domain/dates.js';
import { timeAgo } from '@/lib/format';
import { useRevalidate, FreshCache } from './common';
import { TABS, type Tab } from './tabs';
import { Ctx, P, type Dlg, type DlgKind, type Opened, type PatientCtx } from './patient-context';
import { MealsTab } from './meals-tab';
import { OfferDialog, ConfirmDialog, SelectDialog, HoldDialog, ReasonDialog } from './meal-dialogs';
import { ProfileTab, SectionDialog, ReadmitDialog, LinkCodeDialog, UnlinkDialog, DeleteDialog } from './profile-tab';
import { IntakeTab, IntakeDialog } from './intake-tab';
import { RequestsTab, RequestDialog, RespondDialog } from './requests-tab';
import { ChangesTab } from './changes-tab';
import { HealthSpace, type HealthRef } from '@/components/health/health-space';
import { useT } from '@/components/site/lang';

/* eslint-disable @typescript-eslint/no-explicit-any */

const TAB_META: Record<Tab, [string, React.ComponentType<{ 'aria-hidden'?: boolean }>]> = {
  meals: ['Meals', Calendar], health: ['Health & targets', HeartPulse], profile: ['Profile & admission', User], intake: ['Intake & feedback', Activity], requests: ['Requests', MessageSquare], changes: ['Changes & activity', List],
};

type ViewProps = { id: string; initialRecord: any; initialDay: any; reference: any; permissions: string[]; initialTab: Tab; initialHealth: any; healthRef: HealthRef };

/** Patient Nutrition Profile. A page-scoped SWR cache means the server's data is always the starting point. */
export function PatientView(props: ViewProps) {
  return <FreshCache><PatientProfile {...props} /></FreshCache>;
}

function PatientProfile({ id, initialRecord, initialDay, reference, permissions, initialTab, initialHealth, healthRef }: ViewProps) {
  const { t: tr } = useT();
  const [tab, setTab] = React.useState<Tab>(initialTab);
  const [date, setDateState] = React.useState<string>(initialDay.date);
  const recordKey = P(id);
  const { data: recordData, error: recordError } = useApi<any>(recordKey, initialRecord);
  const dayKey = apiPath(P(id, '/day'), { date });
  const { data: dayData, error: dayError } = useApi<any>(dayKey, date === initialDay.date ? initialDay : undefined);
  const record = recordData ?? initialRecord;
  const day = dayData ?? initialDay;
  const dayLoading = day.date !== date;
  const revalidate = useRevalidate();
  const discharged = record.patient.status === 'discharged';

  const syncUrl = React.useCallback((t: Tab, d: string) => {
    window.history.replaceState(null, '', apiPath(`/patients/${id}`, { tab: t === 'meals' ? '' : t, date: d === todayIso() ? '' : d }));
  }, [id]);
  const changeTab = (t: Tab) => { setTab(t); syncUrl(t, date); };
  const setDate = React.useCallback((d: string) => { setDateState(d); syncUrl(tab, d); }, [syncUrl, tab]);

  // "Go to this meal" (from a request): switch to the Meals tab and scroll to the period once its day has loaded.
  const pendingScroll = React.useRef<string | null>(null);
  const goToMeal = React.useCallback((d: string, period: string) => {
    pendingScroll.current = period;
    setTab('meals'); setDateState(d); syncUrl('meals', d);
  }, [syncUrl]);
  React.useEffect(() => {
    if (tab !== 'meals' || dayLoading || !pendingScroll.current) return;
    const el = document.getElementById(`h-${pendingScroll.current}`);
    pendingScroll.current = null;
    if (el) { el.scrollIntoView({ block: 'start' }); el.focus({ preventScroll: true }); }
  }, [tab, dayLoading, day]);

  // ---------------------------------------------------------------- dialogs
  const [dlg, setDlg] = React.useState<Opened | null>(null);
  const dlgRef = React.useRef<Opened | null>(null);
  React.useLayoutEffect(() => { dlgRef.current = dlg; }, [dlg]);
  const last = React.useRef<Partial<Record<DlgKind, Opened>>>({});
  const counter = React.useRef(0);
  const opener = React.useRef<HTMLElement | null>(null);
  const fallback = React.useRef<string | null>(null);
  const open = React.useCallback<PatientCtx['open']>((d: Dlg, focus = {}) => {
    if (!dlgRef.current) {
      opener.current = focus.from ?? (document.activeElement as HTMLElement | null);
      fallback.current = focus.fallback ?? null;
    } else if (focus.fallback) fallback.current = focus.fallback;
    const o = { ...d, n: ++counter.current } as Opened;
    last.current[d.kind] = o;
    dlgRef.current = o;
    setDlg(o);
  }, []);
  const close = React.useCallback(() => { dlgRef.current = null; setDlg(null); }, []);
  const finalFocus = React.useCallback(() => {
    if (dlgRef.current) return false; // another dialog took over (e.g. "Review flagged meal" → "Replace")
    const el = opener.current;
    if (el && el.isConnected) return el;
    const fb = fallback.current ? document.getElementById(fallback.current) : null;
    return fb ?? document.getElementById('patient-title');
  }, []);

  const permSet = React.useMemo(() => new Set(permissions), [permissions]);
  const ctx: PatientCtx = {
    id, record, day, date, reference, discharged, dayLoading,
    can: (p) => permSet.has(p), open, close, refresh: revalidate, setDate, goToMeal,
    goToTab: (t) => { changeTab(t as Tab); requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' })); },
  };
  const openReq = record.requests.filter((r: any) => r.status === 'open').length;

  return (
    <Ctx.Provider value={ctx}>
      <PatientBanner record={record} discharged={discharged} />
      <PageBody space="staff">
        {recordError ? <Notice tone="danger" title={tr('We couldn’t refresh this patient.')}>{tr(recordError.message)} {tr('The information below may be out of date.')}</Notice> : null}
        <Tabs value={tab} onValueChange={(v) => changeTab(v as Tab)}>
          <TabsList aria-label={tr('Patient sections')}>
            {TABS.map((t) => {
              const [labelText, Icon] = TAB_META[t];
              return (
                <TabsTab key={t} value={t} id={`tab-${t}`}>
                  <Icon aria-hidden />{tr(labelText)}
                  {t === 'requests' && openReq ? <span className="ms-0.5 rounded-full bg-rose px-1.5 text-xs font-bold text-rose-ink" aria-label={tr('{n} pending', { n: openReq })}>{openReq}</span> : null}
                </TabsTab>
              );
            })}
          </TabsList>
          <div className="pt-5">
            <TabsPanel value="meals">{dayError && !dayData ? <Notice tone="danger" title={tr('We couldn’t load the meals for this day.')}>{tr(dayError.message)} {tr('Choose another day or try again.')}</Notice> : <MealsTab />}</TabsPanel>
            <TabsPanel value="health"><HealthSpace who={id} initial={initialHealth} reference={healthRef} canReview={permissions.includes('assessment:review')} assessmentHref="" /></TabsPanel>
            <TabsPanel value="profile"><ProfileTab /></TabsPanel>
            <TabsPanel value="intake"><IntakeTab /></TabsPanel>
            <TabsPanel value="requests"><RequestsTab /></TabsPanel>
            <TabsPanel value="changes"><ChangesTab /></TabsPanel>
          </div>
        </Tabs>
      </PageBody>
      <DialogHost dlg={dlg} last={last.current} finalFocus={finalFocus} />
    </Ctx.Provider>
  );
}

function PatientBanner({ record, discharged }: { record: any; discharged: boolean }) {
  const { t, lang } = useT();
  const p = record.patient;
  const b = p.brief;
  const team = p.reviewReasons.filter((r: any) => r.code !== 'discharged');
  return (
    <div className={cn(containerClass({ space: 'staff' }), 'flex flex-col gap-4 pb-4 pt-6 sm:pt-10')}>
      <Link href={discharged ? '/patients?include=discharged' : '/patients'} className="inline-flex w-fit items-center gap-1 text-sm"><ChevronLeft className="size-4 rtl:rotate-180" aria-hidden /> {t('Patient Overview')}</Link>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 flex-col gap-2.5">
          <span className="eyebrow">{t('Patient nutrition profile')} · {t(b.wardLabel)} · {t('Bed {bed}', { bed: b.bed })}</span>
          <h1 id="patient-title" tabIndex={-1} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[2rem] leading-tight outline-none sm:text-[2.4rem]">
            <span>{b.preferredName || b.demoId}</span> <span className="text-base"><Pid>{b.demoId}</Pid></span>
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {discharged ? <Badge variant="outline"><X aria-hidden />{t('Discharged {date}', { date: p.dischargedOn ?? '' })}</Badge> : <Badge variant="ok"><Check aria-hidden />{t('Admitted {date}', { date: p.admittedOn ?? '' })}</Badge>}
            <DietNames codes={b.dietCodes} labels={b.dietLabels} />
            <AllergyChips b={b} />
            <AppetiteChip level={b.appetite} />
            {b.textureLevel ? <Badge variant="warn" className="whitespace-normal">{t(b.textureLevel)}</Badge> : null}
          </div>
        </div>
        <div className="flex flex-col gap-0.5 text-sm text-muted-foreground md:shrink-0 md:text-end">
          <span suppressHydrationWarning>{p.updatedBy ? t('Updated {when} by {name}', { when: timeAgo(p.updatedAt, Date.now(), lang), name: p.updatedBy }) : t('Updated {when}', { when: timeAgo(p.updatedAt, Date.now(), lang) })}</span>
          <span className="inline-flex items-center gap-1 md:justify-end">{p.linkedAccounts.length ? <><User className="size-4" aria-hidden /> {t('Patient account @{username}', { username: p.linkedAccounts[0].username })}</> : t('No patient account linked')}</span>
        </div>
      </div>
      {discharged ? (
        <Notice tone="info" title={t('Discharged: read-only')}>{t('No meals are planned or sent to the kitchen. Past meals, intake and requests are kept. Use “Readmit” under Profile & admission if the patient is back on a ward.')}</Notice>
      ) : null}
      {team.length || record.intakeFlags.length ? (
        <Notice tone="warn" role="note" title={t('For the nutrition team')} icon={<TriangleAlert aria-hidden />}>
          <ul className="list-disc ps-5">
            {team.map((r: any, i: number) => <li key={`r${i}`}>{t(r.text)}</li>)}
            {record.intakeFlags.map((f: any, i: number) => <li key={`f${i}`}><b>{t(f.title)}:</b> {t(f.text)} {t('Consider a professional review.')}</li>)}
          </ul>
        </Notice>
      ) : null}
    </div>
  );
}

/** Renders each dialog kind; a closing dialog keeps its last content until its close transition ends. */
function DialogHost({ dlg, last, finalFocus }: { dlg: Opened | null; last: Partial<Record<DlgKind, Opened>>; finalFocus: () => HTMLElement | boolean | null }) {
  const get = <K extends DlgKind>(k: K) => (dlg?.kind === k ? dlg : last[k]) as Opened<K> | undefined;
  const isOpen = (k: DlgKind) => dlg?.kind === k;
  const mount = <K extends DlgKind>(k: K, C: React.ComponentType<{ a: Opened<K>; open: boolean; finalFocus: typeof finalFocus }>) => {
    const a = get(k);
    return a ? <C key={`${k}-${a.n}`} a={a} open={isOpen(k)} finalFocus={finalFocus} /> : null;
  };
  return (
    <>
      {mount('offer', OfferDialog)}
      {mount('confirm', ConfirmDialog)}
      {mount('select', SelectDialog)}
      {mount('hold', HoldDialog)}
      {mount('reason', ReasonDialog)}
      {mount('intake', IntakeDialog)}
      {mount('request', RequestDialog)}
      {mount('respond', RespondDialog)}
      {mount('section', SectionDialog)}
      {mount('readmit', ReadmitDialog)}
      {mount('linkcode', LinkCodeDialog)}
      {mount('unlink', UnlinkDialog)}
      {mount('delete', DeleteDialog)}
    </>
  );
}

