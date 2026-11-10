'use client';
// Dialogs of the health space: add a reading, set targets, edit "about me".
import * as React from 'react';
import { useSWRConfig } from 'swr';
import { apiSend, ApiError } from '@/lib/api-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input, NativeSelect } from '@/components/ui/input';
import { Field, OptionCard } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { FormMessage } from '@/components/staff/ui';
import { useT } from '@/components/site/lang';
import { tMsg } from '@/components/diary/types';
import { H, fmtNum, SourceNote } from './common';

/* eslint-disable @typescript-eslint/no-explicit-any */

function useSubmit(who: string, onDone: () => void) {
  const { t, lang } = useT();
  const { mutate } = useSWRConfig();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const run = async (method: 'POST' | 'PATCH' | 'DELETE', path: string, body: unknown, ok: string) => {
    setBusy(true); setErrors({}); setFormError(null);
    try {
      await apiSend(method, H(who, path), body);
      toast(ok);
      void mutate((k) => typeof k === 'string' && k.startsWith(H(who)));
      onDone();
    } catch (e) {
      const ae = e as ApiError;
      setErrors(ae.errors ?? {});
      setFormError(ae.message ?? 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  };
  const reset = () => { setErrors({}); setFormError(null); };
  /** A field's error in the page language (undefined when there is none). */
  const err = (k: string) => tMsg(t, lang, errors[k]) || undefined;
  return { errors, err, formError: formError && tMsg(t, lang, formError), busy, run, reset };
}

const today = () => new Date().toISOString().slice(0, 10);

export function ReadingDialog({ who, open, onClose, types, contexts, initialType = 'weight' }: { who: string; open: boolean; onClose: () => void; types: any[]; contexts: any[]; initialType?: string }) {
  const { t: tr } = useT();
  const [type, setType] = React.useState(initialType);
  const [unit, setUnit] = React.useState('mg/dL');
  const s = useSubmit(who, onClose);
  React.useEffect(() => { if (open) { setType(initialType); s.reset(); } }, [open, initialType]); // eslint-disable-line react-hooks/exhaustive-deps
  const t = types.find((x) => x.id === type) ?? types[0];
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    void s.run('POST', '/readings', { ...f, type, unit: type === 'glucose' ? unit : undefined }, tr('{type} saved.', { type: tr(t.label) }));
  };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tr('Add a reading')}</DialogTitle>
          <DialogDescription>{tr('We keep readings as a history only. CareBite doesn’t interpret blood pressure or blood sugar, so talk to your healthcare professional about them.')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate>
          <DialogBody className="flex flex-col gap-4">
            <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <legend className="mb-2 text-sm font-semibold text-heading">{tr('What did you measure?')}</legend>
              {types.map((x) => <OptionCard key={x.id} name="rtype" value={x.id} checked={type === x.id} onChange={() => setType(x.id)} title={tr(x.label)} />)}
            </fieldset>
            {type === 'bp' ? (
              <div className="grid grid-cols-2 gap-3">
                <Field id="r-v" label={tr('Upper number')} hint={tr('Systolic, mmHg')} error={s.err('value')}><Input name="value" inputMode="numeric" type="number" min={50} max={260} required /></Field>
                <Field id="r-v2" label={tr('Lower number')} hint={tr('Diastolic, mmHg')} error={s.err('value2')}><Input name="value2" inputMode="numeric" type="number" min={30} max={160} required /></Field>
              </div>
            ) : (
              <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                <Field id="r-v" label={tr(t.label)} error={s.err('value')}><Input name="value" inputMode="decimal" type="number" step={t.step} required /></Field>
                {type === 'glucose' ? (
                  <Field id="r-unit" label={tr('Unit')}><NativeSelect value={unit} onChange={(e) => setUnit(e.target.value)}>{t.units.map((u: string) => <option key={u} value={u}>{tr(u)}</option>)}</NativeSelect></Field>
                ) : <span className="pb-3 text-sm text-muted-foreground">{tr(t.unit)}</span>}
              </div>
            )}
            {type === 'glucose' ? (
              <Field id="r-ctx" label={tr('When')} optional error={s.err('context')}>
                <NativeSelect name="context" defaultValue="">{[<option key="" value="">{tr('Choose…')}</option>, ...contexts.map((c) => <option key={c.id} value={c.id}>{tr(c.label)}</option>)]}</NativeSelect>
              </Field>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <Field id="r-date" label={tr('Date')} error={s.err('date')}><Input name="date" type="date" defaultValue={today()} max={today()} /></Field>
              <Field id="r-time" label={tr('Time')} optional><Input name="time" type="time" /></Field>
            </div>
            <FormMessage message={s.formError} />
          </DialogBody>
          <DialogFooter>
            <DialogClose className={buttonVariants({ variant: 'outline' })}>{tr('Cancel')}</DialogClose>
            <Button type="submit" disabled={s.busy}>{s.busy ? tr('Saving…') : tr('Save reading')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const TARGET_HINT: Record<string, string> = {
  kcal: 'From the Ministry of Health calculator, or the meal plan you follow.',
  carbs: 'From the closest Ministry of Health meal plan.', protein: 'From the closest Ministry of Health meal plan.', fat: 'From the closest Ministry of Health meal plan.',
  sugar: 'Ministry of Health: no more than 6 teaspoons of added sugar a day.', sodium: 'Ministry of Health and SFDA: no more than 2,000 mg sodium (5 g salt) a day.',
};

export function TargetsDialog({ who, open, onClose, fields, targets, suggested, careTeam }: { who: string; open: boolean; onClose: () => void; fields: any[]; targets: any; suggested: any; careTeam: boolean }) {
  const { t } = useT();
  const s = useSubmit(who, onClose);
  const [vals, setVals] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    if (open) { s.reset(); setVals(Object.fromEntries(fields.map((f) => [f.key, targets?.[f.key] != null ? String(targets[f.key]) : '']))); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const useSuggested = () => setVals((v) => ({ ...v, ...Object.fromEntries(['kcal', 'carbs', 'protein', 'fat', 'sodium'].filter((k) => suggested?.[k] != null).map((k) => [k, String(suggested[k])])) }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void s.run('POST', '/targets', { targets: vals }, t('Targets saved.'));
  };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{careTeam ? t('Set nutrition targets') : t('My daily targets')}</DialogTitle>
          <DialogDescription>{careTeam ? t('Care-team targets are shown to the patient and used for daily totals.') : t('These are personal estimates, not a prescription. Leave a box empty if you don’t want to track it.')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate>
          <DialogBody className="flex flex-col gap-4">
            {suggested ? (
              <Notice tone="info" title={t('Ministry of Health suggestion: about {n} kcal a day', { n: fmtNum(suggested.kcal) })}>
                <p>{t('Carbs {carbs} g · protein {protein} g · fat {fat} g (Ministry of Health {plan} kcal meal plan) · sodium {sodium} mg.', { carbs: suggested.carbs, protein: suggested.protein, fat: suggested.fat, plan: suggested.planKcal, sodium: suggested.sodium })}</p>
                <p className="mt-1">{t('To lose weight, the Ministry of Health advises eating fewer calories than you use and losing ½–1 kg a week. Agree on a lower target with a healthcare professional.')}</p>
                <Button size="sm" variant="secondary" className="mt-2" onClick={useSuggested}>{t('Use these values')}</Button>
              </Notice>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <Field key={f.key} id={`t-${f.key}`} label={`${t(f.label)} (${t(f.unit)})`} optional hint={TARGET_HINT[f.key] ? t(TARGET_HINT[f.key]) : undefined} error={s.err(f.key)}>
                  <Input inputMode="numeric" type="number" min={f.min} max={f.max} value={vals[f.key] ?? ''} onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))} />
                </Field>
              ))}
            </div>
            <SourceNote>{t('Ministry of Health calorie calculator and Calorie Guide for Weight Loss; Ministry of Health and SFDA salt guidance.')}</SourceNote>
            <FormMessage message={s.formError} />
          </DialogBody>
          <DialogFooter>
            <DialogClose className={buttonVariants({ variant: 'outline' })}>{t('Cancel')}</DialogClose>
            <Button type="submit" disabled={s.busy}>{s.busy ? t('Saving…') : t('Save targets')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AboutDialog({ who, open, onClose, about, member, conditions, allergies, activityLevels, vocab }: {
  who: string; open: boolean; onClose: () => void; about: any; member: boolean; conditions: string[]; allergies: string[]; activityLevels: any[]; vocab: { conditions: any[]; allergens: any[] };
}) {
  const { t } = useT();
  const s = useSubmit(who, onClose);
  const [conds, setConds] = React.useState<string[]>(conditions);
  const [alls, setAlls] = React.useState<string[]>(allergies);
  React.useEffect(() => { if (open) { s.reset(); setConds(conditions); setAlls(allergies); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const body: any = { about: { sex: f.sex, age: f.age, heightCm: f.heightCm, activity: f.activity, goal: f.goal, pregnant: f.pregnant === 'on' } };
    if (member) { body.conditions = conds.filter((c) => c !== 'none'); body.allergies = alls; }
    void s.run('PATCH', '/profile', body, t('Details saved.'));
  };
  const memberConditions = vocab.conditions.filter((c) => ['obesity', 't2d', 't1d', 'hypertension', 'cvd', 'cholesterol', 'kidney', 'coeliac'].includes(c.id));
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('About me')}</DialogTitle>
          <DialogDescription>{member ? t('We use these to estimate your calories and to leave out meal ideas with your allergens. Everything is optional.') : t('We use these to estimate calories. Everything is optional.')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate>
          <DialogBody className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field id="a-sex" label={t('Sex')} hint={t('The Ministry of Health formula uses this')} error={s.err('sex')}>
                <NativeSelect name="sex" defaultValue={about.sex ?? ''}><option value="">{t('Choose…')}</option><option value="female">{t('Female')}</option><option value="male">{t('Male')}</option></NativeSelect>
              </Field>
              <Field id="a-age" label={t('Age')} error={s.err('age')}><Input name="age" type="number" inputMode="numeric" min={1} max={120} defaultValue={about.age ?? ''} /></Field>
              <Field id="a-h" label={t('Height (cm)')} error={s.err('heightCm')}><Input name="heightCm" type="number" inputMode="decimal" step={0.5} defaultValue={about.heightCm ?? ''} /></Field>
              <Field id="a-act" label={t('Activity')} error={s.err('activity')}>
                <NativeSelect name="activity" defaultValue={about.activity ?? ''}><option value="">{t('Choose…')}</option>{activityLevels.map((l) => <option key={l.id} value={l.id}>{t(l.label)} · {t(l.hint)}</option>)}</NativeSelect>
              </Field>
            </div>
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="pregnant" defaultChecked={Boolean(about.pregnant)} className="size-5 accent-[var(--color-primary)]" />{t('Pregnant or breastfeeding')}</label>
            <Field id="a-goal" label={t('One goal I am working on')} optional><Input name="goal" maxLength={200} defaultValue={about.goal ?? ''} placeholder={t('For example: walk 30 minutes after dinner')} /></Field>
            {member ? (
              <>
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-sm font-semibold text-heading">{t('Conditions diagnosed by a healthcare professional')}</legend>
                  <div className="grid grid-cols-2 gap-2">{memberConditions.map((c) => <OptionCard key={c.id} type="checkbox" name="cond" value={c.id} checked={conds.includes(c.id)} onChange={() => toggle(conds, setConds, c.id)} title={t(c.label)} />)}</div>
                </fieldset>
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-sm font-semibold text-heading">{t('Food allergies (the 14 SFDA allergens)')}</legend>
                  <div className="grid grid-cols-2 gap-2">{vocab.allergens.map((a) => <OptionCard key={a.id} type="checkbox" name="alg" value={a.id} checked={alls.includes(a.id)} onChange={() => toggle(alls, setAlls, a.id)} title={t(a.label)} />)}</div>
                </fieldset>
              </>
            ) : <Notice tone="info">{t('Your conditions and allergies are kept by your hospital care team. Use “Report a change” in My Food Profile if something is wrong.')}</Notice>}
            <FormMessage message={s.formError} />
          </DialogBody>
          <DialogFooter>
            <DialogClose className={buttonVariants({ variant: 'outline' })}>{t('Cancel')}</DialogClose>
            <Button type="submit" disabled={s.busy}>{s.busy ? t('Saving…') : t('Save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
