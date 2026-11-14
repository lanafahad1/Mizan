'use client';
import * as React from 'react';
import { Lock, RefreshCw, List, Check, X, Info } from 'lucide-react';
import { apiSend } from '@/lib/api-client';
import { WhyThisMeal } from '@/components/cb/meal';
import { portionLabel, periodLabel } from '@/components/cb/labels';
import { FormErrors, FieldError } from '@/components/forms/errors';
import { Fieldset } from '@/components/forms/fieldset';
import { OptionCard } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Input, NativeSelect, Textarea, Label } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { formatDate, formatLongDate } from '@/lib/format';
import { useT } from '@/components/site/lang';
import { cn } from '@/lib/utils';
import { Modal, FormMessage, useSubmit } from './common';
import { usePatient, P, type DialogProps } from './patient-context';
import { ChangesBlock, cancelDialog } from './meals-tab';

/* eslint-disable @typescript-eslint/no-explicit-any */

const usePer = (period: string) => {
  const c = usePatient();
  return c.day.periods.find((x: any) => x.period === period);
};

function Footer({ form, busy, label, busyLabel, danger = false, disabled = false, cancel = 'Cancel' }: { form: string; busy: boolean; label: string; busyLabel?: string; danger?: boolean; disabled?: boolean; cancel?: string }) {
  const c = usePatient();
  const { t } = useT();
  return (
    <>
      <Button variant="outline" onClick={c.close}>{t(cancel)}</Button>
      <Button type="submit" form={form} variant={danger ? 'destructive-solid' : 'default'} disabled={busy || disabled}>{t(busy ? busyLabel ?? 'Saving…' : label)}</Button>
    </>
  );
}

// ------------------------------------------------------------------ offer options
export function OfferDialog({ a, open, finalFocus }: DialogProps<'offer'>) {
  const { t, lang } = useT();
  const c = usePatient();
  const per = usePer(a.period);
  const canReview = c.can('meal:approve-review');
  const reviewIds = new Set<string>((per?.screening?.review ?? []).map((m: any) => m.id));
  // Staff cannot re-offer a meal that needs review (the server refuses it), so those start unticked for them.
  const [picked, setPicked] = React.useState<string[]>(() => (per?.entry?.offers ?? []).map((o: any) => o.mealId).filter((x: string) => canReview || !reviewIds.has(x)));
  const [notes, setNotes] = React.useState<Record<string, string>>(() => Object.fromEntries((per?.entry?.offers ?? []).filter((o: any) => o.reviewNote).map((o: any) => [o.mealId, o.reviewNote])));
  const { busy, errors, formError, setFormError, run } = useSubmit();
  const formRef = React.useRef<HTMLFormElement>(null);
  if (!per?.screening) return null;
  const toggle = (id: string, on: boolean) => {
    if (on && picked.length >= 4) { toast(t('Offer at most 4 options so the choice stays simple.'), { tone: 'warn' }); return; }
    setPicked((cur) => (on ? [...cur, id] : cur.filter((x) => x !== id)));
  };
  const item = (m: any, review: boolean) => {
    const ev = m.evaluation;
    const desc = `${m.type === 'complete' ? t('Complete meal: {dishes}', { dishes: m.components.map((x: any) => (lang === 'ar' && x.nameAr ? x.nameAr : t(x.name))).join(' + ') }) : t('Individual dish')} · ${ev.matchLevel ? t(ev.matchLevel) : review ? t('needs review') : ''}${review ? ` · ${t(ev.reviewReasons[0]?.message ?? '')}` : ''}`;
    const checked = picked.includes(m.id);
    return (
      <div key={m.id} className="flex flex-col gap-2">
        <OptionCard type="checkbox" name="meal" value={m.id} checked={checked} onChange={(e) => toggle(m.id, e.target.checked)} disabled={review && !canReview} title={t(m.name)} description={desc} />
        {review && canReview && checked ? (
          <div className="flex flex-col gap-1.5 ps-2">
            <Label htmlFor={`rn-${m.id}`}>{t('Review note for {meal} (required)', { meal: t(m.name) })}</Label>
            <Textarea id={`rn-${m.id}`} maxLength={300} value={notes[m.id] ?? ''} onChange={(e) => setNotes({ ...notes, [m.id]: e.target.value })} className="min-h-20" />
            <FieldError name={`reviewNote.${m.id}`} />
          </div>
        ) : null}
      </div>
    );
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!picked.length) { setFormError(t('Tick at least one option to offer.')); return; }
    run(async () => {
      await apiSend('POST', P(c.id, '/offers'), { date: c.date, period: a.period, items: picked.map((mealId) => ({ mealId, reviewNote: notes[mealId] || undefined })) });
      await c.refresh();
      c.close();
      toast(`${t(picked.length === 1 ? '{n} option offered for {period}.' : '{n} options offered for {period}.', { n: picked.length, period: lang === 'ar' ? t(periodLabel(a.period)) : a.period })} ${t(c.day.linkedAccount ? 'The patient can now choose on their screen.' : 'No patient account is linked: record the patient’s choice, then confirm.')}`, { timeout: 7000 });
    }, formRef.current);
  };
  return (
    <Modal open={open} onClose={c.close} wide finalFocus={finalFocus} title={t('Offer {period} options · {date}', { period: lang === 'ar' ? t(per.label) : per.label.toLowerCase(), date: formatDate(c.date, undefined, lang) })}
      description={t('Tick up to 4 approved options. The patient chooses on their own screen (or you record their choice), then the nutrition team confirms.')}
      footer={<Footer form="of-form" busy={busy} label="Offer selected options" busyLabel="Offering…" />}>
      <FormErrors errors={errors}>
        <form id="of-form" ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-5">
          <p className="text-sm font-semibold text-heading" aria-live="polite">{t('{n} of 4 options ticked', { n: picked.length })}</p>
          {per.screening.eligible.length ? (
            <Fieldset legend={t('Eligible (ranked)')}><div className="grid gap-2">{per.screening.eligible.map((m: any) => item(m, false))}</div></Fieldset>
          ) : <Notice tone="warn">{t('No meal passes screening without review for this period.')}</Notice>}
          {per.screening.review.length ? (
            <Fieldset legend={t('Needs admin review')}>
              {canReview ? null : <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Lock className="size-4" aria-hidden /> {t('Only an admin can offer these, with a review note.')}</p>}
              <div className="grid gap-2">{per.screening.review.map((m: any) => item(m, true))}</div>
            </Fieldset>
          ) : null}
          <FormMessage message={formError} />
        </form>
      </FormErrors>
    </Modal>
  );
}

// ------------------------------------------------------------------ confirm (the old confirmDialog2)
export function ConfirmDialog({ a, open, finalFocus }: DialogProps<'confirm'>) {
  const { t, lang } = useT();
  const c = usePatient();
  const per = usePer(a.period);
  const isAdmin = c.can('meal:approve-review');
  const entry = per?.entry;
  const list: any[] = [...(per?.screening?.eligible ?? []), ...(per?.screening?.review ?? [])];
  const offered = new Set<string>((entry?.offers ?? []).map((o: any) => o.mealId));
  const reviewedOffer = (id: string) => Boolean(entry?.offers.some((o: any) => o.mealId === id && o.screenedAs === 'review' && o.reviewNote));
  // Non-admins cannot pick a meal that needs review, unless an admin already offered it with a review note.
  const canPick = (x: any) => isAdmin || x.evaluation.status !== 'review' || reviewedOffer(x.id);
  const allowed = list.filter(canPick);
  const portionsFor = (x: any) => {
    const ev = x.evaluation;
    const offer = entry?.offers.find((o: any) => o.mealId === x.id);
    const portions: string[] = offer?.portions?.length ? offer.portions : ev.portion.eligible.length ? ev.portion.eligible : ev.portion.permitted;
    const current: string = entry?.selectedMealId === x.id ? entry.portion : offer?.suggestedPortion ?? ev.portion.suggested;
    return { portions, current };
  };
  const initialId = () => {
    const pre = a.mealId ?? (entry?.status === 'selected' ? entry.selectedMealId : null) ?? allowed.find((x) => offered.has(x.id))?.id ?? allowed[0]?.id ?? list[0]?.id;
    return list.some((x) => x.id === pre) ? pre : allowed[0]?.id ?? list[0]?.id ?? '';
  };
  const [mealId, setMealId] = React.useState<string>(initialId);
  const sel = list.find((x) => x.id === mealId);
  const [portion, setPortion] = React.useState<string>(() => (sel ? portionsFor(sel).current : ''));
  const [note, setNote] = React.useState('');
  const [reason, setReason] = React.useState('');
  const { busy, errors, formError, run } = useSubmit();
  const formRef = React.useRef<HTMLFormElement>(null);
  if (!per) return null;
  const offer = sel ? entry?.offers.find((o: any) => o.mealId === sel.id) : null;
  const ev = sel?.evaluation;
  const needNote = Boolean(ev && ev.status === 'review' && !(offer?.screenedAs === 'review' && offer.reviewNote));
  const pp = sel ? portionsFor(sel) : { portions: [], current: '' };
  const patientChose = entry?.status === 'selected' && (!a.mealId || a.mealId === entry.selectedMealId);
  const verb = a.replace ? 'Replace' : 'Confirm';
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await apiSend('POST', P(c.id, '/confirm'), { date: c.date, period: a.period, mealId, portion: portion || undefined, reviewNote: note || undefined, reason: reason || undefined });
      await c.refresh();
      c.close();
      toast(`${t('{meal} confirmed for {period}. It is now on the kitchen summary.', { meal: sel?.name ? t(sel.name) : t('Meal'), period: lang === 'ar' ? t(periodLabel(a.period)) : a.period })}${a.replace ? ` ${t('The kitchen was alerted about the replacement.')}` : ''}`, { timeout: 7000 });
    }, formRef.current);
  };
  return (
    <Modal open={open} onClose={c.close} wide finalFocus={finalFocus} title={t(`${verb} {period} for {id}`, { period: lang === 'ar' ? t(per.label) : per.label.toLowerCase(), id: c.record.patient.demoId })}
      description={`${formatLongDate(c.date, lang)}. ${t(patientChose ? 'The patient chose a meal; you can confirm it or confirm a different one.' : 'Confirming directly records that the nutrition team chose this meal.')} ${t('You will be recorded as the confirming healthcare provider.')}`}
      footer={<Footer form="cf-form" busy={busy} label={a.replace ? 'Replace and confirm' : 'Confirm meal'} busyLabel="Confirming…" disabled={!allowed.length} />}>
      {!list.length ? (
        <Notice tone="warn" role="status" title={t('No meal passes screening for this period.')}>{t('Mizan does not relax the diet order or allergy rules. Arrange an alternative with the kitchen or review the diet order.')}</Notice>
      ) : !allowed.length ? (
        <Notice tone="warn" role="status" title={t('Only an admin can confirm a meal for this period.')} icon={<Info aria-hidden />}>
          {t('Every meal that passes screening needs admin review for this patient. Ask an admin to confirm or replace it, or offer new options instead.')}
        </Notice>
      ) : null}
      <FormErrors errors={errors}>
        <form id="cf-form" ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-5">
          {list.length ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cf-meal">{t('Meal')}</Label>
              <NativeSelect id="cf-meal" name="mealId" value={mealId} onChange={(e) => { const id = e.target.value; setMealId(id); const nx = list.find((x) => x.id === id); setPortion(nx ? portionsFor(nx).current : ''); }}>
                {list.map((x) => (
                  <option key={x.id} value={x.id} disabled={!canPick(x)}>
                    {t(x.name)}{x.evaluation.status === 'review' ? ` ${t(reviewedOffer(x.id) ? '(reviewed by admin)' : '(needs admin review)')}` : ''}{entry?.selectedMealId === x.id ? ` ${t('(patient’s choice)')}` : ''}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ) : null}
          {ev ? <WhyThisMeal key={sel.id} ev={ev} open={ev.status === 'review'} reviewNote={offer?.reviewNote ?? null} /> : null}
          {sel ? (
            <Fieldset legend={t('Portion')}>
              <div className="grid gap-2 sm:grid-cols-3">
                {pp.portions.map((p) => <OptionCard key={p} name="portion" value={p} checked={portion === p} onChange={() => setPortion(p)} title={t(portionLabel(p))} description={p === ev.portion.suggested ? t('Suggested') : undefined} />)}
              </div>
              <FieldError name="portion" />
            </Fieldset>
          ) : null}
          {needNote ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cf-note">{t('Admin review note (required)')}</Label>
              <Textarea id="cf-note" name="reviewNote" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} aria-describedby="cf-note-hint" placeholder={t('e.g. Prepare minced and moist (IDDSI Level 5); sauce served separately.')} />
              <span id="cf-note-hint" className="text-sm text-muted-foreground">{t('Shown to the kitchen with this tray.')}</span>
              <FieldError name="reviewNote" />
            </div>
          ) : null}
          {a.replace ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cf-reason">{t('Reason for replacing (the kitchen sees it)')}</Label>
              <Input id="cf-reason" name="reason" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('e.g. Patient asked for something less spicy')} />
              <FieldError name="reason" />
            </div>
          ) : null}
          <FormMessage message={formError} />
        </form>
      </FormErrors>
    </Modal>
  );
}

// ------------------------------------------------------------------ record the patient's choice
export function SelectDialog({ a, open, finalFocus }: DialogProps<'select'>) {
  const { t, lang } = useT();
  const c = usePatient();
  const per = usePer(a.period);
  const offers: any[] = per?.entry?.offers ?? [];
  const [mealId, setMealId] = React.useState<string>(offers[0]?.mealId ?? '');
  const { busy, formError, run } = useSubmit();
  if (!per) return null;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await apiSend('POST', P(c.id, '/select'), { date: c.date, period: a.period, mealId });
      await c.refresh();
      c.close();
      toast(t('Choice recorded. Confirm it to send it to the kitchen.'));
    });
  };
  return (
    <Modal open={open} onClose={c.close} finalFocus={finalFocus} title={t('Record the patient’s {period} choice', { period: lang === 'ar' ? t(per.label) : per.label.toLowerCase() })}
      description={t('Use this when the patient tells you their choice in person. It’s saved under your name as chosen with the patient; confirm it afterwards.')}
      footer={<Footer form="sl-form" busy={busy} label="Record choice" />}>
      <form id="sl-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Fieldset legend={t('The patient chose')}>
          <div className="grid gap-2">
            {offers.map((o) => <OptionCard key={o.mealId} name="mealId" value={o.mealId} checked={mealId === o.mealId} onChange={() => setMealId(o.mealId)} title={t(o.mealName)} description={o.portions.map((x: string) => t(portionLabel(x))).join(' / ')} />)}
          </div>
        </Fieldset>
        <FormMessage message={formError} />
      </form>
    </Modal>
  );
}

// ------------------------------------------------------------------ reason (cancel, keep, mark reviewed, discharge)
export function ReasonDialog({ a, open, finalFocus }: DialogProps<'reason'>) {
  const { t } = useT();
  const c = usePatient();
  const [note, setNote] = React.useState('');
  const { busy, errors, formError, run } = useSubmit();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await a.onSubmit(note);
      await c.refresh();
      c.close();
    });
  };
  return (
    <Modal open={open} onClose={c.close} finalFocus={finalFocus} title={t(a.title)} footer={<Footer form="rs-form" busy={busy} label={a.button} danger={a.danger} />}>
      <div className="text-[.95rem]">{typeof a.intro === 'string' ? t(a.intro) : a.intro}</div>
      <FormErrors errors={errors}>
        <form id="rs-form" onSubmit={submit} noValidate className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rs-note">{t(a.label)}</Label>
            <Textarea id="rs-note" name="note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder={a.placeholder ? t(a.placeholder) : undefined} />
            <FieldError name="note" />
            <FieldError name="reason" />
          </div>
          <FormMessage message={formError} />
        </form>
      </FormErrors>
    </Modal>
  );
}

// ------------------------------------------------------------------ review a held meal
export function HoldDialog({ a, open, finalFocus }: DialogProps<'hold'>) {
  const { t, lang } = useT();
  const c = usePatient();
  const per = usePer(a.period);
  if (!per?.entry) return null;
  const e = per.entry;
  const isAdmin = c.can('meal:approve-review');
  const decide = (d: 'replace' | 'reoffer' | 'keep' | 'cancel') => {
    if (d === 'replace') c.open({ kind: 'confirm', period: a.period, replace: false });
    else if (d === 'reoffer') c.open({ kind: 'offer', period: a.period });
    else if (d === 'cancel') c.open(cancelDialog(c, a.period, t));
    else c.open({
      kind: 'reason', title: t('Keep the held meal'),
      intro: t(isAdmin ? 'If the meal now needs admin review, your note is required and is shown to the kitchen.' : 'This works only if the meal passes screening again. Otherwise an admin must review it.'),
      label: t(isAdmin ? 'Review note' : 'Note (optional)'), button: t('Keep this meal'),
      onSubmit: async (note) => { await apiSend('POST', P(c.id, '/review'), { date: c.date, period: a.period, action: 'keep', note }); toast(t('Meal kept and released from hold.')); },
    });
  };
  const options: [Parameters<typeof decide>[0], React.ComponentType<{ 'aria-hidden'?: boolean; className?: string }>, string, string, string][] = [
    ['replace', RefreshCw, 'Replace with another meal', 'Choose a meal that passes screening now and confirm it.', 'meal:confirm'],
    ['reoffer', List, 'Offer new options', 'Let the patient choose again from approved options.', 'meal:offer'],
    ['keep', Check, 'Keep this meal', 'Only if it passes screening again, or (admin) after review with a note.', 'meal:resolve-hold'],
    ['cancel', X, 'Cancel this meal', 'No meal for this period; give a reason.', 'meal:cancel'],
  ];
  return (
    <Modal open={open} onClose={c.close} wide finalFocus={finalFocus} title={t('Review flagged {period}', { period: lang === 'ar' ? t(per.label) : per.label.toLowerCase() })}
      footer={<Button variant="outline" onClick={c.close}>{t('Close')}</Button>}>
      <ChangesBlock per={per} />
      {lang === 'ar'
        ? <p><b>{e.mealName ? t(e.mealName) : t('No meal chosen')}</b>{e.portion ? ` · ${t('{portion} portion', { portion: t(portionLabel(e.portion)) })}` : ''} · {t('was {status} before the hold.', { status: t(e.holdFrom) })}</p>
        : <p><b>{e.mealName ?? 'No meal chosen'}</b>{e.portion ? ` · ${portionLabel(e.portion)} portion` : ''} · was <b>{e.holdFrom}</b> before the hold.</p>}
      <p className="text-sm">{t('Choose one. Every option is recorded with your name.')} {e.holdFrom === 'prepared' || e.holdFrom === 'confirmed' ? t('The kitchen sees the outcome and acknowledges it, so only one version is prepared or delivered.') : ''}</p>
      <div role="group" aria-label={t('Decision')} className="grid gap-2.5 sm:grid-cols-2">
        {options.filter((o) => c.can(o[4])).map(([d, Icon, title, text]) => (
          <button key={d} type="button" onClick={() => decide(d)}
            className={cn('flex min-h-11 flex-col items-start gap-1 rounded-[14px] border-[1.5px] border-border bg-card p-3.5 text-start hover:border-primary focus-visible:border-primary', d === 'cancel' && 'hover:border-destructive')}>
            <span className="inline-flex items-center gap-2 font-display font-semibold text-heading"><Icon className="size-4" aria-hidden />{t(title)}</span>
            <span className="text-sm text-muted-foreground">{t(text)}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
