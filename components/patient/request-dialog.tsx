'use client';
// Patient requests to the nutrition team: a different meal, a schedule change,
// support, or a report about allergies or diet (a clinical request that an
// admin reviews before anything changes). After sending, the dialog shows a
// confirmation with the request's status and a link to it in My Requests.
// Opened with an empty `type` (My Requests → "New request"), it first asks what
// the request is about.
import * as React from 'react';
import Link from 'next/link';
import { useSWRConfig } from 'swr';
import { HeartPulse, MessageSquare, Users, CalendarCheck } from 'lucide-react';
import { apiSend, ApiError } from '@/lib/api-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input, Textarea, NativeSelect, Label } from '@/components/ui/input';
import { OptionCard } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SuccessCheck } from '@/components/ui/success-check';
import { RequestStatusChip } from '@/components/cb/status';
import { FormErrors, FieldError } from '@/components/forms/errors';
import { Fieldset } from '@/components/forms/fieldset';
import { useT } from '@/components/site/lang';

/* eslint-disable @typescript-eslint/no-explicit-any */
/** `type: ''` shows a type picker first. */
export type RequestTarget = { type: string; date?: string | null; period?: string | null };
export type RequestVocab = { periods: { id: string; label: string }[]; requestTypes: { id: string; label: string; clinical?: boolean }[]; reportKinds?: { id: string; label: string }[]; allergens?: { id: string; label: string; hint?: string }[] };

type Sent = { note: string; request: { id: string; status: string } };

export function RequestDialog({ pid, target, onClose, vocab, today, maxDate, defaultDate, onSent }: {
  pid: string; target: RequestTarget | null; onClose: () => void; vocab: RequestVocab; today: string; maxDate: string; defaultDate: string; onSent?: (r: Sent) => void;
}) {
  const { mutate } = useSWRConfig();
  const { t } = useT();
  // Keep the last target so the content stays while the dialog animates closed.
  const last = React.useRef<RequestTarget | null>(null);
  if (target) last.current = target;
  const tg = target ?? last.current;
  const [sent, setSent] = React.useState<Sent | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [kind, setKind] = React.useState(vocab.reportKinds?.[0]?.id ?? '');
  const [picked, setPicked] = React.useState('');
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (target) { setSent(null); setErrors({}); setFormError(null); setBusy(false); setKind(vocab.reportKinds?.[0]?.id ?? ''); setPicked(''); }
  }, [target, vocab.reportKinds]);

  const picking = Boolean(tg && !tg.type);
  // A report about allergies or diet needs its extra vocabulary; without it the picker leaves it out.
  const pickable = vocab.requestTypes.filter((x) => !x.clinical || vocab.reportKinds?.length);
  const typeId = tg?.type || picked;
  const type = vocab.requestTypes.find((x) => x.id === typeId);
  const clinical = Boolean(type?.clinical);
  const needsSlot = typeId === 'alternative' || Boolean(tg?.period);
  const msgLabel = t(typeId === 'alternative' ? 'What would you prefer?' : typeId === 'schedule-change' ? 'What would you like to change?' : clinical ? 'Tell us more' : 'How can we help?');
  const title = picking && !typeId ? t('New request') : clinical ? t('Tell us about a diet or allergy change') : t(type?.label ?? 'Request');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tg) return;
    if (!typeId) {
      setErrors({ type: t('Choose what your request is about.') });
      requestAnimationFrame(() => document.getElementById('rq-type-picker')?.querySelector<HTMLElement>('input')?.focus());
      return;
    }
    const body = { ...Object.fromEntries(new FormData(e.currentTarget)), type: typeId };
    setBusy(true); setErrors({}); setFormError(null);
    try {
      const r = await apiSend<Sent>('POST', `/api/patients/${pid}/requests`, body);
      setSent(r);
      onSent?.(r);
      // Refresh every view of this patient's data (my meals, requests, profile).
      void mutate((k) => typeof k === 'string' && k.startsWith(`/api/patients/${pid}`));
    } catch (err) {
      const ae = err as ApiError;
      if (ae.errors && Object.keys(ae.errors).length) {
        setErrors(Object.fromEntries(Object.entries(ae.errors).map(([k, v]) => [k, t(v)])));
        requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-field-error]')?.scrollIntoView({ block: 'center' }));
      } else setFormError(t(ae.message));
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{clinical ? t('Your nutrition team checks every report before your record is changed.') : t('Your message goes to the nutrition team caring for you.')}</DialogDescription>
        </DialogHeader>
        {sent ? (
          <>
            <DialogBody>
              <SuccessCheck />
              <Notice tone="ok" role="status" title={clinical ? t('Report sent') : t('Request sent')}>{t(sent.note)}</Notice>
              <p className="flex flex-wrap items-center gap-2">{t('Status:')} <RequestStatusChip status={sent.request.status} /></p>
            </DialogBody>
            <DialogFooter>
              <Link href={`/my-requests?id=${encodeURIComponent(sent.request.id)}`} className={buttonVariants({ variant: 'outline' })} onClick={onClose}>{clinical ? t('View my report') : t('View my request')}</Link>
              <DialogClose className={buttonVariants()}>{t('Done')}</DialogClose>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogBody>
              {picking ? (
                <FormErrors errors={errors}>
                  <div id="rq-type-picker">
                    <Fieldset legend={t('What is your request about?')}>
                      <div className="grid gap-2">
                        {pickable.map((rt) => {
                          const Icon = rt.clinical ? HeartPulse : rt.id === 'assistance' ? Users : rt.id === 'schedule-change' ? CalendarCheck : MessageSquare;
                          return <OptionCard key={rt.id} name="rq-pick" value={rt.id} checked={picked === rt.id} onChange={() => { setPicked(rt.id); setErrors({}); }}
                            title={<span className="inline-flex items-center gap-2"><Icon className="size-4" aria-hidden />{t(rt.label)}</span>} />;
                        })}
                      </div>
                      <FieldError name="type" />
                    </Fieldset>
                  </div>
                </FormErrors>
              ) : null}
              {clinical ? <Notice tone="rose" icon={<HeartPulse aria-hidden />}>{t('An admin checks every report before your record is changed. If you think you’re having an allergic reaction, tell your nurse straight away.')}</Notice> : null}
              <FormErrors errors={errors}>
                <form id="rq-form" ref={formRef} noValidate onSubmit={submit} className="flex flex-col gap-5">
                  {clinical ? (
                    <>
                      <Fieldset legend={t('What has changed?')}>
                        <div className="grid gap-2">
                          {(vocab.reportKinds ?? []).map((k) => <OptionCard key={k.id} name="reportKind" value={k.id} checked={kind === k.id} onChange={() => setKind(k.id)} title={t(k.label)} />)}
                        </div>
                        <FieldError name="reportKind" />
                      </Fieldset>
                      {['new-allergy', 'allergy-wrong'].includes(kind) ? (
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="cl-alg">{t('Which food?')} <span className="font-sans text-xs font-normal text-muted-foreground">{t('(optional)')}</span></Label>
                          <NativeSelect id="cl-alg" name="allergen" defaultValue="" aria-describedby="cl-alg-hint">
                            <option value="">{t('Not listed, or not sure')}</option>
                            {(vocab.allergens ?? []).map((a) => <option key={a.id} value={a.id}>{t(a.label)}{a.hint ? ` (${t(a.hint)})` : ''}</option>)}
                          </NativeSelect>
                          <span id="cl-alg-hint" className="text-sm text-muted-foreground">{t('If you pick a food for a new allergy, we hold back meals that contain it until an admin reviews your report.')}</span>
                        </div>
                      ) : null}
                    </>
                  ) : needsSlot ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="rq-date">{t('Day')}</Label>
                        <Input type="date" id="rq-date" name="date" defaultValue={tg?.date || defaultDate} min={today} max={maxDate} aria-invalid={errors.date ? true : undefined} />
                        <FieldError name="date" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="rq-period">{t('Meal')}</Label>
                        <NativeSelect id="rq-period" name="period" defaultValue={tg?.period ?? vocab.periods[0]?.id} aria-invalid={errors.period ? true : undefined}>
                          {vocab.periods.map((p) => <option key={p.id} value={p.id}>{t(p.label)}</option>)}
                        </NativeSelect>
                        <FieldError name="period" />
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="rq-msg">{msgLabel}</Label>
                    <Textarea id="rq-msg" name="message" maxLength={400} required aria-describedby="rq-hint" aria-invalid={errors.message ? true : undefined}
                      placeholder={clinical ? t('For example: I was told I should avoid sesame.') : undefined} />
                    <span id="rq-hint" className="text-sm text-muted-foreground">{t('Up to 400 characters. You’ll see the team’s reply here and in My Requests.')}</span>
                    <FieldError name="message" />
                  </div>
                  {formError ? <p role="alert" className="text-sm font-semibold text-destructive">{formError}</p> : null}
                </form>
              </FormErrors>
            </DialogBody>
            <DialogFooter>
              <DialogClose className={buttonVariants({ variant: 'outline' })}>{t('Cancel')}</DialogClose>
              <Button type="submit" form="rq-form" disabled={busy}>{busy ? t('Sending…') : clinical ? t('Send to my nutrition team') : t('Send to the nutrition team')}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
