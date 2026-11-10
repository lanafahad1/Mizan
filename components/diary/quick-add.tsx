'use client';
import * as React from 'react';
import { Zap } from 'lucide-react';
import { apiSend, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { useT } from '@/components/site/lang';
import { MEAL_LABELS, mealIn, tMsg, type MealId } from './types';

const OPTIONAL = [
  { key: 'carbs', label: 'Carbs (g)' },
  { key: 'protein', label: 'Protein (g)' },
  { key: 'fat', label: 'Fat (g)' },
  { key: 'sugar', label: 'Sugar (g)' },
  { key: 'sodium', label: 'Sodium (mg)' },
] as const;

/** Quick add: the person types the calories (and macros if they know them). Marked "Your entry". */
export function QuickAdd({ date, meal, onAdded }: { date: string; meal: MealId; onAdded: (name: string) => void }) {
  const { t, lang } = useT();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const err = (k: string) => tMsg(t, lang, errors[k]) || undefined;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') ?? '').trim();
    const values: Record<string, string> = {};
    for (const k of ['kcal', ...OPTIONAL.map((o) => o.key)]) { const v = String(fd.get(k) ?? '').trim(); if (v) values[k] = v; }
    setErrors({}); setFormError(null);
    if (!values.kcal) { setErrors({ kcal: 'Enter the calories.' }); return; }
    setBusy(true);
    try {
      await apiSend('POST', '/api/health/me/diary', { date, meal, quick: true, name, values });
      onAdded(name || 'Quick add');
    } catch (err) {
      const ae = err as ApiError;
      setErrors(ae.errors ?? {});
      setFormError(ae.message);
    } finally { setBusy(false); }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t('Know the calories but can’t find the food? Type them in here. We save it as your own estimate.')}</p>
      <Field id="qa-name" label={t('What did you eat?')} optional>
        <Input name="name" maxLength={80} placeholder={t('e.g. Coffee with milk')} autoComplete="off" />
      </Field>
      <Field id="qa-kcal" label={t('Calories (kcal)')} error={err('kcal')}>
        <Input name="kcal" type="number" inputMode="numeric" min={0} max={5000} required />
      </Field>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-display text-sm font-medium text-heading">{t('If you know them')} <span className="font-sans text-xs font-normal text-muted-foreground">{t('(optional)')}</span></legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {OPTIONAL.map((o) => (
            <Field key={o.key} id={`qa-${o.key}`} label={t(o.label)} error={err(o.key)}>
              <Input name={o.key} type="number" inputMode="decimal" min={0} step="any" />
            </Field>
          ))}
        </div>
      </fieldset>
      {formError ? <Notice tone="danger">{tMsg(t, lang, formError)}</Notice> : null}
      <Button type="submit" disabled={busy} className="w-full"><Zap aria-hidden />{busy ? t('Adding…') : t('Add to {meal}', { meal: mealIn(meal, MEAL_LABELS[meal], lang) })}</Button>
    </form>
  );
}
