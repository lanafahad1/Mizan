'use client';
import * as React from 'react';
import { Check, Minus, Plus, Scale, Star } from 'lucide-react';
import { apiFetch, apiSend, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input, Label, NativeSelect } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { ArabicName, SourceBadge } from './source-badge';
import { useT } from '@/components/site/lang';
import { allergenNames, fmt, foodName, MEAL_IDS, MEAL_LABELS, mealIn, previewNutrients, servingText, tMsg, type EntryAmount, type Food, type MealId } from './types';

const clampQty = (q: number) => Math.min(20, Math.max(0.25, Math.round(q * 4) / 4));

/**
 * The amount of a chosen food: a portion and how many (in quarter steps), or
 * grams when the food has values per 100 g. Shows a live preview, then adds it.
 */
/** Give it `key={food.id}` so a new food starts fresh. With `onFavorite` a ★ toggle saves it to the person's favourites. */
/**
 * With `edit` it changes an entry already in the diary instead (PATCH: amount
 * and "Move to" another meal) and calls `onSaved`. `onAdded` gets the new
 * amount label when the food was merged into a row that was already there.
 */
export function FoodPicker({ food: initialFood, date, meal, onAdded, favorite = false, onFavorite, edit, onSaved, onCancel }: {
  food: Food; date: string; meal: MealId; onAdded?: (name: string, mergedAmount?: string) => void;
  favorite?: boolean; onFavorite?: (foodId: string, on: boolean) => Promise<void>;
  edit?: { id: string; amount?: EntryAmount | null }; onSaved?: (entry: { amountLabel: string; meal: MealId }) => void; onCancel?: () => void;
}) {
  const { t, lang } = useT();
  const [food, setFood] = React.useState(initialFood);
  const byGramsAllowed = Boolean(food.per100g);
  const start = edit?.amount;
  const [mode, setMode] = React.useState<'portion' | 'grams'>(start?.grams != null && initialFood.per100g ? 'grams' : 'portion');
  const [servingIndex, setServingIndex] = React.useState(start?.servingIndex != null && initialFood.servings[start.servingIndex] ? start.servingIndex : 0);
  const [quantity, setQuantity] = React.useState(start?.quantity ?? 1);
  const [qtyInput, setQtyInput] = React.useState(String(start?.quantity ?? 1));
  const [grams, setGrams] = React.useState(String(start?.grams ?? 100));
  const [toMeal, setToMeal] = React.useState<MealId>(meal);
  const uid = React.useId();
  const fid = (k: string) => (edit ? `${k}-${uid}` : k);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [switching, setSwitching] = React.useState(false);
  const [starBusy, setStarBusy] = React.useState(false);
  // The ★ belongs to the food that was opened (also after switching to grams).
  const starId = initialFood.id;

  async function toggleStar() {
    if (!onFavorite) return;
    setStarBusy(true);
    try { await onFavorite(starId, !favorite); } finally { setStarBusy(false); }
  }

  const g = Number(grams);
  const preview = mode === 'grams' ? previewNutrients(food, { grams: g }) : previewNutrients(food, { servingIndex, quantity });
  const allergens = allergenNames(food.allergens).map((a) => t(a));
  const mealLabel = mealIn(meal, MEAL_LABELS[meal], lang);
  const err = (k: string) => tMsg(t, lang, errors[k]) || undefined;

  function setQty(q: number) { const v = clampQty(q); setQuantity(v); setQtyInput(String(v)); }

  async function useGramsInstead() {
    if (!food.matchFoodId) return;
    setSwitching(true);
    try {
      const f = await apiFetch<Food>(`/api/foods/${encodeURIComponent(food.matchFoodId)}`);
      setFood(f); setMode('grams'); setServingIndex(0); setErrors({}); setFormError(null);
      if (food.approxG) setGrams(String(Math.round(food.approxG)));
    } catch (err) {
      toast(tMsg(t, lang, (err as ApiError).message), { tone: 'error' });
    } finally { setSwitching(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({}); setFormError(null);
    if (mode === 'grams' && !(g >= 1 && g <= 3000)) { setErrors({ grams: 'Enter 1–3,000 g.' }); return; }
    setBusy(true);
    try {
      if (edit) {
        const amount = mode === 'grams' ? { grams: g } : { servingIndex, quantity };
        const res = await apiSend<{ amountLabel: string; meal: MealId }>('PATCH', `/api/health/me/diary/${encodeURIComponent(edit.id)}`, { ...amount, ...(toMeal !== meal ? { meal: toMeal } : {}) });
        onSaved?.(res);
        return;
      }
      const body = mode === 'grams' ? { date, meal, foodId: food.id, grams: g } : { date, meal, foodId: food.id, servingIndex, quantity };
      const res = await apiSend<{ amountLabel?: string; amount?: EntryAmount | null }>('POST', '/api/health/me/diary', body);
      // Adding the same food again to the same meal merges it into the row that was there (the amounts are summed).
      const merged = mode === 'grams' ? (res?.amount?.grams ?? g) > g + 0.05 : (res?.amount?.quantity ?? quantity) > quantity;
      onAdded?.(foodName(food, lang), merged ? res.amountLabel : undefined);
    } catch (err) {
      const ae = err as ApiError;
      if (Object.keys(ae.errors ?? {}).length) setErrors(ae.errors);
      setFormError(ae.message);
    } finally { setBusy(false); }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      {edit ? null : <div className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 dir="auto" className={cn('text-lg leading-snug', lang === 'ar' ? 'text-right' : 'text-left')}>{foodName(food, lang)}</h3>
          {onFavorite ? (
            <Button variant="ghost" size="sm" onClick={toggleStar} disabled={starBusy} className="-me-2 -mt-1 min-h-11 shrink-0">
              <Star aria-hidden className={cn(favorite ? 'fill-current text-rose-ink' : 'text-heading')} />
              {favorite ? t('In favourites') : t('Add to favourites')}
            </Button>
          ) : null}
        </div>
        {food.brand || food.nameAr ? (
          <p className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
            {food.brand ? <bdi dir="auto">{food.brand}</bdi> : null}
            {lang === 'ar' ? (food.nameAr ? <bdi dir="ltr" lang="en">{food.name}</bdi> : null) : <ArabicName>{food.nameAr}</ArabicName>}
          </p>
        ) : null}
        <div><SourceBadge basis={food.basis} sourceId={food.sourceId} /></div>
        {allergens.length ? (
          <p className="text-sm"><b className="font-semibold">{t('Contains:')}</b> {allergens.join(lang === 'ar' ? '، ' : ', ')}{food.allergensDerived ? ` ${t('(worked out from the recipe, please check)')}` : ''}</p>
        ) : null}
      </div>}

      {byGramsAllowed ? (
        <div role="radiogroup" aria-label={t('How to enter the amount')} className="grid grid-cols-2 gap-1 rounded-full bg-blush p-1">
          {(['portion', 'grams'] as const).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
              className={cn('min-h-10 rounded-full font-display text-sm font-medium text-heading', mode === m ? 'bg-card shadow-soft' : 'hover:bg-rose')}>
              {m === 'portion' ? t('Portion') : t('Grams')}
            </button>
          ))}
        </div>
      ) : null}

      {mode === 'portion' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <Field id={fid('fp-serving')} label={t('Portion')} error={err('servingIndex')}>
            <NativeSelect value={servingIndex} onChange={(e) => setServingIndex(Number(e.target.value))} disabled={food.servings.length < 2}>
              {food.servings.map((s, i) => <option key={i} value={i}>{servingText(s.display, t, lang, s.labelAr)}</option>)}
            </NativeSelect>
          </Field>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fid('fp-qty')}>{t('How many')}</Label>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="size-11" aria-label={t('A quarter less')} onClick={() => setQty(quantity - 0.25)} disabled={quantity <= 0.25}><Minus aria-hidden /></Button>
              <Input id={fid('fp-qty')} inputMode="decimal" className="w-20 text-center tabular" value={qtyInput}
                aria-invalid={errors.quantity ? true : undefined} aria-describedby={errors.quantity ? fid('fp-qty-error') : undefined}
                onChange={(e) => { setQtyInput(e.target.value); const v = Number(e.target.value); if (v > 0) setQuantity(Math.min(20, v)); }}
                onBlur={() => setQty(quantity)} />
              <Button variant="outline" size="icon" className="size-11" aria-label={t('A quarter more')} onClick={() => setQty(quantity + 0.25)} disabled={quantity >= 20}><Plus aria-hidden /></Button>
            </div>
            {errors.quantity ? <p id={fid('fp-qty-error')} role="alert" className="text-sm font-semibold text-destructive">{err('quantity')}</p> : null}
          </div>
        </div>
      ) : (
        <Field id={fid('fp-grams')} label={t('Amount in grams')} error={err('grams')} hint={t('1 to 3,000 g')}>
          <Input type="number" inputMode="decimal" min={1} max={3000} step="any" value={grams} onChange={(e) => setGrams(e.target.value)} />
        </Field>
      )}

      {edit ? (
        <Field id={fid('fp-meal')} label={t('Move to…')}>
          <NativeSelect value={toMeal} onChange={(e) => setToMeal(e.target.value as MealId)}>
            {MEAL_IDS.map((m) => <option key={m} value={m}>{t(MEAL_LABELS[m])}</option>)}
          </NativeSelect>
        </Field>
      ) : null}

      {!byGramsAllowed && !edit ? (
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>{t('The Ministry of Health gives values for this portion only, so you log it by portion.')}</p>
          {food.matchFoodId ? (
            <Button variant="outline" size="sm" className="w-fit" onClick={useGramsInstead} disabled={switching}>
              <Scale aria-hidden />{switching ? t('Opening…') : t('Log by grams instead')}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div aria-live="polite" className="rounded-[16px] border border-sage bg-mint px-4 py-3">
        <p className="sr-only">{t('This amount gives:')}</p>
        <dl className="grid grid-cols-4 gap-2 text-center">
          {(['kcal', 'carbs', 'protein', 'fat'] as const).map((k) => (
            <div key={k} className="flex flex-col">
              <dt className="order-2 text-xs text-sage-deep">{k === 'kcal' ? t('kcal') : t(`${k === 'carbs' ? 'Carbs' : k === 'protein' ? 'Protein' : 'Fat'} (g)`)}</dt>
              <dd className="order-1 font-display text-lg font-semibold text-heading tabular">{preview ? fmt(preview[k], k) : '—'}</dd>
            </div>
          ))}
        </dl>
      </div>

      {food.checkLabel ? <p className="text-sm text-muted-foreground">{t('These values come from a pack label or community data, so check the pack.')}</p> : null}
      {formError ? <Notice tone="danger">{tMsg(t, lang, formError)}</Notice> : null}

      {edit ? (
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy || !preview} className="min-w-0 flex-1"><Check aria-hidden />{busy ? t('Saving…') : t('Save')}</Button>
          {onCancel ? <Button variant="outline" onClick={onCancel} disabled={busy}>{t('Cancel')}</Button> : null}
        </div>
      ) : (
        <Button type="submit" disabled={busy || !preview} className="w-full"><Plus aria-hidden />{busy ? t('Adding…') : t('Add to {meal}', { meal: mealLabel })}</Button>
      )}
    </form>
  );
}
