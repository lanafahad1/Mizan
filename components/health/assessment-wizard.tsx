'use client';
// The optional assessment, one short step per screen with a progress bar.
// Answers are saved as a draft at every step, so the person can stop and come back.
import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { apiSend, ApiError } from '@/lib/api-client';
import { ASSESSMENT_SECTIONS, ASSESSMENT_NOTE, MEMBER_ASSESSMENT_NOTE } from '@/domain/assessment.js';
import { Card } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field, OptionCard } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SuccessCheck } from '@/components/ui/success-check';
import { FormMessage } from '@/components/staff/ui';
import { AnswersSummary } from './assessment-review';
import { useT } from '@/components/site/lang';
import { tMsg } from '@/components/diary/types';
import { H } from './common';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function AssessmentWizard({ who, kind, initial }: { who: string; kind: 'member' | 'patient'; initial: any | null }) {
  const { t, lang } = useT();
  const sections = React.useMemo(() => ASSESSMENT_SECTIONS.map((s: any) => ({ ...s, fields: s.fields.filter((f: any) => kind === 'patient' || !f.hospitalOnly) })), [kind]);
  const steps = sections.length + 1; // + review
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, any>>(initial?.answers ?? {});
  const [id, setId] = React.useState<string | null>(initial?.id ?? null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState<string | null>(null);
  const headRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => { headRef.current?.focus(); }, [step]);

  const set = (k: string, v: any) => setAnswers((a) => { const n = { ...a }; if (v == null || v === '' || (Array.isArray(v) && !v.length)) delete n[k]; else n[k] = v; return n; });

  const save = async () => {
    setBusy(true); setErrors({}); setFormError(null);
    try {
      const rec = await apiSend<any>('POST', H(who, '/assessments'), { answers });
      setId(rec.id);
      return rec.id as string;
    } catch (e) {
      const ae = e as ApiError;
      setErrors(ae.errors ?? {}); setFormError(tMsg(t, lang, ae.message));
      return null;
    } finally { setBusy(false); }
  };
  const next = async () => { if (await save()) setStep((s) => Math.min(steps - 1, s + 1)); };
  const submit = async () => {
    const saved = await save();
    if (!saved) return;
    setBusy(true);
    try {
      const rec = await apiSend<any>('POST', H(who, `/assessments/${saved}/submit`), {});
      setDone(rec.status);
    } catch (e) { setFormError(tMsg(t, lang, (e as Error).message)); } finally { setBusy(false); }
  };

  if (done) {
    return (
      <Card tone="mint" className="items-start" role="status">
        <SuccessCheck />
        <h2 className="text-xl">{done === 'completed' ? t('Saved to your health space') : t('Sent to your care team')}</h2>
        <p className="text-sage-deep">{done === 'completed' ? t('Thank you. We added your height, weight and details, so you can now see your BMI and how many calories you need each day.') : t('Thank you. Your care team will review it and may set your daily targets and your next review date.')}</p>
        <Link href="/my-health" className={buttonVariants()}>{t('Back to My Health')}<ArrowRight aria-hidden className="rtl:-scale-x-100" /></Link>
      </Card>
    );
  }

  const section = sections[step];
  const pct = Math.round(((step + 1) / steps) * 100);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-sm text-muted-foreground"><span>{t('Step {n} of {total}', { n: step + 1, total: steps })}</span><span>{section ? t(section.title) : t('Check and send')}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={t('Assessment progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-1">
          <h2 ref={headRef} tabIndex={-1} className="text-xl outline-none">{section ? t(section.title) : t('Check your answers')}</h2>
          <p className="text-sm text-muted-foreground">{section ? `${t(section.intro)} ${t('You can skip any question.')}` : t('Open a section to check it. You can go back to change anything.')}</p>
        </div>
        {section ? (
          <div className="flex flex-col gap-5">
            {section.fields.map((f: any) => <Question key={f.id} f={f} answers={answers} set={set} error={errors[f.id] ? tMsg(t, lang, errors[f.id]) : undefined} />)}
          </div>
        ) : (
          <>
            <AnswersSummary answers={answers} />
            <Notice tone="info">{t(kind === 'member' ? MEMBER_ASSESSMENT_NOTE : ASSESSMENT_NOTE)}</Notice>
          </>
        )}
        <FormMessage message={formError} />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          {step > 0 ? <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={busy}><ArrowLeft aria-hidden className="rtl:-scale-x-100" />{t('Back')}</Button> : <Link href="/my-health" className={buttonVariants({ variant: 'ghost' })}>{t('Cancel')}</Link>}
          {section ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => void save().then((ok) => ok && setFormError(null))} disabled={busy}>{t('Save for later')}</Button>
              <Button onClick={() => void next()} disabled={busy}>{busy ? t('Saving…') : t('Next')}<ArrowRight aria-hidden className="rtl:-scale-x-100" /></Button>
            </div>
          ) : (
            <Button onClick={() => void submit()} disabled={busy}><Check aria-hidden />{kind === 'member' ? t('Finish') : t('Send to my care team')}</Button>
          )}
        </div>
      </Card>
      {id ? <p className="text-xs text-muted-foreground">{t('Your answers are saved, so you can finish later.')}</p> : null}
    </div>
  );
}

function Question({ f, answers, set, error }: { f: any; answers: Record<string, any>; set: (k: string, v: any) => void; error?: string }) {
  const { t } = useT();
  const v = answers[f.id];
  const id = `q-${f.id}`;
  if (f.type === 'choice' || f.type === 'multi') {
    const multi = f.type === 'multi';
    const toggle = (o: string) => {
      if (!multi) return set(f.id, v === o ? null : o);
      const list: string[] = Array.isArray(v) ? v : [];
      if (f.exclusive?.includes(o)) return set(f.id, list.includes(o) ? [] : [o]);
      const without = list.filter((x) => !f.exclusive?.includes(x));
      set(f.id, without.includes(o) ? without.filter((x) => x !== o) : [...without, o]);
    };
    const checked = (o: string) => (multi ? Array.isArray(v) && v.includes(o) : v === o);
    const showOther = f.other && (multi ? Array.isArray(v) && v.includes('other') : v === 'other');
    const showDetails = f.details && (v === 'yes' || f.id === 'activity');
    return (
      <fieldset className="flex flex-col gap-2" aria-describedby={error ? `${id}-e` : undefined}>
        <legend className="mb-1 font-display text-[.95rem] font-medium text-heading">{t(f.label)}{multi ? <span className="font-sans text-xs font-normal text-muted-foreground"> {t('(choose any)')}</span> : null}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {f.options.map((o: any) => <OptionCard key={o.id} type={multi ? 'checkbox' : 'radio'} name={id} value={o.id} checked={checked(o.id)} onChange={() => toggle(o.id)} title={t(o.label)} />)}
        </div>
        {showOther ? <Input aria-label={t('{question}: other', { question: t(f.label) })} maxLength={200} placeholder={t('Please describe')} value={answers[f.other] ?? ''} onChange={(e) => set(f.other, e.target.value)} /> : null}
        {showDetails ? <Input aria-label={t(f.detailsLabel ?? 'Details')} maxLength={200} placeholder={t(f.detailsLabel ?? 'Details')} value={answers[f.details] ?? ''} onChange={(e) => set(f.details, e.target.value)} /> : null}
        {error ? <p id={`${id}-e`} role="alert" className="text-sm font-semibold text-destructive">{error}</p> : null}
      </fieldset>
    );
  }
  return (
    <Field id={id} label={`${t(f.label)}${f.unit ? ` (${t(f.unit)})` : ''}`} optional error={error}>
      {f.type === 'textarea' ? <Textarea rows={2} maxLength={f.max} value={v ?? ''} onChange={(e) => set(f.id, e.target.value)} />
        : <Input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} inputMode={f.type === 'number' ? 'decimal' : undefined} min={f.min} max={f.type === 'date' ? new Date().toISOString().slice(0, 10) : f.max} step={f.step}
            maxLength={f.type === 'text' ? f.max : undefined} value={v ?? ''} onChange={(e) => set(f.id, f.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)} />}
    </Field>
  );
}
