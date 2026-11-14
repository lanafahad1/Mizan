'use client';
import * as React from 'react';
import { Activity, Check, X, HeartPulse } from 'lucide-react';
import { apiSend } from '@/lib/api-client';
import { IntakeFields, readIntake } from '@/components/forms/intake-fields';
import { FormErrors } from '@/components/forms/errors';
import { EmptyState } from '@/components/cb/misc';
import { amountLabel, periodLabel, portionLabel, reasonLabel, roleLabel } from '@/components/cb/labels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { todayIso, addDays } from '@/domain/dates.js';
import { formatDate, formatLongDate } from '@/lib/format';
import { Modal, FormMessage, useSubmit, When, CellLabel } from './common';
import { useT } from '@/components/site/lang';
import { usePatient, P, type DialogProps, type IntakeTarget } from './patient-context';

/* eslint-disable @typescript-eslint/no-explicit-any */

function NR() {
  const { t } = useT();
  return <span className="text-muted-foreground">{t('not recorded')}</span>;
}

/** One record (patient report or staff observation). Missing values say "not recorded". */
function Observation({ r, staff }: { r: any; staff: boolean }) {
  const { t, lang } = useT();
  if (!r) return <p className="text-sm text-muted-foreground">{t('Not recorded')}</p>;
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span>{r.accepted ? <Badge variant="ok"><Check aria-hidden />{t('Accepted')}</Badge> : <Badge variant="danger"><X aria-hidden />{t('Refused')}</Badge>}</span>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
        <dt className="text-muted-foreground">{t('Amount eaten')}</dt><dd>{r.amount ? t(amountLabel(r.amount)) : <NR />}{staff ? ` ${t('(estimated)')}` : ''}</dd>
        <dt className="text-muted-foreground">{t('Satisfaction')}</dt><dd>{r.satisfaction ? `${r.satisfaction}/5` : <NR />}</dd>
        {r.reasons?.length ? <><dt className="text-muted-foreground">{t('Reasons')}</dt><dd>{r.reasons.map((x: string) => t(reasonLabel(x))).join(lang === 'ar' ? '، ' : ', ')}</dd></> : null}
      </dl>
      {r.recordedBy ? <span className="text-muted-foreground">{r.recordedBy}{r.recordedByRole ? ` (${t(roleLabel(r.recordedByRole))})` : ''}{lang === 'ar' ? '، ' : ', '}<When iso={r.recordedAt} /></span> : null}
    </div>
  );
}

export function IntakeTab() {
  const { t, lang } = useT();
  const c = usePatient();
  const { record, day } = c;
  const rows: any[] = record.intake;
  const today = todayIso();
  const minDate = addDays(today, -13);
  const canRecord = c.can('intake:record') && !c.discharged;
  const inWindow = (d: string) => d >= minDate && d <= today;
  const delivered = inWindow(day.date) ? day.periods.filter((per: any) => per.entry?.status === 'delivered') : [];
  const openFor = (target: IntakeTarget) => (ev: React.MouseEvent<HTMLButtonElement>) => c.open({ kind: 'intake', target }, { from: ev.currentTarget, fallback: 'in-head' });
  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="in-head" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <h2 id="in-head" tabIndex={-1} className="text-xl outline-none">{t('Intake and feedback')}</h2>
        <p className="text-sm">{lang === 'ar' ? t('Each delivered meal can have a patient report and a staff observation. They are kept separately and combined into one meal for summaries:') : <>Each delivered meal can have a <b>patient report</b> and a <b>staff observation</b>. They are kept separately and combined into one meal for summaries:</>}</p>
        <ul className="list-disc ps-5 text-sm">{record.outcomeRule.map((x: string, i: number) => <li key={i}>{t(x)}</li>)}</ul>
        <p className="text-sm text-muted-foreground">{t('Record intake once a meal has been delivered (here or from the meal’s period on the Meals tab). Delivery does not mean the meal was eaten.')}</p>
        {record.intakeFlags.length ? (
          <Notice tone="rose" title={t('Flagged for professional review')} icon={<HeartPulse aria-hidden />}>
            <ul className="list-disc ps-5">{record.intakeFlags.map((f: any, i: number) => <li key={i}><b>{t(f.title)}:</b> {t(f.text)}</li>)}</ul>
          </Notice>
        ) : null}
      </section>

      {canRecord ? (
        <section aria-labelledby="in-record" className="flex flex-col gap-3 rounded-xl border border-sage bg-mint/40 p-5 sm:p-6">
          <h2 id="in-record" className="text-lg">{t('Record a staff observation · {date}', { date: formatLongDate(day.date, lang) })}</h2>
          {delivered.length ? (
            <ul className="flex flex-col gap-2">
              {delivered.map((per: any) => (
                <li key={per.period} className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
                  <span><b>{t(per.label)}</b> · {t(per.entry.mealName)} ({t(portionLabel(per.entry.portion))}){per.outcome?.staffRecord ? <span className="text-sm text-muted-foreground"> · {t('staff observation recorded')}</span> : null}</span>
                  <Button size="sm" variant={per.outcome?.staffRecord ? 'outline' : 'default'} onClick={openFor({ date: day.date, period: per.period, mealName: per.entry.mealName, portion: per.entry.portion, deliveredAt: per.entry.deliveredAt, existing: per.outcome?.staffRecord ?? null, hasPatientRecord: Boolean(per.outcome?.patientRecord) })}>
                    <Activity aria-hidden />{t(per.outcome?.staffRecord ? 'Update staff observation' : 'Record staff observation')}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t(inWindow(day.date) ? 'No delivered meals on this day. Choose another day on the Meals tab; intake can be recorded for the last 14 days once a meal is delivered.' : 'No delivered meals on this day within the last 14 days. Choose another day on the Meals tab; intake can be recorded for the last 14 days once a meal is delivered.')}</p>
          )}
        </section>
      ) : null}

      {rows.length ? (
        <section aria-labelledby="in-list" className="flex flex-col gap-3">
          <h2 id="in-list" className="text-lg">{t('Recorded meals, newest first')}</h2>
          <ul className="flex flex-col gap-3">
            {rows.map((r) => (
              <li key={`${r.date}-${r.period}`} className="flex flex-col gap-3 rounded-[18px] border border-border bg-card p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col">
                    <b className="font-display text-heading">{formatDate(r.date, undefined, lang)} · {t(periodLabel(r.period))}</b>
                    <span className="text-sm">{t(r.mealName)} ({t(portionLabel(r.portion))})</span>
                    {r.patientRecord?.comment ? <span className="text-sm text-muted-foreground">“{r.patientRecord.comment}”</span> : null}
                  </div>
                  {canRecord && inWindow(r.date) ? (
                    <Button size="sm" variant="outline" onClick={openFor({ date: r.date, period: r.period, mealName: r.mealName, portion: r.portion, existing: r.staffRecord ?? null, hasPatientRecord: Boolean(r.patientRecord) })}>
                      <Activity aria-hidden />{t(r.staffRecord ? 'Update staff observation' : 'Add staff observation')}
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5 rounded-[14px] bg-blush/50 p-3"><CellLabel>{t('Patient report')}</CellLabel><Observation r={r.patientRecord} staff={false} /></div>
                  <div className="flex flex-col gap-1.5 rounded-[14px] bg-mint/50 p-3"><CellLabel>{t('Staff observation')}</CellLabel><Observation r={r.staffRecord} staff /></div>
                </div>
                <p className="text-sm"><CellLabel>{t('Used in summaries')}</CellLabel>{' '}
                  {lang === 'ar'
                    ? `${t(r.accepted ? 'Accepted' : 'Refused')}، ${t(amountLabel(r.amount))} (${t(r.amountSource === 'staff' ? 'staff' : 'patient')})${r.satisfaction ? `؛ ${r.satisfaction}/5 (${t(r.satisfactionSource)})` : ''}`
                    : <>{r.accepted ? 'Accepted' : 'Refused'}, {amountLabel(r.amount).toLowerCase()} ({r.amountSource === 'staff' ? 'staff' : 'patient'}){r.satisfaction ? `; ${r.satisfaction}/5 (${r.satisfactionSource})` : ''}</>}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <EmptyState title="No meals recorded yet">{t('Intake shows up here once the patient or staff record a delivered meal.')}</EmptyState>
      )}
    </div>
  );
}

export function IntakeDialog({ a, open, finalFocus }: DialogProps<'intake'>) {
  const { t: tr, lang } = useT();
  const c = usePatient();
  const t = a.target;
  const { busy, errors, formError, run } = useSubmit();
  const formRef = React.useRef<HTMLFormElement>(null);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = readIntake(e.currentTarget);
    run(async () => {
      const res = await apiSend<{ appetiteUpdated?: boolean; flags?: { title: string }[] }>('POST', P(c.id, '/intake'), body);
      await c.refresh();
      c.close();
      toast(`${tr('Recorded.')}${res.appetiteUpdated ? ` ${tr('Current appetite updated from this report.')}` : ''}`);
      if (res.flags?.length) toast(tr('Flag: {list}. Consider a professional review.', { list: res.flags.map((f) => tr(f.title)).join(lang === 'ar' ? '، ' : ', ') }), { tone: 'warn', timeout: 8000 });
    }, formRef.current);
  };
  return (
    <Modal open={open} onClose={c.close} wide finalFocus={finalFocus} title={tr('Record intake: {period} {date}', { period: lang === 'ar' ? tr(periodLabel(t.period)) : periodLabel(t.period).toLowerCase(), date: formatDate(t.date, undefined, lang) })}
      footer={<><Button variant="outline" onClick={c.close}>{tr('Cancel')}</Button><Button type="submit" form="in-form" disabled={busy}>{tr(busy ? 'Saving…' : 'Save staff observation')}</Button></>}>
      <p><b>{tr(t.mealName)}</b>{t.portion ? ` · ${tr('{portion} portion', { portion: tr(portionLabel(t.portion)) })}` : ''}{t.deliveredAt ? <> · {tr('delivered')} <When iso={t.deliveredAt} /></> : null}</p>
      {t.hasPatientRecord ? <p className="text-sm text-muted-foreground">{tr('The patient has also reported this meal. Both records are kept; the staff observation is used for the amount eaten.')}</p> : null}
      <FormErrors errors={errors}>
        <form id="in-form" ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-4">
          <input type="hidden" name="date" value={t.date} />
          <input type="hidden" name="period" value={t.period} />
          <IntakeFields reference={c.reference} staff initial={t.existing} />
          <FormMessage message={formError} />
        </form>
      </FormErrors>
    </Modal>
  );
}
