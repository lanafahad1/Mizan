'use client';
import * as React from 'react';
import { Save } from 'lucide-react';
import { apiSend, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { foodName, tMsg, type Food, type LabelDraft, type NutrientKey } from './types';

const VALUES: { key: NutrientKey; label: string; required?: boolean; mg?: boolean }[] = [
  { key: 'kcal', label: 'Energy (kcal)', required: true },
  { key: 'protein', label: 'Protein (g)', required: true },
  { key: 'carbs', label: 'Carbohydrate (g)', required: true },
  { key: 'fat', label: 'Fat (g)', required: true },
  { key: 'sugar', label: 'Sugars (g)' },
  { key: 'satFat', label: 'Saturated fat (g)' },
  { key: 'fiber', label: 'Fibre (g)' },
  { key: 'sodium', label: 'Sodium (mg)', mg: true },
];

/**
 * Add a packaged food from its nutrition label. It becomes the person's own
 * food ("custom-<n>"), which they can then log by portion or grams.
 */
export function LabelFoodForm({ draft, onSaved, editId }: { draft?: LabelDraft | null; onSaved: (food: Food) => void; /** Change this saved food (PATCH) instead of adding a new one. */ editId?: string }) {
  const { t, lang } = useT();
  const [per, setPer] = React.useState<'per100g' | 'perServing'>('per100g');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const fromOnline = Boolean(draft?.fromOnline);
  const err = (k: string) => tMsg(t, lang, errors[k]) || undefined;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? '').trim();
    const values: Record<string, string> = {};
    for (const v of VALUES) { const x = get(v.key); if (x) values[v.key] = x; }
    const body: Record<string, unknown> = {
      name: get('name'), brand: get('brand') || undefined, barcode: get('barcode') || undefined,
      servingG: get('servingG') || undefined, [per]: values,
      ...(fromOnline ? { origin: 'OFF' } : {}),
    };
    setErrors({}); setFormError(null); setBusy(true);
    try {
      const food = editId
        ? await apiSend<Food & { warnings?: string[] }>('PATCH', `/api/health/me/foods/${encodeURIComponent(editId)}`, body)
        : await apiSend<Food & { warnings?: string[] }>('POST', '/api/health/me/foods', body);
      for (const w of food.warnings ?? []) toast(tMsg(t, lang, w), { tone: 'warn', timeout: 9000 });
      toast(editId ? t('Saved the changes to {name}.', { name: foodName(food, lang) }) : t('Saved {name} to your foods.', { name: foodName(food, lang) }));
      onSaved(food);
    } catch (err) {
      const ae = err as ApiError;
      setErrors(ae.errors ?? {});
      setFormError(ae.errors?.values ?? ae.message);
    } finally { setBusy(false); }
  }

  const v = draft?.per100g ?? {};
  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      {fromOnline ? (
        <Notice tone="warn" title={t('From Open Food Facts — check the label')}>
          {t('These are community values. Compare them with the pack before you save.')}
        </Notice>
      ) : editId ? (
        <p className="text-sm text-muted-foreground">{t('The values are shown per 100 g. Change what differs from the pack.')}</p>
      ) : (
        <p className="text-sm text-muted-foreground">{t('Copy the numbers from the nutrition table on the pack. We save it as one of your foods.')}</p>
      )}
      <Field id="lf-name" label={t('Product name')} error={err('name')}>
        <Input name="name" defaultValue={draft?.name ?? ''} maxLength={120} autoComplete="off" />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="lf-brand" label={t('Brand')} optional>
          <Input name="brand" defaultValue={draft?.brand ?? ''} maxLength={80} autoComplete="off" />
        </Field>
        <Field id="lf-barcode" label={t('Barcode')} optional error={err('barcode')}>
          <Input name="barcode" defaultValue={draft?.barcode ?? ''} inputMode="numeric" pattern="[0-9]*" maxLength={14} autoComplete="off" />
        </Field>
      </div>
      <Field id="lf-serving" label={t('Serving size (g)')} optional={per === 'per100g'} error={err('servingG')} hint={t('As printed on the pack, e.g. 30 g')}>
        <Input name="servingG" type="number" inputMode="decimal" min={1} max={5000} step="any" defaultValue={draft?.servingG ?? ''} />
      </Field>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-display text-sm font-medium text-heading">{t('Values on the label')}</legend>
        <div role="radiogroup" aria-label={t('The label gives values')} className="grid grid-cols-2 gap-1 rounded-full bg-blush p-1">
          {(['per100g', 'perServing'] as const).map((p) => (
            <button key={p} type="button" role="radio" aria-checked={per === p} onClick={() => setPer(p)}
              className={cn('min-h-10 rounded-full font-display text-sm font-medium text-heading', per === p ? 'bg-card shadow-soft' : 'hover:bg-rose')}>
              {p === 'per100g' ? t('Per 100 g') : t('Per serving')}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {VALUES.map((x) => (
            <Field key={x.key} id={`lf-${x.key}`} label={t(x.label)} optional={!x.required} error={err(x.key)}>
              <Input name={x.key} type="number" inputMode="decimal" min={0} step="any" defaultValue={v[x.key] ?? ''} />
            </Field>
          ))}
        </div>
      </fieldset>
      {formError ? <Notice tone="danger">{tMsg(t, lang, formError)}</Notice> : null}
      <Button type="submit" disabled={busy} className="w-full"><Save aria-hidden />{busy ? t('Saving…') : editId ? t('Save changes') : fromOnline ? t('Save to my foods') : t('Save food')}</Button>
    </form>
  );
}

/** Pre-fill the label form from a saved food (its values are stored per 100 g). */
export function draftFromFood(food: Food): LabelDraft {
  const serving = food.servings.find((x) => x.g != null && !/^100 g$/.test(x.label));
  return { name: food.name, brand: food.brand, barcode: food.barcode, servingG: serving?.g ?? null, per100g: food.per100g ?? undefined };
}
