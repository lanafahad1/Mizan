'use client';
import * as React from 'react';
import Link from 'next/link';
import { X, TriangleAlert, Scale, Layers, ChevronRight, Database, Calculator } from 'lucide-react';
import { MealArt, MealType, NutriSummary, LocalLine } from '@/components/cb/meal';
import { portionLabel } from '@/components/cb/labels';
import { Badge } from '@/components/ui/badge';
import { ALLERGENS, label } from '@/domain/constants.js';
import { cn } from '@/lib/utils';
import { CompatChip, CompatChips, type Compat } from './compat';
import { useT } from '@/components/site/lang';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type MenuMeal = any & { compatibility: Compat[] };

/**
 * One meal on the public hospital menu, kept calm and short.
 * Phones: a compact row (small picture on the start side, name, "kcal · cuisine · type",
 * allergen chips, then Details | See meal). Wider screens: a tidy grid card.
 * Everything else (nutrition grid, serving, portions, local produce, diet fit) is under
 * "Details" (rendered on first open) or on the meal page. `diet` shows that diet's fit when filtering by it.
 */
export function MenuMealCard({ meal, href, diet = '' }: { meal: MenuMeal; href: string; diet?: string }) {
  const { t, lang } = useT();
  const [open, setOpen] = React.useState(false);
  const [seen, setSeen] = React.useState(false);
  const panelId = React.useId();
  const sep = lang === 'ar' ? '، ' : ', ';
  // Arabic: the dish's own Arabic name when the data has one (SFCT dishes).
  const single = meal.type !== 'complete' && meal.components?.length === 1 ? meal.components[0] : null;
  const name = lang === 'ar' ? (meal.nameAr || single?.nameAr || t(meal.name)) : meal.name;
  const kcal = meal.nutrition?.kcal as number | null | undefined;
  const partialKcal = meal.nutritionPartial?.kcal as number | null | undefined;
  const energy = kcal != null ? t('{n} kcal', { n: Math.round(kcal) }) : partialKcal != null ? `≥${t('{n} kcal', { n: Math.round(partialKcal) })}` : null;
  const cuisine = lang === 'ar' && meal.cuisine === 'International' ? t('International cuisine') : t(meal.cuisine);
  const facts = [cuisine, meal.type === 'complete' ? t('Complete meal') : t('Individual dish')];
  const a = meal.allergens ?? { contains: [], mayContain: [], labelCheck: [] };
  const allergen = (id: string) => t(label(ALLERGENS, id));
  // On the card line, “Cereals containing gluten” reads as just “gluten”; the full SFDA name stays on the meal page.
  const short = (id: string) => (id === 'gluten' ? t('gluten') : allergen(id));
  const fit = diet ? (meal.compatibility as Compat[] | undefined)?.find((c) => c.id === diet) : null;
  const basis = meal.nutritionBasis as string | null;
  const toggle = () => { setOpen((o) => !o); setSeen(true); };
  const chipCls = 'px-2 py-0 text-[.75rem] leading-5';

  const chevron = (
    <span className="t-acc-chevron" aria-hidden>
      <svg viewBox="0 0 16 16" width="16" height="16"><path d="M4 6.5L8 10.5L12 6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  );

  return (
    // Phones: a row inside the period's list (the list draws the frame and dividers). Wider: its own card.
    <article className="t-acc flex min-w-0 flex-col bg-card sm:overflow-hidden sm:rounded-[20px] sm:border sm:border-border sm:shadow-soft" data-open={open ? 'true' : 'false'}>
      {/* The whole row/card opens the meal page (stretched name link); Details and diet chips sit above it. */}
      <div className="relative flex flex-1 gap-3 p-3 sm:flex-col sm:gap-0 sm:p-0">
        <div aria-hidden className="h-[72px] w-20 shrink-0 sm:h-auto sm:w-full">
          <MealArt meal={meal} className="size-full rounded-[14px] sm:aspect-[16/10] sm:h-auto sm:rounded-none" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:gap-2.5 sm:p-4 sm:pb-1">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-base leading-snug sm:text-lg">
              <Link href={href} className="no-underline after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none focus-visible:after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-ring">{name}</Link>
            </h3>
            <p className="text-[.8rem] text-muted-foreground sm:text-sm">
              <span className={energy ? 'font-semibold text-heading tabular' : undefined}>{energy ?? t('Calories not available')}</span>
              {facts.map((x) => <span key={x}><span aria-hidden> · </span>{x}</span>)}
            </p>
          </div>

          {(meal.available === false || meal.infoStatus === 'pending') ? (
            <div className="flex flex-wrap gap-1.5">
              {meal.available === false ? <Badge variant="danger" className={cn('whitespace-normal', chipCls)}><X aria-hidden />{t('Unavailable today')}{meal.unavailableReason ? `: ${t(meal.unavailableReason)}` : ''}</Badge> : null}
              {meal.infoStatus === 'pending' ? <Badge variant="warn" className={cn('whitespace-normal', chipCls)}><TriangleAlert aria-hidden />{t('Dietary information not yet verified by an admin')}</Badge> : null}
            </div>
          ) : null}

          {/* One quiet allergen line (no chips), then (phones) the Details button on the same line. */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="flex min-w-0 flex-1 items-start gap-1.5 text-[.85rem] text-foreground">
              {a.contains.length
                ? <><TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden /><span>{t('Contains {list}', { list: a.contains.map(short).join(sep) })}</span></>
                : <span className="text-muted-foreground">{t('None of the 14 SFDA allergens')}</span>}
            </p>
            <button type="button" className="t-acc-head relative z-10 -my-2.5 -me-1 ms-auto inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-2 font-display text-sm font-semibold text-heading hover:bg-mint sm:hidden" aria-expanded={open} aria-controls={panelId} onClick={toggle}>
              {t('Details')}{chevron}
            </button>
          </div>

          {fit ? <div className="relative z-10 flex flex-wrap"><CompatChip c={fit} /></div> : null}
        </div>
      </div>

      <div className="mx-4 hidden items-center border-t border-border sm:flex">
        <button type="button" className="t-acc-head inline-flex min-h-11 flex-1 items-center gap-1.5 text-start font-display text-sm font-semibold text-heading" aria-expanded={open} aria-controls={panelId} onClick={toggle}>
          {t('Details')}{chevron}
        </button>
        <Link href={href} tabIndex={-1} aria-hidden className="inline-flex min-h-11 items-center gap-1 ps-3 font-display text-sm font-semibold text-primary no-underline hover:underline">
          {t('See meal')}<ChevronRight aria-hidden className="size-4 rtl:-scale-x-100" />
        </Link>
      </div>

      <div className="t-acc-panel" id={panelId} role="region" aria-label={t('Details')} inert={!open}>
        <div className="t-acc-panel-inner">
          {seen ? (
            <div className="flex flex-col gap-3 px-3 pb-3 sm:px-4 sm:pb-4">
              {meal.description ? <p className="text-[.95rem] text-muted-foreground">{t(meal.description)}</p> : null}
              {meal.type === 'complete' ? <MealType m={meal} /> : null}
              <NutriSummary n={meal.nutrition} caption={t('Nutrition per standard serving')} partial={meal.nutritionPartial} missingFrom={meal.nutritionMissingFrom} />
              {basis ? (
                <p className="inline-flex items-start gap-1.5 text-xs text-muted-foreground">
                  {basis === 'lab' ? <Database className="mt-0.5 size-3.5 shrink-0" aria-hidden /> : <Calculator className="mt-0.5 size-3.5 shrink-0" aria-hidden />}
                  {basis === 'lab' ? t('SFDA values') : basis === 'calculated' ? t('Calculated from ingredients') : `${t('SFDA values')} + ${t('Calculated from ingredients')}`}
                </p>
              ) : null}
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <span className="inline-flex items-start gap-1.5"><Scale className="mt-0.5 size-4 shrink-0 text-heading" aria-hidden />{t('Standard serving:')} <bdi>{t(meal.servingSize)}</bdi></span>
                <span className="inline-flex items-start gap-1.5"><Layers className="mt-0.5 size-4 shrink-0 text-heading" aria-hidden />{t('Portions:')} {meal.portions.map((p: string) => t(portionLabel(p))).join(t(', '))}</span>
              </div>
              {a.mayContain.length ? <p className="text-sm text-muted-foreground">{t('May contain {allergen}', { allergen: a.mayContain.map(allergen).join(sep) })}</p> : null}
              {a.labelCheck.length ? <p className="text-sm text-muted-foreground">{t('Kitchen checks labels:')} {a.labelCheck.map((x: string) => t(x)).join(sep)}</p> : null}
              <LocalLine local={meal.local} />
              {meal.compatibility?.length ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">{t('Diet fit')}</span>
                  <CompatChips list={meal.compatibility} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
