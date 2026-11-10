'use client';
import * as React from 'react';
import { ChevronDown, Hospital, Pencil, Plus, Repeat2, Trash2 } from 'lucide-react';
import { apiFetch, apiSend, ApiError } from '@/lib/api-client';
import { NativeSelect, Label } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Illustration } from '@/components/illustrations/illustration';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { ArabicName, SourceBadge } from './source-badge';
import { FoodPicker } from './food-picker';
import { amountText, fmt, foodName, MEAL_IDS, MEAL_LABELS, mealIn, tMsg, withUnit, type DiaryEntry, type DiaryMeal, type Food, type MealId } from './types';

/**
 * One meal of the day: a compact list of its entries (tap one for the details),
 * an "Add" button and, when the meal is empty but the day before had it, a
 * one-tap "Repeat yesterday's …".
 */
export function MealCard({ meal, onAdd, onDelete, onSaved, deleting, repeat }: {
  meal: DiaryMeal; onAdd: () => void; onDelete: (e: DiaryEntry) => void; deleting: string | null;
  /** After "Edit amount" or "Move to…" saved the entry. */
  onSaved: (e: DiaryEntry, changed: { amountLabel: string; meal: MealId }) => void;
  /** Offer to copy the day before's entries for this meal (only when this meal is empty). */
  repeat?: { count: number; busy: boolean; onRepeat: () => void; yesterday: boolean } | null;
}) {
  const { t, lang } = useT();
  const english = MEAL_LABELS[meal.id] ?? meal.label;
  const label = t(english);
  const inSentence = mealIn(meal.id, english.toLowerCase(), lang);
  const headingId = `meal-${meal.id}-h`;
  const empty = meal.entries.length === 0;
  return (
    <section aria-labelledby={headingId} className="flex flex-col rounded-xl border border-border bg-card shadow-soft">
      <header className="flex items-center justify-between gap-3 px-4 pb-1 pt-3 sm:px-5">
        <h2 id={headingId} className="text-lg">{label}</h2>
        <div className="flex items-center gap-2">
          {!empty ? <span className="font-display text-sm font-medium text-heading tabular">{t('{n} kcal', { n: fmt(meal.totals.kcal ?? 0) })}</span> : null}
          <Button variant="outline" size="sm" className="min-h-11 sm:min-h-9" onClick={onAdd}>
            <Plus aria-hidden />{t('Add')}<span className="sr-only"> {t('to {meal}', { meal: inSentence })}</span>
          </Button>
        </div>
      </header>

      {empty ? (
        <div className="flex items-center gap-3 px-4 pb-4 pt-1 sm:px-5">
          <Illustration name="empty-diary" className="size-14" />
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <p className="text-sm text-muted-foreground">{t('Nothing here yet. Add what you had.')}</p>
            {repeat ? (
              <Button variant="secondary" size="sm" className="min-h-11 sm:min-h-9" onClick={repeat.onRepeat} disabled={repeat.busy}>
                <Repeat2 aria-hidden />
                {repeat.busy ? t('Adding…') : repeat.yesterday ? t("Repeat yesterday's {meal}", { meal: inSentence }) : t("Repeat the day before's {meal}", { meal: inSentence })}
                <span className="sr-only"> ({repeat.count === 1 ? t('1 food') : t('{n} foods', { n: repeat.count })})</span>
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <ul className="flex flex-col pb-1.5">
          {meal.entries.map((e) => <EntryRow key={e.id} entry={e} meal={meal.id} onDelete={() => onDelete(e)} onSaved={(c) => onSaved(e, c)} deleting={deleting === e.id} />)}
        </ul>
      )}
    </section>
  );
}

function EntryRow({ entry: e, meal, onDelete, onSaved, deleting }: { entry: DiaryEntry; meal: MealId; onDelete: () => void; onSaved: (c: { amountLabel: string; meal: MealId }) => void; deleting: boolean }) {
  const { t, lang } = useT();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const panelId = `entry-${e.id}-details`;
  const n = e.nutrients ?? {};
  return (
    <li className="border-t border-border">
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}
        className="flex min-h-12 w-full items-center gap-3 px-4 py-2 text-start hover:bg-background focus-visible:bg-background sm:px-5">
        <span className="flex min-w-0 flex-1 flex-col">
          <span dir="auto" className={cn('truncate font-semibold leading-snug text-foreground', lang === 'ar' ? 'text-right' : 'text-left')}>{t(foodName(e, lang))}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[.82rem] leading-snug text-muted-foreground">
            <span className="min-w-0 break-words">{e.brand ? `${e.brand} · ` : ''}{amountText(e.amountLabel, t, lang)}</span>
            {e.hospital ? <Badge variant="mint" className="text-[.72rem]"><Hospital aria-hidden />{t('Hospital meal')}</Badge> : null}
          </span>
        </span>
        <span className="shrink-0 font-display text-sm font-medium text-heading tabular">{n.kcal == null ? '—' : t('{n} kcal', { n: fmt(n.kcal) })}</span>
        <ChevronDown aria-hidden className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open ? (
        <div id={panelId} className="flex flex-col gap-3 bg-background/70 px-4 pb-3 pt-1 sm:px-5">
          {e.nameAr && lang !== 'ar' ? <ArabicName className="text-sm text-muted-foreground">{e.nameAr}</ArabicName> : null}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
            {(['carbs', 'protein', 'fat', 'sugar', 'satFat', 'sodium'] as const).map((k) => (
              <div key={k} className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t(({ carbs: 'Carbs', protein: 'Protein', fat: 'Fat', sugar: 'Sugar', satFat: 'Sat. fat', sodium: 'Sodium' })[k])}</dt>
                <dd className="tabular font-semibold">{n[k] == null ? <><span aria-hidden>—</span><span className="sr-only">{t('not reported')}</span></> : withUnit(n[k], k, t)}</dd>
              </div>
            ))}
          </dl>
          <div><SourceBadge basis={e.basis} sourceId={e.sourceId} /></div>
          {e.readOnly ? (
            <span className="text-sm text-muted-foreground">{t('This comes from your hospital meal record, which your care team keeps up to date.')}</span>
          ) : editing ? (
            <EntryEditor entry={e} meal={meal} onCancel={() => setEditing(false)} onSaved={(c) => { setEditing(false); onSaved(c); }} />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="min-h-11 sm:min-h-9" onClick={() => setEditing(true)}>
                <Pencil aria-hidden />{e.foodId ? t('Edit amount') : t('Move to…')}<span className="sr-only"> {t(foodName(e, lang))}</span>
              </Button>
              <Button variant="destructive" size="sm" className="min-h-11 sm:min-h-9" onClick={onDelete} disabled={deleting}>
                <Trash2 aria-hidden />{deleting ? t('Removing…') : t('Remove')}<span className="sr-only"> {t(foodName(e, lang))}</span>
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </li>
  );
}

/**
 * Change a logged food: the same amount picker as when adding (portion and how
 * many, or grams) plus "Move to…" another meal. Quick-add entries (typed-in
 * values) can only be moved.
 */
function EntryEditor({ entry: e, meal, onSaved, onCancel }: { entry: DiaryEntry; meal: MealId; onSaved: (c: { amountLabel: string; meal: MealId }) => void; onCancel: () => void }) {
  const { t, lang } = useT();
  const [food, setFood] = React.useState<Food | null>(null);
  const [failed, setFailed] = React.useState<string | null>(null);
  const [toMeal, setToMeal] = React.useState<MealId>(meal);
  const [busy, setBusy] = React.useState(false);
  const selectId = React.useId();
  React.useEffect(() => {
    if (!e.foodId) return;
    let live = true;
    apiFetch<Food>(`/api/foods/${encodeURIComponent(e.foodId)}`)
      .then((f) => { if (live) setFood(f); })
      .catch((err) => { if (live) setFailed(tMsg(t, lang, (err as ApiError).message)); });
    return () => { live = false; };
  }, [e.foodId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!e.foodId) {
    const move = async (ev: React.FormEvent) => {
      ev.preventDefault();
      if (toMeal === meal) { onCancel(); return; }
      setBusy(true);
      try {
        const res = await apiSend<{ amountLabel: string; meal: MealId }>('PATCH', `/api/health/me/diary/${encodeURIComponent(e.id)}`, { meal: toMeal });
        onSaved(res);
      } catch (err) {
        toast(tMsg(t, lang, (err as ApiError).message), { tone: 'error' });
      } finally { setBusy(false); }
    };
    return (
      <form onSubmit={move} className="flex flex-col gap-2">
        <Label htmlFor={selectId}>{t('Move to…')}</Label>
        <NativeSelect id={selectId} value={toMeal} onChange={(ev) => setToMeal(ev.target.value as MealId)}>
          {MEAL_IDS.map((m) => <option key={m} value={m}>{t(MEAL_LABELS[m])}</option>)}
        </NativeSelect>
        <p className="text-xs text-muted-foreground">{t('You can’t change the amount of a quick add. Remove it and add it again with the new amount.')}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" className="min-h-11 sm:min-h-9" disabled={busy}>{busy ? t('Saving…') : t('Save')}</Button>
          <Button variant="outline" size="sm" className="min-h-11 sm:min-h-9" onClick={onCancel} disabled={busy}>{t('Cancel')}</Button>
        </div>
      </form>
    );
  }
  if (failed) {
    return (
      <div className="flex flex-col items-start gap-2 text-sm">
        <p className="text-destructive">{failed}</p>
        <Button variant="outline" size="sm" onClick={onCancel}>{t('Cancel')}</Button>
      </div>
    );
  }
  if (!food) return <p role="status" className="text-sm text-muted-foreground">{t('Opening…')}</p>;
  return (
    <div className="rounded-[16px] border border-border bg-card p-3">
      <FoodPicker food={food} date="" meal={meal} edit={{ id: e.id, amount: e.amount }} onSaved={onSaved} onCancel={onCancel} />
    </div>
  );
}
