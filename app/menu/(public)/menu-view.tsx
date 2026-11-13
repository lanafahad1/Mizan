'use client';
import * as React from 'react';
import Link from 'next/link';
import { Pencil, Database, ChevronRight, ChevronDown, ChevronUp, Search, LayoutGrid, CalendarDays } from 'lucide-react';
import { useApi, apiPath } from '@/lib/api-client';
import { PageHead, PageBody } from '@/components/site/page-head';
import { DateNav } from '@/components/cb/date-nav';
import { Illustration } from '@/components/illustrations/illustration';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input, NativeSelect, Label } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { Accordion } from '@/components/ui/accordion';
import { MenuMealCard, type MenuMeal } from '@/components/public/menu-card';
import { plural } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PERIODS, CUISINES } from '@/domain/constants.js';
import { ACTIVE_DIET_CATEGORIES } from '@/domain/rules.js';
import { useT } from '@/components/site/lang';

export type MenuMode = 'all' | 'date';
export type MenuFilters = { view: MenuMode; date: string; period: string; q: string; diet: string; type: string; cuisine: string };
type Menu = {
  view?: MenuMode; date: string; weekday?: string; cycleDay?: number; total?: number; cuisines?: string[]; nutritionNote: string;
  periods: { id: string; label: string; meals: MenuMeal[] }[];
};

const DIETS = (ACTIVE_DIET_CATEGORIES as { id: string; code: string; plain: string }[]).filter((d) => d.id !== 'regular');
const PERIOD_CHIPS = (PERIODS as { id: string; label: string }[]).map((p) => ({ id: p.id, label: p.id === 'snack' ? 'Snacks' : p.label }));
const periodName = (id: string, fallback: string) => PERIOD_CHIPS.find((p) => p.id === id)?.label ?? fallback;
// Every period is always loaded; the period chips jump to their section instead of filtering.
const menuKey = (f: MenuFilters) => (f.view === 'all'
  ? apiPath('/api/menu', { view: 'all', q: f.q.trim(), diet: f.diet, type: f.type, cuisine: f.cuisine })
  : apiPath('/api/menu', { date: f.date, q: f.q.trim(), diet: f.diet, type: f.type }));
/** Meals shown per period before "Show all N". */
const FIRST = 6;

export function MenuView({ initial, filters: start, today, canManage }: { initial: Menu; filters: MenuFilters; today: string; canManage: boolean }) {
  const { t, lang } = useT();
  // "3 meals" in English; Arabic number agreement (وجبة واحدة، وجبتان، 3 وجبات، 11 وجبة).
  const mealCount = (n: number) => (lang !== 'ar' ? plural(n, 'meal') : n === 1 ? t('1 meal') : n === 2 ? t('2 meals') : n >= 3 && n <= 10 ? t('{n} meals', { n }) : t('{n} meal', { n }));
  // "International" alone is translated as "international sources" elsewhere; here it is a cuisine.
  const cuisineName = (c: string) => (lang === 'ar' && c === 'International' ? t('International cuisine') : t(c));
  const [f, setF] = React.useState<MenuFilters>(start);
  const [qInput, setQInput] = React.useState(start.q);
  const key = menuKey(f);
  const initialKey = menuKey(start);
  const { data, error, isLoading } = useApi<Menu>(key, key === initialKey ? initial : undefined);
  const m = data ?? initial;
  const all = f.view === 'all';
  const count = m.total ?? m.periods.reduce((s, p) => s + p.meals.length, 0);
  // Saudi first, then the catalogue's usual order.
  const cuisines = (CUISINES as string[]).filter((c) => (m.cuisines ?? CUISINES).includes(c));
  const filtered = Boolean(f.q.trim() || f.diet || f.type || (all && f.cuisine));
  const sections = m.periods.filter((p) => !all || p.meals.length);

  const update = (next: Partial<MenuFilters>) => setF((prev) => ({ ...prev, ...next }));
  const clear = () => { setQInput(''); update({ q: '', diet: '', type: '', cuisine: '' }); };

  // "Show all N" per period, expanded in place.
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());
  const toggleAll = (id: string) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
      // Showing fewer brings the section's title back into view so nobody is left far below.
      requestAnimationFrame(() => document.getElementById(`mp-${id}`)?.scrollIntoView({ block: 'start' }));
    } else next.add(id);
    return next;
  });

  // Period chips: jump to a section and highlight the one being read.
  const [active, setActive] = React.useState(start.period);
  const jump = (id: string) => {
    setActive(id);
    update({ period: id });
    document.getElementById(`mp-${id}`)?.scrollIntoView({ block: 'start' });
  };
  React.useEffect(() => {
    if (start.period) document.getElementById(`mp-${start.period}`)?.scrollIntoView({ block: 'start' });
    // Only on arrival: a ?period= link opens at that section.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const sectionIds = sections.map((p) => p.id).join(',');
  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const ids = sectionIds ? sectionIds.split(',') : [];
    const seen = new Set<string>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const id = (e.target as HTMLElement).dataset.period!;
        if (e.isIntersecting) seen.add(id); else seen.delete(id);
      }
      const first = ids.find((id) => seen.has(id));
      if (first) setActive(first);
    }, { rootMargin: '-150px 0px -55% 0px' });
    ids.forEach((id) => { const el = document.getElementById(`sec-${id}`); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [sectionIds]);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.history.replaceState(null, '', apiPath('/menu', {
      view: f.view === 'date' ? 'date' : '', date: f.view === 'date' && f.date !== today ? f.date : '',
      period: f.period, q: f.q.trim(), diet: f.diet, type: f.type, cuisine: f.view === 'all' ? f.cuisine : '',
    }));
  }, [f, today]);
  // Search updates after a short pause so typing stays smooth.
  React.useEffect(() => {
    const timer = setTimeout(() => setF((prev) => (prev.q === qInput ? prev : { ...prev, q: qInput })), 250);
    return () => clearTimeout(timer);
  }, [qInput]);

  const chip = 'inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 font-display text-sm font-medium whitespace-nowrap transition-colors border-input bg-card text-foreground hover:bg-secondary aria-pressed:border-primary aria-pressed:bg-secondary aria-pressed:text-secondary-foreground';
  // Chips scroll inside their own row on small phones and wrap on wider screens; the page never scrolls sideways.
  const rail = '-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden';
  const seg = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 font-display text-sm font-semibold text-heading transition-colors hover:bg-mint aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary [&_svg]:size-4';

  return (
    <>
      <PageHead eyebrow={t('Hospital kitchen')} title={t('Hospital Meal Menu')}
        actions={canManage ? <Link href="/menu/manage" className={buttonVariants({ variant: 'outline', size: 'sm' })}><Pencil aria-hidden />{t('Menu management')}</Link> : null}>
        <p>{t('Browse every meal from the hospital kitchen and see its calories, allergens and which diets it fits.')}</p>
      </PageHead>
      <PageBody>
        <div role="group" aria-label={t('Show')} className="grid grid-cols-2 gap-1 rounded-full border border-border bg-card p-1 shadow-soft sm:w-fit">
          <button type="button" className={seg} aria-pressed={all} onClick={() => update({ view: 'all' })}><LayoutGrid aria-hidden />{t('All meals')}</button>
          <button type="button" className={seg} aria-pressed={!all} onClick={() => update({ view: 'date' })}><CalendarDays aria-hidden />{t('By date')}</button>
        </div>

        <div className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-3 sm:p-4">
          {!all ? <div className="flex flex-col gap-1.5"><span className="font-display text-sm font-medium text-heading">{t('Menu date')}</span><DateNav date={f.date} onChange={(d) => update({ date: d })} id="mn-date" label={t('Menu date')} /></div> : null}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,16rem)_minmax(0,12rem)] md:items-end">
            <div className="col-span-2 flex flex-col gap-1.5 md:col-span-1">
              <Label htmlFor="mn-q" className="sr-only sm:not-sr-only">{t('Search')}</Label>
              <div className="relative">
                <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="mn-q" type="search" value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder={t('Search a meal, ingredient or cuisine')} className="ps-9" maxLength={60} />
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="mn-diet">{t('Fits diet')}</Label>
              <NativeSelect id="mn-diet" value={f.diet} onChange={(e) => update({ diet: e.target.value })}>
                <option value="">{t('Any diet')}</option>
                {DIETS.map((d) => <option key={d.id} value={d.id}>{t(d.plain)} ({d.code})</option>)}
              </NativeSelect>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="mn-type">{t('Type')}</Label>
              <NativeSelect id="mn-type" value={f.type} onChange={(e) => update({ type: e.target.value })}>
                <option value="">{t('All types')}</option>
                <option value="complete">{t('Complete meals')}</option>
                <option value="single">{t('Individual dishes')}</option>
              </NativeSelect>
            </div>
          </div>
          {all ? (
            <div role="group" aria-label={t('Cuisine')} className={rail}>
              <button type="button" className={chip} aria-pressed={!f.cuisine} onClick={() => update({ cuisine: '' })}>{t('All cuisines')}</button>
              {cuisines.map((c) => <button key={c} type="button" className={chip} aria-pressed={f.cuisine === c} onClick={() => update({ cuisine: c })}>{cuisineName(c)}</button>)}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p aria-live="polite" className={all ? 'font-display text-base font-semibold text-heading sm:text-lg' : 'text-sm text-muted-foreground'}>
            {isLoading ? t('Updating the menu…') : all ? mealCount(count) : t('{meals} on the {weekday} menu (cycle day {day})', { meals: mealCount(count), weekday: t(m.weekday ?? ''), day: m.cycleDay ?? '' })}
          </p>
          {filtered && count > 0 ? <Button type="button" variant="ghost" onClick={clear}>{t('Clear filters')}</Button> : null}
        </div>

        {error ? <Notice tone="danger" title={t('We couldn’t load the menu.')}>{t(error.message)} {t('Check your connection and try again.')}</Notice> : null}

        {count > 0 && sections.length > 1 ? (
          <nav aria-label={t('Jump to a meal period')} className="sticky top-[calc(4rem+1px+env(safe-area-inset-top,0px))] z-30 -mx-4 -my-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:mx-0 sm:rounded-b-[16px] sm:px-0">
            <ul className="flex gap-1 overflow-x-auto sm:gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sections.map((p) => (
                <li key={p.id} className="shrink-0">
                  <a href={`#mp-${p.id}`} aria-current={active === p.id ? 'true' : undefined}
                    onClick={(e) => { e.preventDefault(); jump(p.id); }}
                    className={cn(chip, 'gap-1 px-3 text-[.8125rem] no-underline sm:gap-1.5 sm:px-4 sm:text-sm aria-[current=true]:border-primary aria-[current=true]:bg-primary aria-[current=true]:text-primary-foreground')}>
                    {t(periodName(p.id, p.label))}
                    <span className="tabular text-xs opacity-75">{p.meals.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div aria-busy={isLoading} className={cn('flex flex-col gap-7 transition-opacity sm:gap-10', isLoading && 'opacity-60')}>
          {count > 0 ? sections.map((p) => {
            const open = expanded.has(p.id);
            const shown = open ? p.meals : p.meals.slice(0, FIRST);
            const more = p.meals.length > FIRST;
            const name = t(periodName(p.id, p.label));
            return (
              <section key={p.id} id={`sec-${p.id}`} data-period={p.id} aria-labelledby={`mp-${p.id}`} className="flex flex-col gap-3 sm:gap-4">
                <h2 id={`mp-${p.id}`} className="flex scroll-mt-36 flex-wrap items-baseline gap-x-3 border-b border-border pb-2 text-[1.3rem] sm:text-[1.5rem]">{name} <span className="font-sans text-sm font-normal text-muted-foreground">{mealCount(p.meals.length)}</span></h2>
                {p.meals.length ? (
                  <div className="flex flex-col divide-y divide-border overflow-hidden rounded-[18px] border border-border bg-card shadow-soft sm:grid sm:grid-cols-2 sm:gap-5 sm:divide-y-0 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent sm:shadow-none lg:grid-cols-3">
                    {shown.map((meal) => <MenuMealCard key={meal.id} meal={meal} diet={f.diet} href={all ? `/meal/${meal.id}` : apiPath(`/meal/${meal.id}`, { date: m.date, period: p.id })} />)}
                  </div>
                ) : <p className="text-muted-foreground">{t('No {period} meals match.', { period: lang === 'ar' ? t(p.label) : p.label.toLowerCase() })}</p>}
                {more ? (
                  <Button type="button" variant="outline" className="w-full sm:w-fit sm:self-center" aria-expanded={open}
                    aria-label={open ? t('Show fewer {period} meals', { period: name }) : t('Show all {n} {period} meals', { n: p.meals.length, period: name })}
                    onClick={() => toggleAll(p.id)}>
                    {open ? <>{t('Show fewer')}<ChevronUp aria-hidden /></> : <>{t('Show all {n}', { n: p.meals.length })}<ChevronDown aria-hidden /></>}
                  </Button>
                ) : null}
              </section>
            );
          }) : (
            <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-input bg-card/70 px-6 py-10 text-center">
              <Illustration name="empty-search" className="size-24" />
              <h3 className="text-lg">{filtered ? t('No meals match these filters') : t('No meals on the menu for this day')}</h3>
              <p className="max-w-md text-muted-foreground">{filtered ? t('Try a different search, or clear the filters to see every meal.') : t('Choose another date, or see all meals.')}</p>
              {filtered
                ? <Button type="button" onClick={clear}>{t('Clear filters')}</Button>
                : <Button type="button" onClick={() => update({ view: 'all' })}>{t('Show all meals')}</Button>}
            </div>
          )}
        </div>

        <Accordion className="rounded-[16px] border border-border bg-card" headClassName="min-h-11 px-4 py-3 font-display text-sm font-semibold text-heading"
          title={<span className="inline-flex items-center gap-2"><Database className="size-4" aria-hidden />{t('Where this information comes from, and its limits')}</span>}>
          <div className="flex flex-col gap-3 px-4 pb-4 text-sm">
            <ul className="flex list-disc flex-col gap-1.5 ps-5">
              <li><b>{t('Meal types:')}</b> {t('a complete meal combines several dishes; an individual dish is served on its own.')}</li>
              <li><b>{t('Nutrition:')}</b> {t(m.nutritionNote)} {t('Values are for one standard serving. A small portion is half of it, and a large one is one and a half.')}</li>
              <li><b>{t('Allergens:')}</b> {t('from ingredient data, using the 14 allergens SFDA requires food services to declare (SFDA.FD 56). Packaged products vary by brand, so the kitchen checks labels.')}</li>
              <li><b>{t('Halal:')}</b> {t('all meat and poultry are halal-certified, as overseen by the SFDA Saudi Halal Center.')}</li>
              <li><b>{t('Calories on menus:')}</b> {t('SFDA requires food service menus to show calories; CareBite shows energy first wherever SFDA values exist. “≥” marks a partial total for a complete meal where one component has no SFDA values.')}</li>
              <li><b>{t('Diet compatibility:')}</b> {t('each meal is screened against the documented rules with default limits. “Depends on limits” means potassium and phosphorus limits are set per patient. Patient-specific screening happens on each patient’s profile.')}</li>
              <li><b>{t('Texture:')}</b> {t('no IDDSI texture level is recorded for menu items, so texture-modified diets always need admin review.')}</li>
              <li><b>{t('Local produce:')}</b> {t('marked when an ingredient group has national self-sufficiency data (MEWA, GASTAT 2024).')}</li>
            </ul>
            <Link href="/diets" className="inline-flex min-h-11 w-fit items-center gap-1">{t('See every diet category, rule and source')} <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden /></Link>
          </div>
        </Accordion>
      </PageBody>
    </>
  );
}
