'use client';
// The "shelves" of the add-food flow: the tiles of step 1 and the focused list
// of each shelf (step 2). Every list ends in onFood(food) → the amount picker.
import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, FileText, RotateCw, ScanBarcode, Search, Settings2, Star } from 'lucide-react';
import { apiFetch, apiPath, useApi, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input, Label, NativeSelect } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { Illustration } from '@/components/illustrations/illustration';
import type { IllustrationName } from '@/lib/illustrations';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { ArabicName, SourceBadge } from './source-badge';
import { amountText, firstServingKcal, fmt, foodName, servingText, tMsg, type Food, type RecentFood } from './types';

export type ShelfId = 'recent' | 'saudi' | 'groups' | 'ingredients' | 'supermarket' | 'mine';

export const SHELVES: { id: ShelfId; art: IllustrationName; title: string; line: string; vars?: Record<string, number> }[] = [
  { id: 'recent', art: 'shelf-recent', title: 'Recent & favourites', line: 'Your usual foods' },
  { id: 'saudi', art: 'shelf-saudi', title: 'Saudi dishes', line: '{n} dishes with lab values', vars: { n: 130 } },
  { id: 'groups', art: 'shelf-groups', title: 'Food groups', line: 'Ministry of Health portions' },
  { id: 'ingredients', art: 'shelf-ingredients', title: 'Ingredients', line: 'Plain foods, by the gram' },
  { id: 'supermarket', art: 'shelf-supermarket', title: 'Supermarket', line: 'Packaged products' },
  { id: 'mine', art: 'shelf-my-foods', title: 'My foods', line: 'From labels and barcodes' },
];
export const shelfTitle = (id: ShelfId) => SHELVES.find((s) => s.id === id)!.title;

const MOH_GROUPS: { id: string; label: string; art: IllustrationName }[] = [
  { id: 'starch', label: 'Starches', art: 'group-starch' },
  { id: 'protein', label: 'Protein', art: 'group-protein' },
  { id: 'vegetables', label: 'Vegetables', art: 'group-vegetables' },
  { id: 'fruit', label: 'Fruit', art: 'group-fruit' },
  { id: 'milk', label: 'Milk', art: 'group-milk' },
  { id: 'fat', label: 'Fats', art: 'group-fat' },
];
const INGREDIENT_GROUPS: { id: string; label: string }[] = [
  { id: 'grains', label: 'Grains' },
  { id: 'proteins', label: 'Protein foods' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fruit' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'pantry', label: 'Pantry' },
];
const BRANDS = ['Almarai', 'Nadec', 'Saudia', 'Nada', 'Americana', "Lay's", 'Goody', 'Freshly', 'Maggi', 'Lipton'];

export function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => { const id = setTimeout(() => setV(value), ms); return () => clearTimeout(id); }, [value, ms]);
  return v;
}

const chip = 'inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 font-display text-sm font-medium text-heading transition-colors hover:bg-mint aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground';

// ------------------------------------------------------------------ step 1: the shelf tiles
export function ShelfGrid({ onShelf }: { onShelf: (id: ShelfId) => void }) {
  const { t } = useT();
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {SHELVES.map((s) => (
        <li key={s.id}>
          <button type="button" onClick={() => onShelf(s.id)}
            className="flex h-full min-h-32 w-full flex-col items-center gap-1.5 rounded-[18px] border border-border bg-background px-2 pb-3 pt-2.5 text-center transition-colors hover:border-pink hover:bg-blush focus-visible:bg-blush">
            <Illustration name={s.art} className="size-16" />
            <span className="font-display text-[.92rem] font-semibold leading-tight text-heading">{t(s.title)}</span>
            <span className="text-xs leading-snug text-muted-foreground">{t(s.line, s.vars)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ------------------------------------------------------------------ rows
export function FoodRow({ food: f, onPick, favorite }: { food: Food; onPick: () => void; favorite?: boolean }) {
  const { t, lang } = useT();
  const kcal = firstServingKcal(f);
  const s0 = f.servings[0];
  const serving = s0 ? servingText(s0.display, t, lang, s0.labelAr) : undefined;
  return (
    <li>
      <button type="button" onClick={onPick} className="flex min-h-14 w-full items-center gap-3 px-3.5 py-2.5 text-start hover:bg-background">
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-semibold leading-snug">
            {favorite ? <><Star aria-hidden className="me-1 inline size-3.5 fill-current align-[-2px] text-rose-ink" /><span className="sr-only">{t('Favourite')}: </span></> : null}
            {foodName(f, lang)}
          </span>
          {f.brand || f.nameAr ? (
            <span className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
              {f.brand ? <span>{f.brand}</span> : null}
              {lang === 'ar' ? (f.nameAr ? <bdi dir="ltr" lang="en">{f.name}</bdi> : null) : <ArabicName>{f.nameAr}</ArabicName>}
            </span>
          ) : null}
          <span><SourceBadge basis={f.basis} sourceId={f.sourceId} className="text-[.72rem]" /></span>
        </span>
        <span className="flex shrink-0 flex-col items-end text-end">
          <span className="font-display text-sm font-medium text-heading tabular">{kcal == null ? '—' : t('{n} kcal', { n: fmt(kcal) })}</span>
          {serving ? <span className="max-w-[7.5rem] truncate text-xs text-muted-foreground">{serving}</span> : null}
        </span>
      </button>
    </li>
  );
}

const listBox = 'flex flex-col divide-y divide-border overflow-hidden rounded-[16px] border border-border bg-card';

function ListSkeleton() {
  const { t } = useT();
  return (
    <div role="status" className="flex flex-col gap-2">
      <span className="sr-only">{t('Loading…')}</span>
      {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14" />)}
    </div>
  );
}

function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t, lang } = useT();
  return (
    <div className="flex flex-col items-start gap-2 text-sm">
      <p className="text-destructive">{tMsg(t, lang, (error as ApiError)?.message) || t('We couldn’t load this list.')}</p>
      <Button variant="outline" size="sm" onClick={onRetry}><RotateCw aria-hidden />{t('Try again')}</Button>
    </div>
  );
}

function Empty({ art, title, children }: { art: IllustrationName; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[18px] border border-dashed border-input bg-background/60 px-4 py-6 text-center">
      <Illustration name={art} className="size-20" />
      <p className="font-display font-medium text-heading">{title}</p>
      {children}
    </div>
  );
}

/** A loaded list of foods (or its loading / error / empty state). */
function FoodList({ foods, isLoading, error, retry, onFood, favorites, empty, label }: {
  foods: Food[] | undefined; isLoading: boolean; error: unknown; retry: () => void; onFood: (f: Food) => void;
  favorites: Set<string>; empty: React.ReactNode; label?: string;
}) {
  const { t } = useT();
  if (error && !foods) return <LoadError error={error} onRetry={retry} />;
  if (!foods) return isLoading ? <ListSkeleton /> : null;
  if (!foods.length) return <>{empty}</>;
  return (
    <>
      <p className="sr-only" role="status">{t('{n} foods found.', { n: foods.length })}</p>
      <ul className={listBox} aria-label={label}>
        {foods.map((f) => <FoodRow key={f.id} food={f} favorite={favorites.has(f.id)} onPick={() => onFood(f)} />)}
      </ul>
    </>
  );
}

function ChipGroup<T extends string>({ label, items, value, onChange }: {
  label: string; items: { id: T; label: string; art?: IllustrationName }[]; value: T; onChange: (v: T) => void;
}) {
  const { t } = useT();
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((it) => (
        <button key={it.id} type="button" aria-pressed={value === it.id} onClick={() => onChange(it.id)} className={cn(chip, it.art && 'ps-1.5')}>
          {it.art ? <Illustration name={it.art} className="size-8 rounded-full bg-card" /> : null}
          {t(it.label)}
        </button>
      ))}
    </div>
  );
}

function ShelfSearch({ id, label, value, onChange, placeholder, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-display text-sm font-medium text-heading">{label}</label>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" className="ps-9" maxLength={60}
          aria-describedby={hint ? `${id}-hint` : undefined} />
      </div>
      {hint ? <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

// ------------------------------------------------------------------ step 2: one shelf
export type ShelfProps = {
  onFood: (food: Food) => void; favorites: Set<string>; recent: RecentFood[];
  onBarcode: () => void; onLabel: () => void;
};

export function ShelfList({ shelf, ...p }: ShelfProps & { shelf: ShelfId }) {
  switch (shelf) {
    case 'recent': return <RecentShelf {...p} />;
    case 'saudi': return <SaudiShelf {...p} />;
    case 'groups': return <GroupsShelf {...p} />;
    case 'ingredients': return <IngredientsShelf {...p} />;
    case 'supermarket': return <SupermarketShelf {...p} />;
    case 'mine': return <MyFoodsShelf {...p} />;
  }
}

function RecentShelf({ onFood, favorites, recent }: ShelfProps) {
  const { t, lang } = useT();
  const fav = useApi<Food[]>('/api/health/me/favorites');
  const [opening, setOpening] = React.useState<string | null>(null);
  const favFoods = (fav.data ?? []).filter((f) => favorites.has(f.id));
  const rest = recent.filter((r) => !favorites.has(r.foodId));

  async function openRecent(r: RecentFood) {
    setOpening(r.foodId);
    try { onFood(await apiFetch<Food>(`/api/foods/${encodeURIComponent(r.foodId)}`)); } catch (err) { toast(tMsg(t, lang, (err as ApiError).message), { tone: 'error' }); } finally { setOpening(null); }
  }

  if (!fav.data && fav.isLoading && !rest.length) return <ListSkeleton />;
  if (!favFoods.length && !rest.length && !(fav.error && favorites.size)) {
    return (
      <Empty art="shelf-recent" title={t('Nothing here yet')}>
        <p className="max-w-sm text-sm text-muted-foreground">{t('Foods you’ve logged in the last 30 days show up here, so you can add them in one tap. Tap ★ to keep a favourite at the top.')}</p>
      </Empty>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {favorites.size ? (
        <section aria-labelledby="sh-fav-h" className="flex flex-col gap-2">
          <h4 id="sh-fav-h" className="flex items-center gap-1.5 text-sm"><Star aria-hidden className="size-4 fill-current text-rose-ink" />{t('Favourites')}</h4>
          {fav.error && !fav.data ? <LoadError error={fav.error} onRetry={() => fav.mutate()} />
            : !fav.data ? <ListSkeleton />
              : <ul className={listBox}>{favFoods.map((f) => <FoodRow key={f.id} food={f} favorite onPick={() => onFood(f)} />)}</ul>}
        </section>
      ) : null}
      {rest.length ? (
        <section aria-labelledby="sh-recent-h" className="flex flex-col gap-2">
          <h4 id="sh-recent-h" className="text-sm">{t('Recent')}</h4>
          <ul className={listBox}>
            {rest.map((r) => (
              <li key={r.foodId}>
                <button type="button" onClick={() => openRecent(r)} disabled={opening != null}
                  className="flex min-h-14 w-full items-center gap-3 px-3.5 py-2.5 text-start hover:bg-background disabled:opacity-60">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span dir="auto" className={cn('truncate font-semibold', lang === 'ar' ? 'text-right' : 'text-left')}>{t(r.name)}</span>
                    <span className="truncate text-sm text-muted-foreground">{r.brand ? `${r.brand} · ` : ''}{t('Last time: {amount}', { amount: amountText(r.amountLabel, t, lang) })}</span>
                  </span>
                  <span className="shrink-0 text-sm text-heading tabular">{opening === r.foodId ? t('Opening…') : r.kcal == null ? '' : t('{n} kcal', { n: fmt(r.kcal) })}</span>
                  <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground rtl:-scale-x-100" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function SaudiShelf({ onFood, favorites }: ShelfProps) {
  const { t } = useT();
  const [q, setQ] = React.useState('');
  const [region, setRegion] = React.useState('all');
  const term = useDebounced(q.trim());
  const all = useApi<Food[]>(apiPath('/api/foods', { kinds: 'saudi-dish', limit: 150 }));
  const found = useApi<Food[]>(term.length >= 2 ? apiPath('/api/foods', { kinds: 'saudi-dish', q: term, limit: 100 }) : null);
  const regions = React.useMemo(() => [...new Set((all.data ?? []).map((f) => f.region).filter((r): r is string => Boolean(r)))], [all.data]);
  const searching = term.length >= 2;
  const list = searching ? found.data : all.data?.filter((f) => region === 'all' || f.region === region);
  const grouped = !searching && region === 'all' && regions.length > 1;

  return (
    <div className="flex flex-col gap-4">
      <ShelfSearch id="sh-saudi-q" label={t('Search in Saudi dishes')} value={q} onChange={setQ} placeholder={t('Kabsa, jareesh, مرقوق…')}
        hint={t('From the SFDA Saudi Food Composition Tables (lab values, per 100 g).')} />
      {!searching && regions.length > 1 ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sh-saudi-region">{t('Region')}</Label>
          <NativeSelect id="sh-saudi-region" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="all">{t('All regions')}</option>
            {regions.map((r) => <option key={r} value={r}>{t(r)}</option>)}
          </NativeSelect>
        </div>
      ) : null}
      <div aria-live="polite" aria-busy={(searching ? found.isLoading : all.isLoading) || undefined}>
        {grouped && list ? (
          <div className="flex flex-col gap-4">
            {regions.map((r) => {
              const foods = list.filter((f) => f.region === r);
              if (!foods.length) return null;
              return (
                <section key={r} aria-labelledby={`sh-r-${r}`} className="flex flex-col gap-2">
                  <h4 id={`sh-r-${r}`} className="text-sm">{t(r)}</h4>
                  <ul className={listBox}>{foods.map((f) => <FoodRow key={f.id} food={f} favorite={favorites.has(f.id)} onPick={() => onFood(f)} />)}</ul>
                </section>
              );
            })}
            {list.length >= 150 ? <p className="text-xs text-muted-foreground">{t('Showing the first 100 dishes. Search to find any of the 130.')}</p> : null}
          </div>
        ) : (
          <FoodList foods={list} isLoading={searching ? found.isLoading : all.isLoading} error={searching ? found.error : all.error}
            retry={() => (searching ? found.mutate() : all.mutate())} onFood={onFood} favorites={favorites}
            empty={<Empty art="empty-search" title={t('No Saudi dish matches “{term}”.', { term })} />} />
        )}
      </div>
    </div>
  );
}

function GroupsShelf({ onFood, favorites }: ShelfProps) {
  const { t } = useT();
  const [group, setGroup] = React.useState('starch');
  const res = useApi<Food[]>(apiPath('/api/foods', { kinds: 'moh-portion', group, limit: 100 }));
  const label = t(MOH_GROUPS.find((g) => g.id === group)!.label);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t('Each food here is one portion from the Ministry of Health calorie guide.')}</p>
      <ChipGroup label={t('Food group')} value={group} onChange={setGroup} items={MOH_GROUPS} />
      <div aria-live="polite" aria-busy={res.isLoading || undefined}>
        <FoodList foods={res.data} isLoading={res.isLoading} error={res.error} retry={() => res.mutate()} onFood={onFood} favorites={favorites} label={label}
          empty={<Empty art="empty-search" title={t('No foods in this group.')} />} />
      </div>
    </div>
  );
}

function IngredientsShelf({ onFood, favorites }: ShelfProps) {
  const { t } = useT();
  const [group, setGroup] = React.useState('grains');
  const res = useApi<Food[]>(apiPath('/api/foods', { kinds: 'ingredient', group, limit: 100 }));
  const label = t(INGREDIENT_GROUPS.find((g) => g.id === group)!.label);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t('Plain foods you can log by the gram or by a household measure.')}</p>
      <ChipGroup label={t('Ingredient group')} value={group} onChange={setGroup} items={INGREDIENT_GROUPS} />
      <div aria-live="polite" aria-busy={res.isLoading || undefined}>
        <FoodList foods={res.data} isLoading={res.isLoading} error={res.error} retry={() => res.mutate()} onFood={onFood} favorites={favorites} label={label}
          empty={<Empty art="empty-search" title={t('No foods in this group.')} />} />
      </div>
    </div>
  );
}

function SupermarketShelf({ onFood, favorites, onBarcode }: ShelfProps) {
  const { t } = useT();
  const [q, setQ] = React.useState('');
  const term = useDebounced(q.trim());
  const res = useApi<Food[]>(term.length >= 2 ? apiPath('/api/foods', { kinds: 'packaged', q: term, limit: 50 }) : null);
  return (
    <div className="flex flex-col gap-4">
      <ShelfSearch id="sh-market-q" label={t('Search products or brands')} value={q} onChange={setQ} placeholder={t('Laban, Almarai, chips…')} />
      <ChipGroup label={t('Popular brands')} value={BRANDS.includes(q.trim()) ? q.trim() : ''} onChange={(b) => setQ(b === q.trim() ? '' : b)}
        items={BRANDS.map((b) => ({ id: b, label: b }))} />
      <div aria-live="polite" aria-busy={res.isLoading || undefined}>
        {term.length < 2 ? (
          <Empty art="shelf-supermarket" title={t('Search for a product, or pick a brand.')}>
            <Button variant="outline" size="sm" onClick={onBarcode}><ScanBarcode aria-hidden />{t('Or find it by barcode')}</Button>
          </Empty>
        ) : (
          <FoodList foods={res.data} isLoading={res.isLoading} error={res.error} retry={() => res.mutate()} onFood={onFood} favorites={favorites}
            empty={(
              <Empty art="empty-search" title={t('No products match “{term}”.', { term })}>
                <Button variant="outline" size="sm" onClick={onBarcode}><ScanBarcode aria-hidden />{t('Find it by barcode')}</Button>
              </Empty>
            )} />
        )}
      </div>
    </div>
  );
}

function MyFoodsShelf({ onFood, favorites, onBarcode, onLabel }: ShelfProps) {
  const { t } = useT();
  const res = useApi<Food[]>('/api/health/me/foods');
  return (
    <div className="flex flex-col gap-4">
      <div aria-live="polite" aria-busy={res.isLoading || undefined}>
        <FoodList foods={res.data} isLoading={res.isLoading} error={res.error} retry={() => res.mutate()} onFood={onFood} favorites={favorites}
          empty={(
            <Empty art="shelf-my-foods" title={t('No foods of your own yet')}>
              <p className="max-w-sm text-sm text-muted-foreground">{t('Add a product from its pack label or barcode and it stays here for next time.')}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="secondary" size="sm" onClick={onLabel}><FileText aria-hidden />{t('From a pack label')}</Button>
                <Button variant="outline" size="sm" onClick={onBarcode}><ScanBarcode aria-hidden />{t('Barcode')}</Button>
              </div>
            </Empty>
          )} />
      </div>
      {res.data?.length ? (
        <Link href="/my-foods" className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-semibold"><Settings2 aria-hidden className="size-4" />{t('Edit or delete my foods')}</Link>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ search across everything
export function SearchResults({ term, onFood, favorites, onQuick }: { term: string; onFood: (f: Food) => void; favorites: Set<string>; onQuick: () => void }) {
  const { t } = useT();
  const res = useApi<Food[]>(apiPath('/api/foods', { q: term }));
  return (
    <div aria-live="polite" aria-busy={res.isLoading || undefined} className="flex flex-col gap-2">
      <h4 className="text-sm">{t('Results for “{term}”', { term })}</h4>
      <FoodList foods={res.data} isLoading={res.isLoading} error={res.error} retry={() => res.mutate()} onFood={onFood} favorites={favorites}
        empty={(
          <Empty art="empty-search" title={t('No foods match “{term}”.', { term })}>
            <p className="max-w-sm text-sm text-muted-foreground">{t('Try another word, scan the barcode, or use Quick add.')}</p>
            <Button variant="outline" size="sm" onClick={onQuick}>{t('Quick add')}</Button>
          </Empty>
        )} />
    </div>
  );
}
