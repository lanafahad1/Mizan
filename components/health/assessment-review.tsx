'use client';
// Care-team review of a patient's assessment (admin): read the answers, set the
// targets and next review date, then approve or ask for more information.
import * as React from 'react';
import { useSWRConfig } from 'swr';
import { apiSend, ApiError } from '@/lib/api-client';
import { ASSESSMENT_SECTIONS, REVIEW_FIELDS } from '@/domain/assessment.js';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { FormMessage } from '@/components/staff/ui';
import { useT } from '@/components/site/lang';
import type { T } from '@/lib/i18n';
import { tMsg } from '@/components/diary/types';
import { H, fmtNum } from './common';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** An answer as readable text. */
export function answerText(f: any, answers: any, t: T = (x) => x): string | null {
  const v = answers?.[f.id];
  if (v == null) return null;
  const opt = (id: string) => t(f.options?.find((o: any) => o.id === id)?.label ?? id);
  let out = f.type === 'choice' ? opt(v) : f.type === 'multi' ? (v as string[]).map(opt).join(t(', ')) : `${v}${f.unit ? ` ${t(f.unit)}` : ''}`;
  for (const extra of [f.other, f.details]) if (extra && answers[extra]) out += ` — ${answers[extra]}`;
  return out;
}

export function AnswersSummary({ answers }: { answers: any }) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-2">
      {ASSESSMENT_SECTIONS.map((s: any) => {
        const rows = s.fields.map((f: any) => [t(f.label), answerText(f, answers, t)]).filter((r: any) => r[1]);
        return (
          <Accordion key={s.id} title={t('{section} · {n} answered', { section: t(s.title), n: rows.length })}>
            {rows.length ? (
              <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                {rows.map(([q, a]: any) => <React.Fragment key={q}><dt className="text-muted-foreground">{q}</dt><dd className="font-semibold text-heading">{a}</dd></React.Fragment>)}
              </dl>
            ) : <p className="text-sm text-muted-foreground">{t('No answers in this section.')}</p>}
          </Accordion>
        );
      })}
    </div>
  );
}

export function AssessmentReview({ who, assessment, suggested }: { who: string; assessment: any; suggested: any }) {
  const { t, lang } = useT();
  const { mutate } = useSWRConfig();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const reviewable = ['awaiting-review', 'more-info', 'approved'].includes(assessment.status);
  const r = assessment.review ?? {};

  const send = async (decision: 'approved' | 'more-info') => {
    const fd = new FormData(formRef.current!);
    const review = Object.fromEntries(REVIEW_FIELDS.map((f: any) => [f.id, fd.get(f.id)]).filter(([, v]: any) => v != null && v !== ''));
    setBusy(true); setErrors({}); setFormError(null);
    try {
      await apiSend('POST', H(who, `/assessments/${assessment.id}/review`), { decision, review, note: fd.get('note') });
      toast(decision === 'approved' ? t('Plan approved. The patient’s targets were updated.') : t('Sent back to the patient for more information.'));
      void mutate((k) => typeof k === 'string' && k.startsWith(H(who)));
    } catch (e) {
      const ae = e as ApiError;
      setErrors(ae.errors ?? {}); setFormError(tMsg(t, lang, ae.message));
    } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <AnswersSummary answers={assessment.answers} />
      {reviewable ? (
        <form ref={formRef} onSubmit={(e) => { e.preventDefault(); void send('approved'); }} noValidate className="flex flex-col gap-4 rounded-[14px] border border-sage bg-mint/50 p-4">
          <h3 className="text-base">{t('Care-team review')}</h3>
          {suggested ? <Notice tone="info">{t('MOH calculator estimate for this patient: about {n} kcal a day (maintenance). Nearest MOH plan: {plan} kcal.', { n: fmtNum(suggested.kcal), plan: suggested.planKcal })}</Notice> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {REVIEW_FIELDS.map((f: any) => (
              <Field key={f.id} id={`rv-${f.id}`} label={`${t(f.label)}${f.unit ? ` (${t(f.unit)})` : ''}`} optional error={errors[f.id] ? tMsg(t, lang, errors[f.id]) : undefined} className={f.type === 'textarea' ? 'sm:col-span-2' : undefined}>
                {f.type === 'textarea' ? <Textarea name={f.id} rows={2} maxLength={f.max} defaultValue={r[f.id] ?? ''} />
                  : f.type === 'choice' ? <NativeSelect name={f.id} defaultValue={r[f.id] ?? ''}><option value="">{t('Choose…')}</option>{f.options.map((o: any) => <option key={o.id} value={o.id}>{t(o.label)}</option>)}</NativeSelect>
                    : <Input name={f.id} type={f.type === 'date' ? 'date' : 'number'} min={f.min} max={f.max} step={f.step} defaultValue={r[f.id] ?? ''} />}
              </Field>
            ))}
          </div>
          <Field id="rv-note" label={t('Message to the patient')} optional hint={t('Required when asking for more information.')} error={errors.note ? tMsg(t, lang, errors.note) : undefined}><Textarea name="note" rows={2} maxLength={400} /></Field>
          <FormMessage message={formError} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>{busy ? t('Saving…') : t('Approve plan')}</Button>
            <Button variant="outline" disabled={busy} onClick={() => void send('more-info')}>{t('Ask for more information')}</Button>
          </div>
          <p className="text-xs text-muted-foreground">{t('Targets are set by the care team. CareBite does not prescribe; approving copies the targets to the patient’s health space.')}</p>
        </form>
      ) : <p className="text-sm text-muted-foreground">{t('The patient has not sent this assessment yet.')}</p>}
    </div>
  );
}
