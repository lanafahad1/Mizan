'use client';
// "Add food" for one meal, in calm steps:
//   1. choose a shelf (or search everything / scan a barcode)
//   2. a focused list for that shelf
//   3. the amount (portion or grams) with a ★ favourite toggle → "Add to <meal>"
// Quick add, pack label and barcode are side paths that end in step 3 or add directly.
import * as React from 'react';
import { useSWRConfig } from 'swr';
import { ArrowLeft, FileText, ScanBarcode, Search, Zap } from 'lucide-react';
import { apiSend, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { formatLongDate } from '@/lib/format';
import { useT } from '@/components/site/lang';
import { BarcodeBox } from './barcode-box';
import { FoodPicker } from './food-picker';
import { LabelFoodForm } from './label-food-form';
import { QuickAdd } from './quick-add';
import { SearchResults, ShelfGrid, ShelfList, shelfTitle, useDebounced, type ShelfId } from './shelves';
import { tMsg, type Food, type LabelDraft, type MealId, type RecentFood } from './types';
import { useMealNames } from './meal-names';

type View =
  | { kind: 'shelves' }
  | { kind: 'shelf'; shelf: ShelfId }
  | { kind: 'food'; food: Food }
  | { kind: 'quick' }
  | { kind: 'label'; draft: LabelDraft | null }
  | { kind: 'barcode' };

export function AddFoodDialog({ open, onOpenChange, meal, date, recent, favorites = [], onAdded, onFavoritesChanged }: {
  open: boolean; onOpenChange: (open: boolean) => void; meal: MealId; date: string; recent: RecentFood[];
  /** Ids of the person's favourite foods. */
  favorites?: string[];
  onAdded: (name: string, mergedAmount?: string) => void;
  /** Called after a ★ was turned on or off (refresh the diary). */
  onFavoritesChanged?: () => void;
}) {
  // Escape goes back one step (or clears the search) before it closes the dialog.
  const backRef = React.useRef<(() => boolean) | null>(null);
  return (
    <Dialog open={open} onOpenChange={(o, details) => {
      if (!o && details.reason === 'escape-key' && backRef.current?.()) { details.cancel(); return; }
      onOpenChange(o);
    }}>
      <DialogContent className="max-sm:h-dvh max-sm:max-h-dvh max-sm:rounded-none max-sm:border-0">
        {/* The popup unmounts when closed, so every opening starts on the shelves and the camera is released. */}
        <AddFoodFlow meal={meal} date={date} recent={recent} favorites={favorites} onAdded={onAdded} onFavoritesChanged={onFavoritesChanged} backRef={backRef} />
      </DialogContent>
    </Dialog>
  );
}

function AddFoodFlow({ meal, date, recent, favorites, onAdded, onFavoritesChanged, backRef }: {
  meal: MealId; date: string; recent: RecentFood[]; favorites: string[]; onAdded: (name: string, mergedAmount?: string) => void;
  onFavoritesChanged?: () => void; backRef: React.RefObject<(() => boolean) | null>;
}) {
  const { t, lang } = useT();
  const { mutate } = useSWRConfig();
  const [stack, setStack] = React.useState<View[]>([{ kind: 'shelves' }]);
  const view = stack[stack.length - 1];
  const [q, setQ] = React.useState('');
  const term = useDebounced(q.trim());
  const [favs, setFavs] = React.useState(() => new Set(favorites));
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const first = React.useRef(true);
  const mealLabel = useMealNames().inSentence(meal, false);

  // Keep the local ★ set in step with the diary when it is refreshed.
  const favKey = favorites.join(',');
  React.useEffect(() => { setFavs(new Set(favKey ? favKey.split(',') : [])); }, [favKey]);

  const push = (v: View) => setStack((s) => [...s, v]);
  const replace = (v: View) => setStack((s) => [...s.slice(0, -1), v]);
  const back = React.useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);

  const searchable = view.kind === 'shelves' || view.kind === 'shelf';
  React.useEffect(() => {
    backRef.current = () => {
      if (searchable && q) { setQ(''); return true; }
      if (stack.length > 1) { back(); return true; }
      return false;
    };
    return () => { backRef.current = null; };
  }, [backRef, searchable, q, stack.length, back]);

  // Move focus to the new step's heading so keyboard and screen-reader users follow along.
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    headingRef.current?.focus();
  }, [stack]);

  async function toggleFavorite(foodId: string, on: boolean) {
    try {
      const res = await apiSend<{ favorites: string[]; on: boolean }>('POST', '/api/health/me/favorites', { foodId, on });
      setFavs(new Set(res.favorites));
      toast(res.on ? t('Added to your favourites.') : t('Removed from your favourites.'));
      void mutate('/api/health/me/favorites');
      onFavoritesChanged?.();
    } catch (err) {
      toast(tMsg(t, lang, (err as ApiError).message), { tone: 'error' });
    }
  }

  const onFood = (food: Food) => push({ kind: 'food', food });
  const prevView = stack[stack.length - 2];
  const backTo = !prevView ? '' : prevView.kind === 'shelves' ? t('Back to shelves') : prevView.kind === 'shelf' ? t('Back to {shelf}', { shelf: t(shelfTitle(prevView.shelf)) }) : t('Back');

  const step = view.kind === 'shelves' ? 1 : view.kind === 'shelf' ? 2 : view.kind === 'food' ? 3 : null;
  const heading = view.kind === 'shelves' ? t('Where would you like to look?')
    : view.kind === 'shelf' ? t(shelfTitle(view.shelf))
      : view.kind === 'food' ? t('How much did you have?')
        : view.kind === 'quick' ? t('Quick add')
          : view.kind === 'label' ? t('Add from a pack label')
            : t('Find by barcode');

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Add to {meal}', { meal: mealLabel })}</DialogTitle>
        <DialogDescription>{formatLongDate(date, lang)}</DialogDescription>
      </DialogHeader>
      <DialogBody className="flex-1">
        {searchable ? (
          <form role="search" className="flex items-end gap-2" onSubmit={(e) => e.preventDefault()}>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <label htmlFor="fs-q" className="sr-only">{t('Search all foods')}</label>
              <div className="relative">
                <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="fs-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search all foods…')} autoComplete="off" className="ps-9" maxLength={60}
                  aria-describedby="fs-q-hint" />
              </div>
              <p id="fs-q-hint" className="sr-only">{t('Type at least 2 letters, in English or Arabic.')}</p>
            </div>
            <Button variant="outline" onClick={() => push({ kind: 'barcode' })} className="shrink-0"><ScanBarcode aria-hidden />{t('Barcode')}</Button>
          </form>
        ) : null}

        <div className="flex items-center gap-1.5">
          {stack.length > 1 ? (
            <Button variant="ghost" size="icon" className="-ms-2 size-11 shrink-0" onClick={back} aria-label={backTo}>
              <ArrowLeft aria-hidden className="size-5 rtl:-scale-x-100" />
            </Button>
          ) : null}
          <div className="flex min-w-0 flex-col">
            {step ? <span className="text-xs font-semibold text-muted-foreground">{t('Step {n} of 3', { n: step })}</span> : null}
            <h3 ref={headingRef} tabIndex={-1} className="text-lg leading-snug outline-none">{heading}</h3>
          </div>
        </div>

        {searchable && term.length >= 2 ? (
          <SearchResults term={term} onFood={onFood} favorites={favs} onQuick={() => push({ kind: 'quick' })} />
        ) : view.kind === 'shelves' ? (
          <>
            <ShelfGrid onShelf={(shelf) => push({ kind: 'shelf', shelf })} />
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <h4 className="text-sm text-muted-foreground">{t('Other ways to add')}</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => push({ kind: 'quick' })}><Zap aria-hidden />{t('Quick add')}</Button>
                <Button variant="secondary" onClick={() => push({ kind: 'label', draft: q.trim() ? { name: q.trim() } : null })}><FileText aria-hidden />{t('From a pack label')}</Button>
              </div>
            </div>
          </>
        ) : view.kind === 'shelf' ? (
          <ShelfList shelf={view.shelf} onFood={onFood} favorites={favs} recent={recent}
            onBarcode={() => push({ kind: 'barcode' })} onLabel={() => push({ kind: 'label', draft: null })} />
        ) : null}

        {view.kind === 'food' ? (
          <FoodPicker key={view.food.id} food={view.food} date={date} meal={meal} onAdded={onAdded}
            favorite={favs.has(view.food.id)} onFavorite={toggleFavorite} />
        ) : null}
        {view.kind === 'quick' ? <QuickAdd date={date} meal={meal} onAdded={onAdded} /> : null}
        {/* A saved label replaces the form, so "back" from the amount does not save it twice. */}
        {view.kind === 'label' ? <LabelFoodForm draft={view.draft} onSaved={(food) => { void mutate('/api/health/me/foods'); replace({ kind: 'food', food }); }} /> : null}
        {view.kind === 'barcode' ? <BarcodeBox onFood={(food) => { void mutate('/api/health/me/foods'); push({ kind: 'food', food }); }} onLabel={(draft) => replace({ kind: 'label', draft })} /> : null}
      </DialogBody>
    </>
  );
}
