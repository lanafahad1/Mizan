'use client';
import * as React from 'react';
import Link from 'next/link';
import { List, Check, User, Clock, Layers, RefreshCw, X, TriangleAlert, Activity, ShieldCheck, ShieldX, MessageSquare, Sparkles, OctagonAlert } from 'lucide-react';
import { apiSend, apiPath } from '@/lib/api-client';
import { DateNav } from '@/components/cb/date-nav';
import { EntryChip, Stepper } from '@/components/cb/status';
import { MealRow, MealType } from '@/components/cb/meal';
import { Accordion } from '@/components/ui/accordion';
import { Fold } from '@/components/patient/fold';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { amountLabel, portionLabel, roleLabel } from '@/components/cb/labels';
import { todayIso, addDays } from '@/domain/dates.js';
import { formatDate } from '@/lib/format';
import { useT } from '@/components/site/lang';
import { makeT, type T } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { When, errorText } from './common';
import { usePatient, P, type PatientCtx } from './patient-context';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Per = any;

export function MealsTab() {
  const { t, lang } = useT();
  const c = usePatient();
  const { day, date, discharged, record, dayLoading } = c;
  const today = todayIso();
  const [auto, setAuto] = React.useState(false);
  const runAuto = async () => {
    setAuto(true);
    try {
      const r = await apiSend<{ created: unknown[]; flagged: unknown[] }>('POST', P(c.id, '/auto-schedule'), { from: date, days: 3 });
      await c.refresh();
      toast(`${t(r.created.length === 1 ? '{n} meal period offered with the top eligible options.' : '{n} meal periods offered with the top eligible options.', { n: r.created.length })}${r.flagged.length ? ` ${t(r.flagged.length === 1 ? '{n} period flagged for the team (review or no suitable option).' : '{n} periods flagged for the team (review or no suitable option).', { n: r.flagged.length })}` : ''}`, { timeout: 8000 });
    } catch (err) { toast(errorText(err, t), { tone: 'error' }); } finally { setAuto(false); }
  };
  // Period chips are real #period-… links; the section (scroll-mt) lands below the sticky header and focus moves to its heading.
  const jump = (e: React.MouseEvent, period: string) => {
    const section = document.getElementById(`period-${period}`);
    if (!section) return;
    e.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    document.getElementById(`h-${period}`)?.focus({ preventScroll: true });
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#period-${period}`);
  };
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[20px] border border-border bg-card p-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="font-display text-sm font-medium text-heading">{t('Meal day')}</span>
          <DateNav date={date} onChange={c.setDate} min={addDays(today, -13)} max={addDays(today, 6)} id="pd-date" label="Meal day" />
        </div>
        <div className="flex flex-col gap-0.5 text-sm" aria-live="polite">
          {dayLoading ? <b className="text-heading">{t('Loading meals…')}</b> : <b className="text-heading">{t('{weekday} menu (cycle day {n})', { weekday: lang === 'ar' ? formatDate(day.date, { weekday: 'long' }, lang) : day.weekday, n: day.cycleDay })}</b>}
          <span className="text-muted-foreground">{t(discharged ? 'Discharged: read-only.' : day.editable ? 'You can offer and confirm options for today and the next 6 days.' : 'Past days are read-only.')}</span>
        </div>
        {day.editable && !record.patient.dietOrder.npo && c.can('meal:plan') ? (
          <Button variant="outline" size="sm" onClick={runAuto} disabled={auto || dayLoading} className="w-full sm:w-auto"><Sparkles aria-hidden />{t(auto ? 'Offering options…' : 'Offer top options for empty periods (3 days)')}</Button>
        ) : null}
      </div>
      <nav aria-label={t('Meal periods')} className="flex flex-wrap gap-2">
        {day.periods.map((per: Per) => (
          <a key={per.period} href={`#period-${per.period}`} onClick={(e) => jump(e, per.period)}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-bold text-foreground no-underline hover:bg-mint">
            {t(per.label)} <EntryChip status={per.npo && !per.entry ? 'npo' : per.entry?.status ?? 'none'} short />
          </a>
        ))}
      </nav>
      <div aria-busy={dayLoading} className={cn('flex flex-col gap-5 transition-opacity', dayLoading && 'opacity-60')}>
        {day.periods.map((per: Per) => <PeriodCard key={per.period} per={per} />)}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ actions per stage
function stageActions(per: Per, c: PatientCtx, t: T) {
  const { day, date, discharged } = c;
  const e = per.entry;
  const s: string = e?.status ?? 'none';
  const editable = day.editable && !per.npo;
  const fb = { fallback: `h-${per.period}` };
  const openFrom = (d: Parameters<PatientCtx['open']>[0]) => (ev: React.MouseEvent<HTMLElement>) => c.open(d, { from: ev.currentTarget, ...fb });
  const sec = (key: string, text: string, Icon: React.ComponentType<{ 'aria-hidden'?: boolean }>, onClick: (ev: React.MouseEvent<HTMLElement>) => void) => (
    <Button key={key} variant="outline" size="sm" onClick={onClick}><Icon aria-hidden />{t(text)}</Button>
  );
  const intakeTarget = () => ({ date, period: per.period, mealName: e.mealName, portion: e.portion, deliveredAt: e.deliveredAt, existing: per.outcome?.staffRecord ?? null, hasPatientRecord: Boolean(per.outcome?.patientRecord) });
  const intakeBtn = () => (c.can('intake:record') ? (
    <Button className="w-full sm:w-auto" onClick={openFrom({ kind: 'intake', target: intakeTarget() })}><Activity aria-hidden />{t(per.outcome?.staffRecord ? 'Update staff intake record' : 'Record intake')}</Button>
  ) : null);
  const waiting = (Icon: React.ComponentType<{ 'aria-hidden'?: boolean; className?: string }>, text: string) => <span className="inline-flex items-center gap-1.5 font-display font-semibold text-heading"><Icon className="size-4" aria-hidden />{t(text)}</span>;

  if (!editable) {
    if (s === 'delivered' && !discharged && date >= addDays(todayIso(), -13)) return { primary: intakeBtn(), secondary: [] as React.ReactNode[] };
    return { primary: null, secondary: [] as React.ReactNode[] };
  }
  const secondary: React.ReactNode[] = [];
  let primary: React.ReactNode = null;
  const canOffer = c.can('meal:offer');
  const canConfirm = c.can('meal:confirm');
  const canCancel = c.can('meal:cancel');
  const confirmSec = (text: string, Icon = Check) => (canConfirm ? secondary.push(sec('confirm', text, Icon, openFrom({ kind: 'confirm', period: per.period }))) : null);
  const offerSec = () => (canOffer ? secondary.push(sec('offer', 'Change options', List, openFrom({ kind: 'offer', period: per.period }))) : null);
  const cancelSec = () => (canCancel ? secondary.push(sec('cancel', 'Cancel this meal', X, openFrom(cancelDialog(c, per.period, t)))) : null);

  if (s === 'none' || s === 'cancelled') {
    if (!per.screening?.noSuitable) {
      if (canOffer) primary = <Button className="w-full sm:w-auto" onClick={openFrom({ kind: 'offer', period: per.period })}><List aria-hidden />{t('Offer options to the patient')}</Button>;
      confirmSec('Confirm one meal directly');
    }
  } else if (s === 'offered') {
    const canChoose = c.can('meal:choose');
    if (day.linkedAccount) {
      primary = waiting(Clock, 'Waiting for the patient to choose on their screen');
      if (canChoose) secondary.push(sec('select', 'Record the patient’s choice', User, openFrom({ kind: 'select', period: per.period })));
    } else if (canChoose) {
      primary = <Button className="w-full sm:w-auto" onClick={openFrom({ kind: 'select', period: per.period })}><User aria-hidden />{t('Record the patient’s choice')}</Button>;
    }
    confirmSec('Confirm a meal directly'); offerSec(); cancelSec();
  } else if (s === 'selected') {
    if (canConfirm) primary = <Button className="w-full sm:w-auto" onClick={openFrom({ kind: 'confirm', period: per.period, mealId: e.selectedMealId })}><Check aria-hidden />{t('Confirm {meal}', { meal: t(e.mealName) })}</Button>;
    confirmSec('Confirm a different meal', RefreshCw); offerSec(); cancelSec();
  } else if (s === 'on-hold') {
    if (c.can('meal:resolve-hold')) primary = <Button variant="destructive-solid" className="w-full sm:w-auto" onClick={openFrom({ kind: 'hold', period: per.period })}><TriangleAlert aria-hidden />{t('Review flagged meal')}</Button>;
  } else if (s === 'confirmed' || s === 'prepared') {
    primary = waiting(s === 'confirmed' ? List : Layers, s === 'confirmed' ? 'Sent to the kitchen' : 'Prepared by the kitchen; waiting for delivery');
    if (canConfirm) secondary.push(sec('replace', 'Replace meal', RefreshCw, openFrom({ kind: 'confirm', period: per.period, replace: true })));
    cancelSec();
  } else if (s === 'delivered') {
    primary = intakeBtn();
  }
  if (e?.openChanges?.length && s !== 'on-hold' && c.can('meal:resolve-hold')) {
    secondary.unshift(sec('reviewed', 'Mark changes as reviewed', Check, openFrom({
      kind: 'reason', title: t('Mark changes as reviewed'), intro: t('Confirm you have reviewed the withdrawn options. The current order is unaffected.'), label: t('Note (optional)'), button: t('Mark as reviewed'),
      onSubmit: async (note) => { await apiSend('POST', P(c.id, '/review'), { date, period: per.period, action: 'mark-reviewed', note }); toast(t('Marked as reviewed.')); },
    })));
  }
  return { primary, secondary };
}

export function cancelDialog(c: PatientCtx, period: string, t: T = makeT('en')) {
  const label = c.day.periods.find((x: Per) => x.period === period)?.label ?? period;
  const tl = t(label);
  return {
    kind: 'reason' as const, title: tl === label ? `Cancel ${label.toLowerCase()}?` : t('Cancel {period}?', { period: tl }),
    intro: t('No meal will be prepared for this period. The order and its history are kept, and the kitchen is alerted if the tray was already on its list.'),
    label: t('Reason (kept in the meal history)'), button: t('Cancel this meal'), danger: true,
    onSubmit: async (note: string) => { await apiSend('POST', P(c.id, '/cancel'), { date: c.date, period, reason: note }); toast(t('Meal cancelled.')); },
  };
}

// ------------------------------------------------------------------ blocks
export function ChangesBlock({ per }: { per: Per }) {
  const { t } = useT();
  const open = per.entry?.openChanges ?? [];
  if (!open.length) return null;
  const hold = per.entry.status === 'on-hold';
  return (
    <Notice tone={hold ? 'danger' : 'warn'} role="alert" icon={hold ? <OctagonAlert aria-hidden /> : <RefreshCw aria-hidden />}
      title={t(hold ? 'On hold: this meal cannot be confirmed, prepared or delivered until reviewed' : 'Changes to review')}>
      <ul className="flex flex-col gap-1.5">
        {open.map((ch: any) => (
          <li key={ch.id}>
            <b>{t(ch.causeLabel)}:</b> {t(ch.change)}
            {ch.details?.length ? <ul className="list-disc ps-5 text-sm">{ch.details.map((x: string, i: number) => <li key={i}>{t(x)}</li>)}</ul> : null}
            <span className="block text-sm opacity-80"><When iso={ch.at} />{ch.kitchenAffected ? ` · ${t('kitchen alerted')}` : ''}</span>
          </li>
        ))}
      </ul>
    </Notice>
  );
}

function OrderBlock({ per }: { per: Per }) {
  const { t } = useT();
  const { id, date } = usePatient();
  const e = per.entry;
  if (!e) return null;
  const m = e.selectedMeal;
  const href = (mealId: string) => apiPath(`/meal/${mealId}`, { patient: id, date, period: per.period });
  const lines: React.ReactNode[] = [];
  if (e.selectedBy) lines.push(<>{t('Chosen by {name} ({role})', { name: e.selectedBy, role: t(roleLabel(e.selectedByRole)) })}</>);
  if (e.confirmedBy) lines.push(<>{t(e.confirmMode === 'direct' ? 'Confirmed directly (no patient choice recorded) by {name} ({role})' : 'Confirmed by {name} ({role})', { name: e.confirmedBy, role: t(roleLabel(e.confirmedByRole)) })} <When iso={e.confirmedAt} /></>);
  if (e.preparedBy) lines.push(<>{t('Prepared by {name}', { name: e.preparedBy })} <When iso={e.preparedAt} /></>);
  if (e.deliveredBy) lines.push(<>{t('Delivered by {name}', { name: e.deliveredBy })} <When iso={e.deliveredAt} /></>);
  const settled = ['confirmed', 'prepared', 'delivered'].includes(e.status);
  return (
    <>
      {e.selectedMealId ? (
        <div className={cn('flex flex-col gap-1 rounded-[14px] border px-4 py-3', settled ? 'border-success-border bg-success-soft/60' : e.status === 'on-hold' ? 'border-destructive-border bg-destructive-soft/50' : 'border-border bg-blush/50')}>
          <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{e.status === 'on-hold' ? t('On hold (was {status})', { status: t(e.holdFrom) }) : t(e.status === 'selected' ? 'Patient choice, waiting for confirmation' : 'Current order')}</span>
          <b className="font-display text-heading"><Link href={href(e.selectedMealId)}>{t(e.mealName)}</Link></b>
          <span className="flex flex-wrap items-center gap-x-2 text-sm">{m ? <MealType m={m} /> : null}<span>· {t('{portion} portion', { portion: t(portionLabel(e.portion)) })}</span></span>
          {lines.map((l, i) => <span key={i} className="text-sm text-muted-foreground">{l}</span>)}
          {e.replaces ? <span className="text-sm"><b>{t(e.replaces.outcome === 'cancelled' ? 'Cancelled earlier order' : 'Replaces')}:</b> {t(e.replaces.mealName)} ({t('{portion}, was {status}', { portion: t(e.replaces.portion), status: t(e.replaces.status) })}). {t('The kitchen was alerted.')}</span> : null}
        </div>
      ) : null}
      {e.status === 'cancelled' ? <p className="text-sm"><b>{t('Cancelled:')}</b> {e.cancelledReason}</p> : null}
      {e.offers.length && ['offered', 'selected', 'on-hold'].includes(e.status) ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{t('Approved options offered ({n})', { n: e.offers.length })}</span>
          <ul className="flex flex-col gap-1">
            {e.offers.map((o: any) => (
              <li key={o.mealId} className="text-sm">
                <Link href={href(o.mealId)}>{t(o.mealName ?? o.meal?.name ?? o.mealId)}</Link>{' '}
                <span className="text-muted-foreground">{o.portions.map((x: string) => t(portionLabel(x))).join(' / ')}{o.screenedAs === 'review' ? ` · ${t('reviewed by {name}: “{note}”', { name: o.approvedByName, note: o.reviewNote })}` : ''}</span>
                {o.mealId === e.selectedMealId ? <> <Badge variant="ok"><Check aria-hidden />{t('chosen')}</Badge></> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

function PeriodCard({ per }: { per: Per }) {
  const { t, lang } = useT();
  const c = usePatient();
  const { id, date, day, discharged } = c;
  const e = per.entry;
  const s: string = per.npo && !e ? 'npo' : e?.status ?? 'none';
  const sc = per.screening;
  const { primary, secondary } = stageActions(per, c, t);
  const showLists = !discharged && sc && !per.npo && ['none', 'offered', 'selected', 'on-hold', 'cancelled'].includes(s);
  const mealHref = (mealId: string) => apiPath(`/meal/${mealId}`, { patient: id, date, period: per.period });
  const o = per.outcome;
  return (
    <section id={`period-${per.period}`} aria-labelledby={`h-${per.period}`} className="flex scroll-mt-24 flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2 id={`h-${per.period}`} tabIndex={-1} className="text-xl outline-none">{t(per.label)} <span className="font-sans text-sm font-normal text-muted-foreground">{t('around {time}', { time: per.serviceTime })}</span></h2>
        <div className="flex flex-wrap items-center gap-2">
          <EntryChip status={s} />
          {sc ? <span className="text-sm text-muted-foreground">{t('{total} on the menu · {eligible} eligible · {review} for review · {excluded} excluded', { total: sc.counts.total, eligible: sc.counts.eligible, review: sc.counts.review, excluded: sc.counts.excluded })}</span> : null}
        </div>
      </div>
      {e && !['on-hold', 'cancelled'].includes(e.status) ? <Stepper status={e.status} compact /> : null}
      {/* This period's actions (offer, confirm, replace…) come first, before the details below. */}
      {primary || secondary.length ? (
        <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-background p-3">
          {primary ? <div className="flex flex-col sm:flex-row">{primary}</div> : null}
          {secondary.length ? <div role="group" aria-label={lang === 'ar' ? t('More actions for {period}', { period: t(per.label) }) : `More actions for ${per.label.toLowerCase()}`} className="flex flex-wrap gap-2">{secondary}</div> : null}
        </div>
      ) : null}
      {per.npo ? <Notice tone="info">{t('Nothing by mouth (NPO). No meals are recommended, offered or sent to the kitchen.')}</Notice> : null}
      {sc?.noSuitable && !['confirmed', 'prepared', 'delivered'].includes(s) ? (
        <Notice tone="danger" title={t('No suitable option on this menu.')} icon={<ShieldX aria-hidden />}>
          <p>{t('No meal passes screening for this patient. Mizan does not relax the diet order or allergy rules. Arrange an alternative with the kitchen (menu management can add a meal for this date) or review the diet order.')}</p>
          {day.editable && c.can('request:create') ? (
            <Button variant="outline" size="sm" className="mt-2" onClick={(ev) => c.open({ kind: 'request', prefill: { type: 'alternative', date, period: per.period, message: 'No menu option passes screening. Kitchen alternative needed (requirements not relaxed).' } }, { from: ev.currentTarget, fallback: `h-${per.period}` })}>
              <MessageSquare aria-hidden />{t('Record a request for an alternative')}
            </Button>
          ) : null}
        </Notice>
      ) : null}
      {sc?.reviewOnly && !sc.noSuitable && ['none', 'cancelled'].includes(s) ? (
        <Notice tone="warn" title={t('Every option needs admin review.')}>{t(sc.review[0]?.evaluation.reviewReasons[0]?.message ?? '')}</Notice>
      ) : null}
      <ChangesBlock per={per} />
      <OrderBlock per={per} />
      {o ? (
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground"><Activity className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{lang === 'ar'
            ? `${o.accepted ? t('Intake: {amount} eaten ({source})', { amount: t(amountLabel(o.amount)), source: t(o.amountSource === 'staff' ? 'staff observation' : 'patient report') }) : t('Intake: refused')}${o.satisfaction ? ` · ${t('satisfaction {n}/5', { n: o.satisfaction })}` : ''}${o.measuredWasteG != null ? ` · ${t('{n} g weighed waste', { n: o.measuredWasteG })}` : ''}.`
            : <>Intake: {o.accepted ? `${amountLabel(o.amount).toLowerCase()} eaten (${o.amountSource === 'staff' ? 'staff observation' : 'patient report'})` : 'refused'}{o.satisfaction ? ` · satisfaction ${o.satisfaction}/5` : ''}{o.measuredWasteG != null ? ` · ${o.measuredWasteG} g weighed waste` : ''}.</>}</span>
        </p>
      ) : null}
      {sc && !per.npo ? (
        <Fold key={s} defaultOpen={Boolean(showLists && ['none', 'cancelled'].includes(s))} className="rounded-[14px] border border-border bg-background"
          headClassName="px-4 py-3 font-display text-[.95rem] font-semibold text-heading"
          title={<span className="inline-flex items-center gap-2"><ShieldCheck className="size-4" aria-hidden />{t('Screening results for this period')}</span>}>
          <div className="flex flex-col gap-5 px-3 pb-4 sm:px-4">
            {sc.eligible.length ? (
              <div className="flex flex-col gap-2.5">
                <h3 className="flex items-center gap-2 text-base"><ShieldCheck className="size-4" aria-hidden />{t('Eligible, ranked by preferences, appetite and feedback ({n})', { n: sc.eligible.length })}</h3>
                {sc.eligible.map((m: any) => <MealRow key={m.id} m={m} href={mealHref(m.id)} />)}
              </div>
            ) : null}
            {sc.review.length ? (
              <div className="flex flex-col gap-2.5">
                <h3 className="flex items-center gap-2 text-base text-warning"><TriangleAlert className="size-4" aria-hidden />{t('Needs admin review before it can be offered ({n})', { n: sc.review.length })}</h3>
                {sc.review.map((m: any) => <MealRow key={m.id} m={m} href={mealHref(m.id)} reviewNote={e?.offers.find((x: any) => x.mealId === m.id)?.reviewNote ?? null} />)}
              </div>
            ) : null}
            {sc.excluded.length ? (
              <Accordion className="rounded-[14px] border border-destructive-border bg-destructive-soft/30" headClassName="px-4 py-3 font-display text-sm font-semibold text-heading"
                title={<span className="inline-flex items-center gap-2"><ShieldX className="size-4" aria-hidden />{t('Excluded for this patient ({n})', { n: sc.excluded.length })}</span>}>
                <div className="flex flex-col gap-3 px-4 pb-4">
                  <p className="text-sm text-muted-foreground">{t('Excluded meals can never be offered or confirmed. Preferences do not change this.')}</p>
                  <ul className="flex flex-col gap-2.5">
                    {sc.excluded.map((m: any) => (
                      <li key={m.id}>
                        <b><Link href={mealHref(m.id)}>{t(m.name)}</Link></b>
                        <ul className="list-disc ps-5">{m.evaluation.exclusions.map((x: any, i: number) => <li key={i} className="text-sm">{t(x.message)} <span className="text-muted-foreground">({x.ruleId})</span></li>)}</ul>
                      </li>
                    ))}
                  </ul>
                </div>
              </Accordion>
            ) : null}
            {sc.unavailable.length ? (
              <p className="flex items-start gap-1.5 text-sm text-muted-foreground"><X className="mt-0.5 size-4 shrink-0" aria-hidden /> {t('Unavailable today (kitchen):')} {sc.unavailable.filter(Boolean).map((m: any) => `${t(m.name)}${m.unavailableReason ? ` (${t(m.unavailableReason)})` : ''}`).join(lang === 'ar' ? '، ' : ', ')}.</p>
            ) : null}
            {!sc.eligible.length && !sc.review.length && !sc.excluded.length ? <p className="text-sm text-muted-foreground">{t('No meals are on the menu for this period.')}</p> : null}
          </div>
        </Fold>
      ) : null}
    </section>
  );
}
