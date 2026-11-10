'use client';
import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, CircleCheck, Footprints, GlassWater, Info, RotateCw, Settings2, Target, Undo2, X } from 'lucide-react';
import { useApi, apiSend, ApiError } from '@/lib/api-client';
import { addDays } from '@/domain/dates.js';
import { formatDate, formatLongDate } from '@/lib/format';
import { Accordion } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { containerClass } from '@/components/site/page-head';
import { CalorieRing } from '@/components/diary/calorie-ring';
import { MacroBars, MinorBars } from '@/components/diary/macro-bars';
import { MealCard } from '@/components/diary/meal-card';
import { AddFoodDialog } from '@/components/diary/food-search-dialog';
import { useT } from '@/components/site/lang';
import type { Lang, T } from '@/lib/i18n';
import { amountText, diaryKey, fmt, foodName, isMealId, LABELS, MEAL_LABELS, mealForNow, mealIn, tMsg, type Diary, type DiaryEntry, type MealId, type NutrientKey } from '@/components/diary/types';

const DAYS_BACK = 60;

function dayName(date: string, today: string, t: T, lang: Lang) {
  if (date === today) return t('Today');
  if (date === addDays(today, -1)) return t('Yesterday');
  if (date === addDays(today, 1)) return t('Tomorrow');
  return formatDate(date, { weekday: 'long', month: 'short', day: 'numeric' }, lang);
}

/** The food diary for one day: a calm summary against the targets, then the four meals. */
export function TodayView({ initial, role }: { initial: Diary; role: 'member' | 'patient' }) {
  const { t, lang } = useT();
  const today = initial.today;
  const min = addDays(today, -DAYS_BACK);
  const max = addDays(today, 1);
  const [date, setDate] = React.useState(initial.date);
  const key = diaryKey(date);
  const { data, error, mutate, isValidating } = useApi<Diary>(key, key === diaryKey(initial.date) ? initial : undefined);
  const diary = data;
  const loadingDay = !diary || diary.date !== date;

  // The day before, to offer "Repeat yesterday's …" on empty meals.
  const prev = addDays(date, -1);
  const anyEmpty = Boolean(diary && !loadingDay && diary.meals.some((m) => m.entries.length === 0));
  const { data: before } = useApi<Diary>(anyEmpty && prev >= min ? diaryKey(prev) : null);

  const [addTo, setAddTo] = React.useState<MealId | null>(null);
  const [lastMeal, setLastMeal] = React.useState<MealId>('breakfast');
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [repeating, setRepeating] = React.useState<MealId | null>(null);
  const [announce, setAnnounce] = React.useState('');
  // The last removed entry, offered back with "Undo" for a few seconds.
  const [undo, setUndo] = React.useState<{ entry: unknown; name: string; key: number } | null>(null);
  const [restoring, setRestoring] = React.useState(false);

  function openAdd(meal: MealId) { setLastMeal(meal); setAddTo(meal); }

  // ?add=breakfast|lunch|dinner|snack opens "Add food" for that meal (the "+" in the bottom bar links here).
  // Any other value picks the meal that fits the time of day. The parameter is then dropped from the address.
  const params = useSearchParams();
  const addParam = params.get('add');
  React.useEffect(() => {
    if (addParam == null) return;
    openAdd(isMealId(addParam) ? addParam : mealForNow());
    const url = new URL(window.location.href);
    url.searchParams.delete('add');
    window.history.replaceState(null, '', url.pathname + url.search);
  }, [addParam]);

  function go(next: string) {
    if (next < min || next > max) return;
    setDate(next);
    window.history.replaceState(null, '', next === today ? '/today' : `/today?date=${next}`);
  }

  const totalLine = (d: Diary | undefined) => {
    if (!d) return '';
    const kcal = d.totals.kcal ?? 0;
    const goal = d.targets?.kcal;
    if (!goal) return t('Total for the day: {kcal} kcal.', { kcal: fmt(kcal) });
    return kcal <= goal
      ? t('Total for the day: {kcal} of {target} kcal, {n} left.', { kcal: fmt(kcal), target: fmt(goal), n: fmt(goal - kcal) })
      : t('Total for the day: {kcal} of {target} kcal, {n} over.', { kcal: fmt(kcal), target: fmt(goal), n: fmt(kcal - goal) });
  };

  async function added(name: string, mergedAmount?: string) {
    const meal = addTo ?? lastMeal;
    setAddTo(null);
    setUndo(null);
    // The same food added again to the same meal is merged into one row.
    const msg = mergedAmount
      ? t('Added — now {amount} {name}.', { amount: amountText(mergedAmount, t, lang), name: t(name) })
      : t('Added {name} to {meal}.', { name: t(name), meal: mealIn(meal, MEAL_LABELS[meal].toLowerCase(), lang) });
    toast(msg);
    const fresh = await mutate();
    setAnnounce(`${mergedAmount ? msg : t('Added {name}.', { name: t(name) })} ${totalLine(fresh)}`);
  }

  async function saved(e: DiaryEntry, c: { amountLabel: string; meal: MealId }) {
    const name = t(foodName(e, lang));
    const moved = e.meal != null && c.meal !== e.meal;
    const msg = moved
      ? t('Moved {name} to {meal}.', { name, meal: mealIn(c.meal, MEAL_LABELS[c.meal].toLowerCase(), lang) })
      : t('Saved: {name}, {amount}.', { name, amount: amountText(c.amountLabel, t, lang) });
    toast(msg);
    const fresh = await mutate();
    setAnnounce(`${msg} ${totalLine(fresh)}`);
  }

  async function remove(e: DiaryEntry) {
    setDeleting(e.id);
    try {
      const res = await apiSend<{ deleted: boolean; entry?: unknown }>('DELETE', `/api/health/me/diary/${encodeURIComponent(e.id)}`);
      const fresh = await mutate();
      const name = t(foodName(e, lang));
      if (res?.entry) setUndo({ entry: res.entry, name, key: Date.now() });
      else toast(t('Removed {name}.', { name }));
      setAnnounce(`${t('Removed {name}.', { name })} ${totalLine(fresh)}`);
    } catch (err) {
      toast(tMsg(t, lang, (err as ApiError).message), { tone: 'error' });
    } finally { setDeleting(null); }
  }

  async function restore() {
    if (!undo) return;
    setRestoring(true);
    try {
      await apiSend('POST', '/api/health/me/diary/restore', { entry: undo.entry });
      const name = undo.name;
      setUndo(null);
      const fresh = await mutate();
      toast(t('{name} is back.', { name }));
      setAnnounce(`${t('{name} is back.', { name })} ${totalLine(fresh)}`);
    } catch (err) {
      toast(tMsg(t, lang, (err as ApiError).message), { tone: 'error' });
    } finally { setRestoring(false); }
  }

  async function repeatMeal(meal: MealId) {
    setRepeating(meal);
    try {
      const res = await apiSend<{ added: number }>('POST', '/api/health/me/diary/repeat', { fromDate: prev, meal, toDate: date });
      const fresh = await mutate();
      const where = mealIn(meal, MEAL_LABELS[meal].toLowerCase(), lang);
      const msg = res.added === 1 ? t('Added 1 food to {meal}.', { meal: where }) : t('Added {n} foods to {meal}.', { n: res.added, meal: where });
      toast(msg);
      setAnnounce(`${msg} ${totalLine(fresh)}`);
    } catch (err) {
      toast(tMsg(t, lang, (err as ApiError).message), { tone: 'error' });
    } finally { setRepeating(null); }
  }

  /** What the day before had for this meal (own entries only: hospital meals are not copied). */
  const repeatFor = (meal: MealId) => {
    if (!before || before.date !== prev) return null;
    const count = before.meals.find((m) => m.id === meal)?.entries.filter((e) => !e.readOnly && !e.hospital).length ?? 0;
    if (!count) return null;
    return { count, busy: repeating === meal, onRepeat: () => repeatMeal(meal), yesterday: date === today };
  };

  const next = addDays(date, 1);
  const navBtn = 'grid size-11 shrink-0 place-items-center rounded-full border border-border bg-card text-heading hover:bg-mint disabled:pointer-events-none disabled:opacity-40';

  return (
    <>
      <div className={cn(containerClass({ space: 'member' }), 'flex flex-col gap-2 pb-5 pt-8 sm:pt-10')}>
        <span className="eyebrow text-center">{t('Diary')}</span>
        <div role="group" aria-label={t('Choose the day')} className="flex items-center justify-between gap-2">
          <button type="button" className={navBtn} disabled={prev < min} onClick={() => go(prev)} aria-label={t('Previous day: {day}', { day: dayName(prev, today, t, lang) })}>
            <ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden />
          </button>
          <div className="flex min-w-0 flex-col items-center text-center">
            <h1 className="text-[1.9rem] leading-tight sm:text-[2.4rem]">{dayName(date, today, t, lang)}</h1>
            <p className="text-sm text-muted-foreground">{formatLongDate(date, lang)}</p>
          </div>
          <button type="button" className={navBtn} disabled={next > max} onClick={() => go(next)} aria-label={t('Next day: {day}', { day: dayName(next, today, t, lang) })}>
            <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden />
          </button>
        </div>
        {date !== today ? <Button variant="link" size="sm" className="mx-auto" onClick={() => go(today)}>{t('Back to today')}</Button> : null}
      </div>

      <div className={cn(containerClass({ space: 'member' }), 'flex flex-col gap-4 pb-16')}>
        {error && loadingDay ? (
          <Notice tone="danger" title={t('We couldn’t open this day')}>
            <p>{tMsg(t, lang, (error as ApiError).message)}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => mutate()}><RotateCw aria-hidden />{t('Try again')}</Button>
          </Notice>
        ) : null}

        {diary ? (
          <div aria-busy={loadingDay || undefined} className={cn('flex flex-col gap-4 transition-opacity', loadingDay && 'opacity-50')}>
            <Summary diary={diary} role={role} announce={announce} />
            {diary.meals.map((m) => (
              <MealCard key={m.id} meal={m} deleting={deleting} onAdd={() => openAdd(m.id)} onDelete={remove} onSaved={saved}
                repeat={m.entries.length === 0 && !loadingDay ? repeatFor(m.id) : null} />
            ))}
          </div>
        ) : null}
        {loadingDay && !error ? <p role="status" className="sr-only">{isValidating ? t('Loading the day…') : ''}</p> : null}

        <Link href="/my-foods" className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-semibold">
          <Settings2 aria-hidden className="size-4" />{t('My foods (from labels and barcodes)')}
        </Link>

        <p className="text-xs leading-snug text-muted-foreground">
          <Info aria-hidden className="me-1 inline size-3.5 align-[-2px]" />
          {t('Where the numbers come from: the Ministry of Health’s portion guide and the SFDA Saudi Food Composition Tables first, then USDA FoodData Central. Packaged products come from Open Food Facts, which is community data, so check the label.')}{' '}
          <Link href="/sources#food-h" className="whitespace-nowrap">{t('About our sources')}</Link>
        </p>
      </div>

      <AddFoodDialog open={addTo != null} onOpenChange={(o) => { if (!o) setAddTo(null); }} meal={addTo ?? lastMeal} date={date}
        recent={diary?.recent ?? []} favorites={diary?.favorites ?? []} onAdded={added} onFavoritesChanged={() => { void mutate(); }} />
      {undo ? <UndoBar key={undo.key} name={undo.name} busy={restoring} onUndo={() => void restore()} onClose={() => setUndo(null)} /> : null}
    </>
  );
}

const UNDO_MS = 8000;

/** "Removed …" with an Undo button, in the toast spot. It waits while the pointer or focus is on it. */
function UndoBar({ name, busy, onUndo, onClose }: { name: string; busy: boolean; onUndo: () => void; onClose: () => void }) {
  const { t } = useT();
  const [open, setOpen] = React.useState(false);
  const [held, setHeld] = React.useState(false);
  React.useEffect(() => { const id = requestAnimationFrame(() => setOpen(true)); return () => cancelAnimationFrame(id); }, []);
  React.useEffect(() => {
    if (held || busy) return;
    const id = window.setTimeout(onClose, UNDO_MS);
    return () => window.clearTimeout(id);
  }, [held, busy, onClose]);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[61] flex flex-col items-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end sm:pe-6 print:hidden">
      <div role="status" onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}
        className={cn('t-toast pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-[16px] border border-border border-s-4 border-s-success bg-card px-4 py-2.5 shadow-lift', open && 'is-open')}>
        <CircleCheck aria-hidden className="size-5 shrink-0 text-success" />
        <p className="min-w-0 flex-1 text-[.95rem]">{t('Removed {name}.', { name })}</p>
        <Button variant="secondary" size="sm" className="min-h-11 shrink-0 sm:min-h-9" onClick={onUndo} disabled={busy}>
          <Undo2 aria-hidden className="rtl:-scale-x-100" />{busy ? t('Putting back…') : t('Undo')}
        </Button>
        <button type="button" onClick={onClose} aria-label={t('Dismiss notification')} className="-me-1 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-mint sm:size-8"><X className="size-4" /></button>
      </div>
    </div>
  );
}

function Summary({ diary: d, role, announce }: { diary: Diary; role: 'member' | 'patient'; announce: string }) {
  const { t } = useT();
  const kcal = d.totals.kcal ?? 0;
  const target = d.targets?.kcal ?? null;
  const lacking = (['kcal', 'carbs', 'protein', 'fat', 'sugar', 'sodium'] as NutrientKey[]).filter((k) => (d.missing[k] ?? 0) > 0);
  const daily = d.daily;
  return (
    <Card aria-labelledby="day-summary-h" className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="day-summary-h" className="text-lg">{t('Your day')}</h2>
        {d.targets && d.targetsBasis ? (
          <Badge variant={d.targetsBasis === 'care-team' ? 'mint' : 'rose'}>
            <Target aria-hidden />{d.targetsBasis === 'care-team' ? t('Care-team target') : t('Personal estimate')}
          </Badge>
        ) : null}
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <CalorieRing eaten={kcal} target={target} show="left" size={128} />
        <div className="flex min-w-0 flex-col gap-1">
          {target != null ? (
            <>
              <p className="sr-only">{kcal <= target ? t('{n} kcal left', { n: fmt(target - kcal) }) : t('{n} kcal over', { n: fmt(kcal - target) })}</p>
              <dl className="flex flex-col gap-1 text-sm">
                <div className="flex items-baseline gap-2"><dt className="text-muted-foreground">{t('Eaten')}</dt><dd className="font-display font-semibold text-heading tabular">{t('{n} kcal', { n: fmt(kcal) })}</dd></div>
                <div className="flex items-baseline gap-2"><dt className="text-muted-foreground">{t('Target')}</dt><dd className="font-display font-semibold text-heading tabular">{t('{n} kcal', { n: fmt(target) })}</dd></div>
              </dl>
            </>
          ) : (
            <>
              <p className="sr-only">{t('{n} kcal eaten', { n: fmt(kcal) })}</p>
              <p className="text-sm text-muted-foreground">{t('Set a calorie target to see what’s left for the day.')}</p>
              {role === 'member'
                ? <Link href="/my-health#targets" className="text-sm font-semibold">{t('Set your targets')}</Link>
                : <p className="text-sm text-muted-foreground">{t('Your care team sets your targets.')}</p>}
            </>
          )}
        </div>
      </div>

      <MacroBars totals={d.totals} targets={d.targets} missing={d.missing} />

      {daily ? (
        <ul aria-label={t('Also today')} className="grid grid-cols-2 gap-2">
          <li>
            <Link href="/home" className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-[.82rem] text-heading no-underline hover:bg-mint">
              <GlassWater aria-hidden className="size-4" />
              <span>{daily.water != null ? t('Water: {n} cups', { n: daily.water }) : t('Water: not logged')}</span>
            </Link>
          </li>
          <li>
            <Link href="/home" className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-[.82rem] text-heading no-underline hover:bg-mint">
              <Footprints aria-hidden className="size-4" />
              <span>{daily.steps != null ? t('Steps: {n}', { n: daily.steps.toLocaleString('en-US') }) : t('Steps: not logged')}</span>
            </Link>
          </li>
        </ul>
      ) : null}

      <Accordion className="border-t border-border pt-1" headClassName="min-h-11 font-display text-sm font-medium text-heading"
        title={t('More: sugar and sodium')}>
        <div className="flex flex-col gap-3 pb-1 pt-2">
          <MinorBars totals={d.totals} targets={d.targets} missing={d.missing} />
          {d.estimated || lacking.length ? (
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              {d.estimated ? <p>{t('Some values are your own entries or community data, so treat them as estimates.')}</p> : null}
              {lacking.length ? <p>{t('Some foods don’t list every nutrient, so your {nutrients} totals may be a little low.', { nutrients: lacking.map((k) => t(LABELS[k]).toLowerCase()).join(t(', ')) })}</p> : null}
            </div>
          ) : null}
        </div>
      </Accordion>
      <p aria-live="polite" className="sr-only">{announce}</p>
    </Card>
  );
}
