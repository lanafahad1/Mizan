'use client';
// Meal ideas (the first tab of Eat well): Saudi dishes (SFDA Saudi Food Composition Tables) and CareBite
// recipes, already filtered on the server to avoid the person's allergens.
// Here they are filtered by meal and sodium, searched, and sorted by how well
// one serving fits the person's per-meal calorie share.
import * as React from 'react';
import Link from 'next/link';
import { useSWRConfig } from 'swr';
import { Search, MapPin, CircleCheck, CircleAlert, TriangleAlert, Plus, ChevronDown, ShieldAlert, FlaskConical, Calculator, Info, Target, Droplet } from 'lucide-react';
import { MealArt } from '@/components/cb/meal';
import { RowCard } from '@/components/cb/row-card';
import { Illustration } from '@/components/illustrations/illustration';
import { apiSend, ApiError } from '@/lib/api-client';
import { EmptyState } from '@/components/cb/misc';
import { Accordion } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { mealIn, servingText, tMsg } from '@/components/diary/types';
import { CUISINE_AR } from '@/lib/i18n/ar/health';

export type Idea = {
  id: string; kind: 'saudi-dish' | 'recipe'; name: string; nameAr: string | null; origin: string; period: string | null;
  serving: string; servingNote: string | null;
  /** Grams in one serving, when known. */
  grams?: number | null;
  kcal: number; carbs: number | null; protein: number | null; fat: number | null; sodium: number | null;
  contains: string[]; mayContain: string[]; allergensDerived: boolean; labelCheck: boolean;
  /** The recipe's meal picture (lib/art.js) and its dish id; null for Saudi dishes. */
  art?: unknown; artId?: string | null;
};
export type IdeaSource = { id: string; title: string; publisher: string; url: string | null; summary: string };
type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEALS: { id: Meal; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' }, { id: 'lunch', label: 'Lunch' }, { id: 'dinner', label: 'Dinner' }, { id: 'snack', label: 'Snack' },
];
const mealLabel = (m: string) => MEALS.find((x) => x.id === m)?.label ?? m;
/** MOH: no more than 2,000 mg of sodium (5 g of salt) a day for an adult. */
const SODIUM_DAY_MG = 2000;
/** Best matches shown first; "Show more" adds this many at a time. */
const PAGE = 12;
const n0 = (v: number) => Math.round(v).toLocaleString('en-US');
const n1 = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 1 });

function norm(s: string | null | undefined) {
  return String(s ?? '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u064B-\u0670\u0640]/g, '').replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627').replace(/\u0629/g, '\u0647').replace(/\u0649/g, '\u064A').trim();
}

type Scored = Idea & { meal: Meal; fits: boolean | null; mealKcal: number | null; sodiumLimit: number };

export function IdeasView({ kind, ideas, hidden, allergies, targetKcal, targetsBasis, shares, sources }: {
  kind: 'member' | 'patient'; ideas: Idea[]; hidden: number; allergies: string[]; targetKcal: number | null; targetsBasis: string | null;
  shares: Record<string, number>; sources: IdeaSource[];
}) {
  const { t, lang } = useT();
  const inMeal = (m: string) => mealIn(m, mealLabel(m).toLowerCase(), lang);
  const [period, setPeriod] = React.useState<Meal | 'any'>('any');
  const [lowSodium, setLowSodium] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [limit, setLimit] = React.useState(PAGE);
  const [busy, setBusy] = React.useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const mealKcal = React.useCallback((m: Meal) => (targetKcal ? Math.round(targetKcal * (shares[m] ?? 0)) : null), [targetKcal, shares]);
  // Smallest share first, so "fits" names the tightest meal that still holds the serving.
  const bySize = React.useMemo(() => [...MEALS].sort((a, b) => (shares[a.id] ?? 0) - (shares[b.id] ?? 0)).map((m) => m.id), [shares]);

  const list = React.useMemo(() => {
    const term = norm(q);
    const scored: Scored[] = [];
    for (const it of ideas) {
      if (period !== 'any' && it.period && it.period !== period) continue;
      if (term && !norm(`${it.name} ${it.nameAr ?? ''} ${it.origin}`).includes(term)) continue;
      let meal: Meal;
      let fits: boolean | null = null;
      if (period !== 'any') {
        meal = period;
        const mk = mealKcal(meal);
        fits = mk == null ? null : it.kcal <= mk;
      } else if (targetKcal) {
        const own = it.period as Meal | null;
        const ownMk = own ? mealKcal(own) : null;
        if (own && ownMk != null && it.kcal <= ownMk) { meal = own; fits = true; } else {
          const found = bySize.find((m) => it.kcal <= (mealKcal(m) ?? 0));
          meal = found ?? (own ?? 'lunch');
          fits = Boolean(found);
        }
      } else meal = (it.period as Meal | null) ?? 'lunch';
      const sodiumLimit = Math.round(SODIUM_DAY_MG * (shares[meal] ?? 0));
      if (lowSodium && (it.sodium == null || it.sodium > sodiumLimit)) continue;
      scored.push({ ...it, meal, fits, mealKcal: mealKcal(meal), sodiumLimit });
    }
    scored.sort((a, b) => {
      if (a.fits !== b.fits) return a.fits ? -1 : b.fits ? 1 : 0;
      if (a.fits && a.mealKcal != null && b.mealKcal != null) return (a.mealKcal - a.kcal) - (b.mealKcal - b.kcal);
      return a.kcal - b.kcal;
    });
    return scored;
  }, [ideas, period, q, lowSodium, targetKcal, mealKcal, bySize, shares]);

  React.useEffect(() => { setLimit(PAGE); }, [period, q, lowSodium]);

  async function add(it: Idea, meal: Meal) {
    setBusy(it.id);
    try {
      await apiSend('POST', '/api/health/me/diary', { meal, foodId: it.id, servingIndex: 0, quantity: 1 });
      toast(t('{name} added to today’s {meal}.', { name: lang === 'ar' && it.nameAr ? it.nameAr : it.name, meal: inMeal(meal) }));
      void mutate((key) => typeof key === 'string' && key.startsWith('/api/health/me'));
    } catch (err) {
      toast(err instanceof ApiError ? tMsg(t, lang, err.message) : t('We couldn’t add this food. Please try again.'), { tone: 'error' });
    } finally { setBusy(null); }
  }

  const pill = 'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-2 font-display text-sm font-medium transition-colors aria-pressed:border-primary aria-pressed:bg-secondary aria-pressed:text-secondary-foreground border-input bg-card text-foreground hover:bg-secondary [&_svg]:size-4';
  const shown = list.slice(0, limit);
  const sodiumText = period === 'any'
    ? t('at most the meal’s share of {day} mg a day (breakfast {b} mg, lunch or dinner {l} mg, snack {s} mg)', { day: n0(SODIUM_DAY_MG), b: n0(SODIUM_DAY_MG * (shares.breakfast ?? 0)), l: n0(SODIUM_DAY_MG * (shares.lunch ?? 0)), s: n0(SODIUM_DAY_MG * (shares.snack ?? 0)) })
    : t('at most {n} mg for {meal} ({pct}% of {day} mg a day)', { n: n0(SODIUM_DAY_MG * (shares[period] ?? 0)), meal: inMeal(period), pct: Math.round((shares[period] ?? 0) * 100), day: n0(SODIUM_DAY_MG) });

  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground">{targetKcal ? t('Saudi dishes and CareBite recipes, with calories and nutrients for one serving. The best fits for your meals come first.') : t('Saudi dishes and CareBite recipes with calories and nutrients for one serving.')}</p>
          {targetKcal ? (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <Badge variant="mint"><Target aria-hidden />{t('Your daily target: {n} kcal', { n: n0(targetKcal) })}</Badge>
              <span className="text-muted-foreground">{targetsBasis === 'care-team' ? t('Set by your care team.') : t('A personal estimate you set in My Health.')}</span>
            </p>
          ) : (
            <Notice tone="rose" title={t('No daily calorie target yet')}>
              {kind === 'member'
                ? <p>{t('Ideas are sorted by calories.')} <Link href="/my-health#targets">{t('Set your daily calories in My Health')}</Link> {t('to see which ideas fit each meal.')}</p>
                : <p>{t('For now, ideas are sorted by calories. Once your care team sets your daily target, you’ll see which ideas fit each meal.')}</p>}
            </Notice>
          )}
          {allergies.length ? (
            <Notice tone="warn" icon={<ShieldAlert aria-hidden />} title={hidden === 1 ? t('1 idea hidden for your allergies') : t('{n} ideas hidden for your allergies', { n: hidden })}>
              <p>{t('We leave out foods that contain or may contain: {list}.', { list: allergies.map((a) => t(a)).join(t(', ')) })} {kind === 'patient' ? t('These come from your hospital record.') : t('You set these in My Health.')} {t('Please still check the ingredients yourself.')}</p>
            </Notice>
          ) : null}
        </div>

        <section aria-label={t('Filters')} className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
            <div className="flex min-w-0 flex-col gap-1 lg:w-72 lg:shrink-0">
              <Label htmlFor="idea-q" className="text-sm">{t('Search dishes')}</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input id="idea-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Kabsa, جريش, oats…')} className="ps-10" autoComplete="off" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div role="group" aria-label={t('Meal')} className="flex flex-wrap gap-2">
                <button type="button" className={pill} aria-pressed={period === 'any'} onClick={() => setPeriod('any')}>{t('Any meal')}</button>
                {MEALS.map((m) => <button key={m.id} type="button" className={pill} aria-pressed={period === m.id} onClick={() => setPeriod(m.id)}>{t(m.label)}</button>)}
              </div>
              <button type="button" className={cn(pill, 'border-dashed aria-pressed:border-solid')} aria-pressed={lowSodium} onClick={() => setLowSodium((v) => !v)}
                title={t('Sodium {text} (Ministry of Health)', { text: sodiumText })}>
                {lowSodium ? <CircleCheck aria-hidden /> : <Droplet aria-hidden />}{t('Lower sodium')}
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            {list.length === 1 ? t('1 idea') : t('{n} ideas', { n: list.length })}{period !== 'any' ? ` ${t('for {meal}', { meal: inMeal(period) })}` : ''}{lowSodium ? t(', sodium {text}', { text: sodiumText }) : ''}.
            {list.length > shown.length ? ` ${t('Showing the best {n}.', { n: shown.length })}` : ''}
          </p>
        </section>

        {shown.length ? (
          <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((it) => <IdeaCard key={it.id} it={it} period={period} busy={busy === it.id} onAdd={add} targetKcal={targetKcal} bySize={bySize} />)}
          </ul>
        ) : (
          <EmptyState title={t('No ideas match your filters')} art={false}
            action={<Button variant="outline" onClick={() => { setQ(''); setLowSodium(false); setPeriod('any'); }}>{t('Clear filters')}</Button>}>
            <p>{t('Try another word, another meal, or turn off “Lower sodium”.')}</p>
          </EmptyState>
        )}
        {list.length > shown.length ? (
          <Button variant="outline" className="w-full sm:w-fit sm:self-center" onClick={() => setLimit((l) => l + PAGE)}>
            <ChevronDown aria-hidden />{t('Show {n} more ({left} left)', { n: Math.min(PAGE, list.length - shown.length), left: list.length - shown.length })}
          </Button>
        ) : null}

        <Accordion className="rounded-[14px] border border-border bg-card" headClassName="min-h-11 px-3.5 py-2.5 font-display text-sm font-medium text-heading"
          title={<span className="inline-flex items-center gap-2"><Info className="size-4" aria-hidden />{t('How ideas are chosen')}</span>}>
          <div className="flex flex-col gap-4 px-3.5 pb-3.5 text-sm">
            <ul className="m-0 flex list-disc flex-col gap-1.5 ps-5">
              <li>{targetKcal ? t('Saudi dishes from the SFDA Saudi Food Composition Tables and CareBite recipes, with calories and nutrients for one serving, sorted by how well they fit your meals.') : t('Saudi dishes from the SFDA Saudi Food Composition Tables and CareBite recipes, with calories and nutrients for one serving, sorted by calories.')}</li>
              {targetKcal ? (
                <li>
                  {t('Your daily target: {n} kcal. Per meal: {list}.', { n: n0(targetKcal), list: MEALS.map((m) => t('{meal} ≈{n} kcal ({pct}%)', { meal: lang === 'ar' ? t(m.label) : m.label.toLowerCase(), n: n0(mealKcal(m.id) ?? 0), pct: Math.round((shares[m.id] ?? 0) * 100) })).join(t(', ')) })}
                  {' '}{t('How we split calories across meals is CareBite’s own estimate, not Ministry of Health guidance.')}
                </li>
              ) : null}
              <li><b className="text-heading">{t('Lower sodium:')}</b> {t('sodium {text}. The Ministry of Health advises adults to have no more than {n} mg of sodium (5 g of salt) a day.', { text: sodiumText, n: n0(SODIUM_DAY_MG) })}</li>
              <li>{t('Saudi dishes show up under every meal, because the Saudi Food Composition Tables don’t say when each dish is eaten.')}</li>
            </ul>
            <div className="flex flex-col gap-2">
              <b className="font-display font-medium text-heading">{t('Where these numbers come from')}</b>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {sources.map((s) => (
                  <li key={s.id} className="flex flex-col gap-0.5">
                    <b className="font-display font-medium text-heading">{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{t(s.title)}<span className="sr-only"> {t('(opens in a new tab)')}</span></a> : t(s.title)}</b>
                    <span className="text-muted-foreground">{t(s.publisher)}</span>
                    <span>{t(s.summary)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Accordion>
    </div>
  );
}

/**
 * One idea, kept short on a phone: picture, name, calories, "fits your …" and one
 * warning icon; the source, serving maths, nutrients and allergens are under "Details".
 */
function IdeaCard({ it, period, busy, onAdd, targetKcal, bySize }: { it: Scored; period: Meal | 'any'; busy: boolean; onAdd: (it: Idea, m: Meal) => void; targetKcal: number | null; bySize: Meal[] }) {
  const { t, lang } = useT();
  const [open, setOpen] = React.useState(false);
  const panelId = React.useId();
  const inMeal = (m: string) => mealIn(m, mealLabel(m).toLowerCase(), lang);
  const sfct = it.kind === 'saudi-dish';
  const allergens = it.contains.map((a) => t(a));
  const sep = t(', ');
  const order: Meal[] = [it.meal, ...bySize.filter((m) => m !== it.meal)];
  const name = lang === 'ar' && it.nameAr ? it.nameAr : it.name;
  const highSodium = it.sodium != null && it.sodium > it.sodiumLimit;
  const sodiumText = t('More sodium than your {meal} share of the daily 2,000 mg ({n} mg, Ministry of Health).', { meal: inMeal(it.meal), n: n0(it.sodiumLimit) });
  const warnings = [it.fits === false ? t('A big portion for one meal') : null, highSodium ? sodiumText : null].filter((x): x is string => Boolean(x));
  return (
    <RowCard className="rounded-[20px] border border-border bg-card p-3 shadow-soft sm:p-4"
      art={it.art && it.artId
        ? <MealArt meal={{ id: it.artId, name: it.name, art: it.art, category: it.period ?? undefined }} className="size-full rounded-none" />
        : <Illustration name="ideas" className="size-14" />}
      title={
        <h2 className="flex items-start gap-1.5 text-base leading-snug">
          <span className="min-w-0 break-words">{name}</span>
          {warnings.length ? (
            <span role="img" aria-label={warnings.join(' ')} title={warnings.join(' ')} className="mt-0.5 shrink-0 text-warning">
              <TriangleAlert className="size-4" aria-hidden />
            </span>
          ) : null}
        </h2>
      }
      facts={[t('{n} kcal', { n: n0(it.kcal) }), it.grams ? `${n0(it.grams)} ${t('g')}` : null, it.protein != null ? t('{n} g protein', { n: n0(it.protein) }) : null]}
      tags={it.fits === true
        ? <Badge variant="ok"><CircleCheck aria-hidden />{t('Fits your {meal}', { meal: inMeal(it.meal) })}</Badge>
        : it.fits === false ? <Badge variant="warn"><CircleAlert aria-hidden />{t('A big portion for one meal')}</Badge>
          : highSodium ? <Badge variant="warn"><CircleAlert aria-hidden />{t('Higher in sodium')}</Badge> : null}>

      <div className="mt-auto flex items-center gap-2">
        <Button variant="ghost" className="shrink-0 px-3" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
          {t('Details')}<ChevronDown aria-hidden className={cn('transition-transform', open && 'rotate-180')} />
          <span className="sr-only"> {name}</span>
        </Button>
        {period !== 'any' ? (
          <Button className="min-w-0 flex-1" disabled={busy} onClick={() => onAdd(it, period)}><Plus aria-hidden />{busy ? t('Adding…') : t('Add')}<span className="sr-only"> {t('to today’s {meal}', { meal: inMeal(period) })}</span></Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger disabled={busy} className={cn(buttonVariants(), 'min-w-0 flex-1')}><Plus aria-hidden />{busy ? t('Adding…') : t('Add')}<span className="sr-only"> {name}</span><ChevronDown aria-hidden /></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('Add 1 serving to')}</DropdownMenuLabel>
              {order.map((m) => <DropdownMenuItem key={m} onClick={() => onAdd(it, m)}>{t(mealLabel(m))}</DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {open ? (
        <div id={panelId} className="flex flex-col gap-3 border-t border-border pt-3 text-sm">
          <div className="flex flex-col gap-0.5">
            {it.nameAr ? (lang === 'ar'
              ? <span lang="en" dir="ltr" className="text-end text-muted-foreground">{it.name}</span>
              : <span lang="ar" dir="rtl" className="text-muted-foreground">{it.nameAr}</span>) : null}
            <span className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
              {sfct ? <><MapPin className="size-4 shrink-0" aria-hidden />{t('{region} region (Saudi Food Composition Tables)', { region: t(it.origin) })}</> : <>{t('CareBite recipe')}{it.origin ? ` · ${lang === 'ar' ? CUISINE_AR[it.origin] ?? t(it.origin) : it.origin}` : ''}</>}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {sfct
              ? <Badge variant="sage"><FlaskConical aria-hidden />{t('Lab values · Saudi Food Composition Tables')}</Badge>
              : <Badge variant="rose"><Calculator aria-hidden />{t('Worked out from the ingredients · USDA')}</Badge>}
          </div>
          <p className="m-0 text-muted-foreground">{servingText(it.serving, t, lang)}{it.servingNote ? ` · ${tMsg(t, lang, it.servingNote)}` : ''}{targetKcal ? ` · ${t('{pct}% of your day', { pct: Math.round((it.kcal / targetKcal) * 100) })}` : ''}{it.fits === true && it.mealKcal != null ? ` · ${t('your {meal} ≈{n} kcal', { meal: inMeal(it.meal), n: n0(it.mealKcal) })}` : ''}</p>
          <dl className="m-0 flex flex-wrap gap-x-3 gap-y-1 rounded-[12px] bg-background px-3 py-2">
            {([['Carbs', it.carbs, 'g'], ['Protein', it.protein, 'g'], ['Fat', it.fat, 'g'], ['Sodium', it.sodium, 'mg']] as const).map(([label, v, unit]) => (
              <div key={label} className="flex items-baseline gap-1">
                <dt className="text-muted-foreground">{t(label)}</dt>
                <dd className="m-0 font-semibold tabular">{v == null ? '—' : `${n1(v)} ${t(unit)}`}</dd>
              </div>
            ))}
          </dl>
          {warnings.length ? (
            <ul className="m-0 flex list-none flex-col gap-1 p-0 text-warning">
              {warnings.map((w) => <li key={w} className="flex items-start gap-1.5"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />{w}</li>)}
            </ul>
          ) : null}
          <div>
            {allergens.length ? <p className="m-0"><b>{t('Contains:')}</b> {allergens.join(sep)}</p> : <p className="m-0"><b>{t('Contains:')}</b> {t('none of the 14 SFDA allergens found')}</p>}
            {it.mayContain.length ? <p className="m-0"><b>{t('May contain:')}</b> {it.mayContain.map((a) => t(a)).join(sep)}</p> : null}
            {it.allergensDerived ? <p className="m-0 text-muted-foreground">{t('We worked out the allergens from the recipe, so please check.')}</p> : null}
            {it.labelCheck ? <p className="m-0 text-muted-foreground">{t('Check the labels of some ingredients.')}</p> : null}
          </div>
        </div>
      ) : null}
    </RowCard>
  );
}
