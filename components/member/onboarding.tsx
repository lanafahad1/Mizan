'use client';
// A friendly 3-step welcome on Home for new members (not a blocking modal):
// 1 About you → 2 Your daily target (MOH estimate) → 3 Done. "Later" hides it on
// this device (localStorage, wrapped in try/catch).
import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Utensils } from 'lucide-react';
import { apiSend, apiFetch, ApiError } from '@/lib/api-client';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, OptionCard } from '@/components/ui/field';
import { Input, NativeSelect } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { Illustration } from '@/components/illustrations/illustration';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { tMsg } from '@/components/diary/types';
import { useRefreshHealth, n0, OVERVIEW_KEY } from './daily';

/* eslint-disable @typescript-eslint/no-explicit-any */

const KEY = 'carebite-welcome';
export function welcomeHidden(): boolean {
  try { return Boolean(window.localStorage.getItem(KEY)); } catch { return false; }
}
function hideWelcome(value: 'skipped' | 'done') {
  try { window.localStorage.setItem(KEY, value); } catch { /* storage blocked: the card simply shows again next time */ }
}

type Level = { id: string; label: string; hint: string };

export function WelcomeCard({ overview, activityLevels, firstMealHref, onClose }: { overview: any; activityLevels: Level[]; firstMealHref: string; onClose: () => void }) {
  const { t, lang } = useT();
  const refresh = useRefreshHealth();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [busy, setBusy] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [o, setO] = React.useState<any>(overview);
  const [own, setOwn] = React.useState(false);
  const about = o.profile?.about ?? {};
  const [sex, setSex] = React.useState<string>(about.sex ?? '');
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => { if (step > 1) headingRef.current?.focus(); }, [step]);

  const later = () => { hideWelcome('skipped'); onClose(); };
  const fail = (err: unknown) => {
    if (err instanceof ApiError) { setErrors(err.errors ?? {}); setFormError(Object.keys(err.errors ?? {}).length ? null : tMsg(t, lang, err.message)); }
    else setFormError(t('Something went wrong. Please try again.'));
  };

  const saveAbout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const errs: Record<string, string> = {};
    if (!sex) errs.sex = 'Choose male or female.';
    if (!f.age) errs.age = 'Enter an age in years.';
    if (!f.heightCm) errs.heightCm = 'Enter a height between 100 and 250 cm.';
    if (Object.keys(errs).length) { setErrors(errs); setFormError(null); return; }
    setBusy(true); setErrors({}); setFormError(null);
    try {
      await apiSend('PATCH', '/api/health/me/profile', { about: { sex, age: f.age, heightCm: f.heightCm, activity: f.activity } });
      if (f.weight) {
        try { await apiSend('POST', '/api/health/me/readings', { type: 'weight', value: f.weight }); }
        catch (err) { if (err instanceof ApiError && err.errors?.value) { setErrors({ weight: err.errors.value }); setBusy(false); return; } throw err; }
      }
      const next = await apiFetch<any>(OVERVIEW_KEY);
      setO(next);
      void refresh();
      setStep(2);
    } catch (err) { fail(err); } finally { setBusy(false); }
  };

  const suggested = o.body?.suggested ?? null;
  const saveTarget = async (body: Record<string, number | string>) => {
    setBusy(true); setErrors({}); setFormError(null);
    try {
      await apiSend('POST', '/api/health/me/targets', { targets: body });
      void refresh();
      toast(t('Daily target saved.'));
      setStep(3);
    } catch (err) { fail(err); } finally { setBusy(false); }
  };
  const saveOwn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const kcal = String(new FormData(e.currentTarget).get('kcal') ?? '');
    if (!kcal) { setErrors({ kcal: 'Enter 800–5,000 kcal a day.' }); return; }
    void saveTarget({ kcal });
  };

  const steps = [t('About you'), t('Your daily target'), t('Done')];
  return (
    <section aria-labelledby="welcome-h" className="flex flex-col gap-4 rounded-[24px] border border-rose bg-blush p-4 sm:p-6">
      <div className="flex items-start gap-4">
        <Illustration name="welcome" className="size-20 max-sm:hidden" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="eyebrow">{t('Welcome to CareBite')}</span>
          <h2 id="welcome-h" ref={headingRef} tabIndex={-1} className="text-xl outline-none sm:text-2xl">
            {step === 1 ? t('Let’s set you up in 3 short steps') : step === 2 ? t('Your daily target') : t('You’re all set')}
          </h2>
          <ol className="m-0 mt-1 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-sm" aria-label={t('Steps')}>
            {steps.map((s, i) => (
              <li key={s} aria-current={step === i + 1 ? 'step' : undefined} className={cn('inline-flex items-center gap-1.5', step === i + 1 ? 'font-bold text-heading' : 'text-muted-foreground')}>
                <span aria-hidden className={cn('grid size-6 place-items-center rounded-full border text-xs', step > i + 1 ? 'border-primary bg-primary text-primary-foreground' : step === i + 1 ? 'border-primary bg-card text-heading' : 'border-border bg-card')}>
                  {step > i + 1 ? <Check className="size-3.5" /> : i + 1}
                </span>
                {s}{step > i + 1 ? <span className="sr-only"> ({t('done')})</span> : null}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={saveAbout} noValidate className="flex flex-col gap-4">
          <p className="m-0 text-sm text-muted-foreground">{t('We use these to estimate your daily calories with the Ministry of Health calculator. Only you can see them.')}</p>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-display text-sm font-medium text-heading">{t('Sex')}</legend>
            <div className="grid grid-cols-2 gap-2">
              <OptionCard name="w-sex" value="female" checked={sex === 'female'} onChange={() => setSex('female')} title={t('Female')} />
              <OptionCard name="w-sex" value="male" checked={sex === 'male'} onChange={() => setSex('male')} title={t('Male')} />
            </div>
            {errors.sex ? <p role="alert" className="m-0 text-sm font-semibold text-destructive">{t(errors.sex)}</p> : null}
          </fieldset>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field id="w-age" label={t('Age')} error={errors.age}><Input name="age" type="number" inputMode="numeric" min={1} max={120} defaultValue={about.age ?? ''} /></Field>
            <Field id="w-h" label={t('Height (cm)')} error={errors.heightCm}><Input name="heightCm" type="number" inputMode="decimal" step={0.5} defaultValue={about.heightCm ?? o.body?.heightCm ?? ''} /></Field>
            <Field id="w-w" label={t('Weight (kg)')} error={errors.weight} optional><Input name="weight" type="number" inputMode="decimal" step={0.1} defaultValue={o.body?.weight?.value ?? ''} /></Field>
            <Field id="w-act" label={t('Activity')} error={errors.activity}>
              <NativeSelect name="activity" defaultValue={about.activity ?? 'light'}>{activityLevels.map((l) => <option key={l.id} value={l.id}>{t(l.label)}</option>)}</NativeSelect>
            </Field>
          </div>
          {formError ? <Notice tone="danger">{formError}</Notice> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <Button variant="ghost" onClick={later}>{t('Later')}</Button>
            <Button type="submit" disabled={busy} className="sm:ms-auto">{busy ? t('Saving…') : t('Next')}<ArrowRight aria-hidden className="rtl:rotate-180" /></Button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-4">
          {suggested?.kcal ? (
            <div className="flex flex-col gap-1 rounded-[16px] border border-border bg-card px-4 py-3">
              <span className="text-sm text-muted-foreground">{t('Your Ministry of Health estimate')}</span>
              <p className="m-0"><b className="font-display text-[1.8rem] font-semibold leading-tight text-heading tabular">{n0(suggested.kcal)}</b> <span className="text-muted-foreground">{t('kcal a day')}</span></p>
              <span className="text-xs text-muted-foreground">{t('Worked out with the Ministry of Health calorie calculator (Mifflin-St Jeor equation) and your activity. A personal estimate, not a prescription.')}</span>
            </div>
          ) : (
            <Notice tone="info">{o.body?.energyNote ? t(o.body.energyNote) : t('Add your weight to see your Ministry of Health estimate, or set your own target.')}</Notice>
          )}
          {own || !suggested?.kcal ? (
            <form onSubmit={saveOwn} noValidate className="flex flex-col gap-3">
              <Field id="w-kcal" label={t('My daily calories (kcal)')} hint={t('800–5,000 kcal a day. You can change it any time in My Health.')} error={errors.kcal}>
                <Input name="kcal" type="number" inputMode="numeric" min={800} max={5000} step={10} defaultValue={suggested?.kcal ?? ''} />
              </Field>
              {formError ? <Notice tone="danger">{formError}</Notice> : null}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                <Button variant="ghost" onClick={later}>{t('Later')}</Button>
                {suggested?.kcal ? <Button variant="outline" onClick={() => setOwn(false)} className="sm:ms-auto">{t('Back to the estimate')}</Button> : null}
                <Button type="submit" disabled={busy} className={suggested?.kcal ? undefined : 'sm:ms-auto'}>{busy ? t('Saving…') : t('Save my target')}</Button>
              </div>
            </form>
          ) : (
            <>
              {formError ? <Notice tone="danger">{formError}</Notice> : null}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                <Button variant="ghost" onClick={later}>{t('Later')}</Button>
                <Button variant="outline" onClick={() => setOwn(true)} className="sm:ms-auto">{t('Set my own')}</Button>
                <Button disabled={busy} onClick={() => void saveTarget({ kcal: suggested.kcal, carbs: suggested.carbs, protein: suggested.protein, fat: suggested.fat, sodium: suggested.sodium })}>
                  {busy ? t('Saving…') : t('Use this target')}
                </Button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-3">
          <p className="m-0">{t('Your details and daily target are saved. Next, add what you eat today to see your day take shape.')}</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <Button variant="ghost" onClick={() => { hideWelcome('done'); onClose(); }}>{t('Close')}</Button>
            <Link href={firstMealHref} onClick={() => hideWelcome('done')} className={cn(buttonVariants(), 'sm:ms-auto')}><Utensils aria-hidden />{t('Add your first meal')}</Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
