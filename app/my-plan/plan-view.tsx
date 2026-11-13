'use client';
// Eat well → My plan, Shopping list and Healthy habits: the Saudi MOH Calorie Guide meal plan nearest to the person's daily
// calorie target, the exchange list for swaps, a 7-day shopping list built
// only by multiplying the MOH example portions, and MOH healthy-habit advice.
// Every number on this page is MOH's (data/moh-calorie-guide.js) or a sum or
// multiple of MOH's numbers.
import * as React from 'react';
import Link from 'next/link';
import {
  Milk, Wheat, Drumstick, Carrot, Apple, Droplet, Printer, ShoppingBasket, Salad, Footprints, Moon, Repeat,
  Tag, Ruler, ArrowLeftRight, ClipboardList, Stethoscope, ExternalLink,
} from 'lucide-react';
import {
  MOH_GUIDE_META, EXCHANGE_GROUPS, EXCHANGE_FOODS, FREE_FOODS, FREE_FOOD_KCAL, HEALTHY_PLATE, MOH_MEAL_PLANS, PLAN_RULES,
  LABEL_GUIDE, MEASURES, ACTIVITY_GUIDE, LIFESTYLE_TIPS,
} from '@/data/moh-calorie-guide.js';
import { EmptyState } from '@/components/cb/misc';
import { Accordion } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Table, Th, Td } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import type { Lang } from '@/lib/i18n';
import { SHOP_UNITS_AR } from '@/lib/i18n/ar/health';

type Line = { group: string; n: number; example: string; exampleAr: string };
type Icon = React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

const GROUP_ICON: Record<string, Icon> = { milk: Milk, starch: Wheat, protein: Drumstick, vegetables: Carrot, fruit: Apple, fat: Droplet };
const GROUP = Object.fromEntries(EXCHANGE_GROUPS.map((g) => [g.id, g]));
const MEALS: [string, string][] = [['breakfast', 'Breakfast'], ['snack1', 'Snack 1'], ['lunch', 'Lunch'], ['snack2', 'Snack 2'], ['dinner', 'Dinner']];
const AREAS: { id: string; label: string; icon: Icon }[] = [
  { id: 'food', label: 'Food', icon: Salad }, { id: 'activity', label: 'Activity', icon: Footprints },
  { id: 'sleep', label: 'Sleep', icon: Moon }, { id: 'habits', label: 'Habits', icon: Repeat },
];
const n0 = (v: number) => v.toLocaleString('en-US');
const kcalOf = (group: string, n: number) => (GROUP[group]?.kcal ?? 0) * n;

// ---------------------------------------------------------------- shopping list
// Amounts are kept in twelfths so MOH's ¼, ⅓, ½, ⅔ and ¾ multiply exactly.
const FRAC_IN: Record<string, number> = { '¼': 3, '⅓': 4, '½': 6, '⅔': 8, '¾': 9 };
const FRAC_OUT: Record<number, string> = { 3: '¼', 4: '⅓', 6: '½', 8: '⅔', 9: '¾' };
function fmtAmount(t: number) {
  const whole = Math.floor(t / 12);
  const rem = t % 12;
  if (!rem) return String(whole);
  const f = FRAC_OUT[rem];
  if (f) return whole ? `${whole}${f}` : f;
  return (t / 12).toLocaleString('en-US', { maximumFractionDigits: 2 });
}
const UNITS: Record<string, [string, string]> = {
  g: ['g', 'g'], cup: ['cup', 'cups'], cups: ['cup', 'cups'], teaspoon: ['teaspoon', 'teaspoons'], teaspoons: ['teaspoon', 'teaspoons'],
  tablespoon: ['tablespoon', 'tablespoons'], tablespoons: ['tablespoon', 'tablespoons'], slice: ['slice', 'slices'], slices: ['slice', 'slices'],
};
/** Countable example foods without a unit word: display name and the unit to count them in. */
const NOUNS: Record<string, { key: string; name: string; unit: [string, string] }> = {
  'arabic flat bread': { key: 'arabic-bread', name: 'Arabic flat bread', unit: ['loaf', 'loaves'] },
  'large olives': { key: 'olives', name: 'Olives (large)', unit: ['olive', 'olives'] },
  apple: { key: 'apple', name: 'Apples', unit: ['apple', 'apples'] },
  dates: { key: 'dates', name: 'Dates', unit: ['date', 'dates'] },
  'samoli roll': { key: 'samoli', name: 'Samoli bread', unit: ['roll', 'rolls'] },
  egg: { key: 'egg', name: 'Eggs', unit: ['egg', 'eggs'] },
  eggs: { key: 'egg', name: 'Eggs', unit: ['egg', 'eggs'] },
  'medium banana': { key: 'banana', name: 'Bananas (medium)', unit: ['banana', 'bananas'] },
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type ShopItem = { group: string; key: string; name: string; nameAr?: string; perDay: number; unit: [string, string]; hint?: string; hintAr?: string };

function parseExample(line: Line): Omit<ShopItem, 'perDay'> & { amount: number } {
  const m = /^(\d+)?\s*([¼⅓½⅔¾])?\s+(.+)$/.exec(line.example);
  if (m && (m[1] || m[2])) {
    const amount = (m[1] ? Number(m[1]) * 12 : 0) + (m[2] ? FRAC_IN[m[2]] : 0);
    const rest = m[3];
    const u = /^(g|cups?|teaspoons?|tablespoons?|slices?)\s+(.+)$/.exec(rest);
    if (u) return { group: line.group, key: `${line.group}:${UNITS[u[1]][0]}:${u[2].toLowerCase()}`, name: cap(u[2]), unit: UNITS[u[1]], amount };
    const noun = NOUNS[rest.toLowerCase()];
    if (noun) return { group: line.group, key: `${line.group}:${noun.key}`, name: noun.name, unit: noun.unit, amount };
    return { group: line.group, key: `${line.group}:${rest.toLowerCase()}`, name: cap(rest), unit: ['', ''], amount };
  }
  // No amount in the example (e.g. "Tomato, cucumber or carrot"): count MOH portions.
  const first = EXCHANGE_FOODS.filter((f) => f.group === line.group).slice(0, 2);
  const portions = first.map((f) => `${f.portion} ${f.name.toLowerCase()}`).join(' or ');
  const portionsAr = first.map((f) => `${f.portionAr} ${f.nameAr}`).join(' أو ');
  return {
    group: line.group, key: `${line.group}:${line.example.toLowerCase()}`, name: line.example, nameAr: line.exampleAr, unit: ['portion', 'portions'], amount: line.n * 12,
    hint: portions ? `1 portion = ${portions}` : undefined, hintAr: portionsAr ? `حصة واحدة = ${portionsAr}` : undefined,
  };
}

function shoppingList(meals: Record<string, Line[]>): ShopItem[] {
  const map = new Map<string, ShopItem>();
  for (const [id] of MEALS) {
    for (const line of meals[id] ?? []) {
      const p = parseExample(line);
      const prev = map.get(p.key);
      if (prev) prev.perDay += p.amount;
      else map.set(p.key, { group: p.group, key: p.key, name: p.name, nameAr: p.nameAr, unit: p.unit, hint: p.hint, hintAr: p.hintAr, perDay: p.amount });
    }
  }
  return [...map.values()];
}
const unitFor = (t: number, unit: [string, string], lang: Lang = 'en') => {
  if (!unit[0]) return '';
  if (lang !== 'ar') return ` ${t <= 12 ? unit[0] : unit[1]}`;
  // Arabic: plural form for whole amounts 3 to 10, singular otherwise ("3 أكواب"، "14 كوب").
  const ar = SHOP_UNITS_AR[unit[0]];
  if (!ar) return ` ${unit[0]}`;
  return ` ${t % 12 === 0 && t >= 36 && t <= 120 ? ar[1] : ar[0]}`;
};
/** A food group's name in the page language (MOH's Arabic name in Arabic). */
const groupName = (g: { label: string; labelAr?: string } | undefined, lang: Lang, fallback = '') => (g ? (lang === 'ar' && g.labelAr ? g.labelAr : g.label) : fallback);

// ---------------------------------------------------------------- small pieces
function MohSource({ className }: { className?: string }) {
  const { t, lang } = useT();
  if (lang === 'ar') {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        {t('Source:')} <a href={MOH_GUIDE_META.url} target="_blank" rel="noopener noreferrer">{MOH_GUIDE_META.titleAr}<span className="sr-only"> {t('(opens in a new tab)')}</span></a>{' '}
        {t('Saudi Ministry of Health, Live Well programme.')}
      </p>
    );
  }
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      Source: <a href={MOH_GUIDE_META.url} target="_blank" rel="noopener noreferrer">Saudi Ministry of Health, Calorie Guide for Weight Loss<span className="sr-only"> (opens in a new tab)</span></a>{' '}
      (<bdi lang="ar" dir="rtl">{MOH_GUIDE_META.titleAr}</bdi>), Live Well programme.
    </p>
  );
}

function Section({ id, title, icon: Ico, children, action, className }: { id: string; title: string; icon: Icon; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn('flex min-w-0 flex-col gap-4 rounded-[20px] border border-border bg-card p-4 shadow-soft sm:p-5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 id={id} className="flex items-center gap-2 text-lg sm:text-xl"><Ico className="size-5 shrink-0" aria-hidden /><span>{title}</span></h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const accCls = 'rounded-[14px] border border-border bg-background/60';
const accHead = 'min-h-11 px-3.5 py-2.5 font-display text-sm font-medium text-heading';

function Ar({ children, className }: { children: React.ReactNode; className?: string }) {
  const { lang } = useT();
  // In Arabic the Arabic text is already the main text, so the extra line is not repeated.
  if (lang === 'ar') return null;
  return <span lang="ar" dir="rtl" className={cn('block text-end text-[.92rem] text-muted-foreground', className)}>{children}</span>;
}

// ---------------------------------------------------------------- the Eat well tabs
type PlanProps = { kind: 'member' | 'patient'; targetKcal: number | null; targetsBasis: string | null; planKcal: number | null };
const planFor = (planKcal: number | null) => (planKcal != null ? MOH_MEAL_PLANS.find((p) => p.kcal === planKcal) ?? null : null);

/** No daily target (or no MOH plan near it) yet. */
function NoPlan({ kind }: { kind: PlanProps['kind'] }) {
  const { t } = useT();
  return kind === 'member' ? (
    <EmptyState title={t('Set your daily calories in My Health')}
      action={<Link href="/my-health#targets" className={buttonVariants()}>{t('Go to My Health')}</Link>}>
      <p>{t('Once you set a daily calorie target, we’ll show you the closest Ministry of Health meal plan, with portions for each meal and a shopping list.')}</p>
    </EmptyState>
  ) : (
    <EmptyState title={t('Your care team will set your plan')}>
      <p>{t('Once the nutrition team approves your daily calorie target, your Ministry of Health meal plan will show here. Feel free to ask them about it during your stay.')}</p>
    </EmptyState>
  );
}

function MoreFromMoh() {
  const { t } = useT();
  return (
    <p className="flex items-start gap-1.5 text-sm text-muted-foreground print:hidden">
      <ExternalLink className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{t('More from the Ministry of Health:')} <a href={MOH_GUIDE_META.page} target="_blank" rel="noopener noreferrer">{t('Food Calorie Calculator for Weight Loss page')}<span className="sr-only"> {t('(opens in a new tab)')}</span></a>. {t('See also')} <Link href="/sources">{t('Data sources & limitations')}</Link>.</span>
    </p>
  );
}

/**
 * "My plan" tab: the MOH meal plan nearest to the person's daily calorie target
 * (members and hospital patients; for patients also the home plan at discharge),
 * with the exchange list for swaps.
 */
export function PlanTab({ kind, targetKcal, targetsBasis, planKcal }: PlanProps) {
  const { t, lang } = useT();
  const plan = planFor(planKcal);
  if (!targetKcal || !plan) return <NoPlan kind={kind} />;
  const day = plan.day as Record<string, number>;
  const meals = plan.meals as Record<string, Line[]>;
  const dayKcal = EXCHANGE_GROUPS.reduce((s, g) => s + kcalOf(g.id, day[g.id] ?? 0), 0);
  const note = (plan as { note?: string }).note;
  const plans = MOH_MEAL_PLANS.map((p) => p.kcal);
  const minPlan = Math.min(...plans);
  const maxPlan = Math.max(...plans);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl sm:text-2xl">{t('Your meal plan from the Ministry of Health (≈{n} kcal)', { n: n0(plan.kcal) })}</h2>
        <p className="text-muted-foreground">{t('From the Saudi Ministry of Health Calorie Guide for Weight Loss.')} {t(MOH_GUIDE_META.audience)}</p>
      </div>
      <div className="flex flex-col gap-3">
        <Notice tone="info" title={t('Your daily target: {n} kcal', { n: n0(targetKcal) })}>
          <p>
            {targetsBasis === 'care-team' ? t('Set by your care team.') : t('A personal estimate you set in My Health.')}{' '}
            {targetKcal !== plan.kcal ? t('The Ministry of Health guide has plans from {min} to {max} kcal. The {n} kcal plan is the closest to your target.', { min: n0(minPlan), max: n0(maxPlan), n: n0(plan.kcal) }) : t('It matches the Ministry of Health {n} kcal plan.', { n: n0(plan.kcal) })}
          </p>
        </Notice>
        {note ? <Notice tone="warn" title={t('A note on this plan')}>{t(note)}</Notice> : null}
        {kind === 'patient' ? (
          <Notice tone="rose" icon={<Stethoscope aria-hidden />} title={t('Your home plan')}>
            {t('You can keep following this plan at home after you leave hospital. Check with your care team before you go, as they may adjust it.')}
          </Notice>
        ) : null}
        <MohSource />
      </div>

      {/* Daily portions */}
      <Section id="portions-h" title={t('Your portions for the day')} icon={ClipboardList}>
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-6">
          {EXCHANGE_GROUPS.map((g) => {
            const Ico = GROUP_ICON[g.id];
            return (
              <li key={g.id} className="flex flex-col gap-1 rounded-[16px] border border-sage bg-mint px-3.5 py-3">
                <span className="flex items-center justify-between gap-2">
                  <b className="font-display text-[1.6rem] font-semibold leading-tight text-heading tabular">{day[g.id] ?? 0}</b>
                  <Ico className="size-6 text-heading" aria-hidden />
                </span>
                <span className="font-display text-sm font-medium text-heading">{groupName(g, lang)}</span>
                <Ar className="text-start" >{g.labelAr}</Ar>
                <span className="text-xs text-muted-foreground">{t('1 portion = {n} kcal', { n: g.kcal })}</span>
              </li>
            );
          })}
        </ul>
        <p className="text-sm text-muted-foreground">
          {t('Together these come to about {n} kcal, using the Ministry of Health’s average for one portion of each group (milk 120, starch 80, protein 75, vegetables 25, fruit 60, fat 45 kcal).', { n: n0(dayKcal) })}
        </p>
      </Section>

      {/* Meals of the day */}
      <Section id="meals-h" title={t('Your day of meals')} icon={Salad}>
        <p className="text-sm text-muted-foreground">{t('An example day from the Ministry of Health for the {n} kcal plan, with a food idea for each portion.', { n: n0(plan.kcal) })}</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {MEALS.map(([id, label]) => {
            const lines = meals[id] ?? [];
            const mealKcal = lines.reduce((s, l) => s + kcalOf(l.group, l.n), 0);
            return (
              <article key={id} aria-labelledby={`meal-${id}`} className="flex flex-col gap-2 rounded-[16px] border border-border bg-background px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 id={`meal-${id}`} className="text-base">{t(label)}</h3>
                  <span className="text-sm text-muted-foreground tabular">≈{t('{n} kcal', { n: n0(mealKcal) })}</span>
                </div>
                <ul className="m-0 flex list-none flex-col divide-y divide-border p-0">
                  {lines.map((l, i) => {
                    const Ico = GROUP_ICON[l.group];
                    return (
                      <li key={i} className="flex items-start gap-3 py-2 first:pt-0 last:pb-0">
                        <Badge variant="sage" className="mt-0.5 shrink-0">{Ico ? <Ico aria-hidden /> : null}{l.n} × {groupName(GROUP[l.group], lang, l.group)}</Badge>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span>{lang === 'ar' ? l.exampleAr : l.example}</span>
                          <Ar>{l.exampleAr}</Ar>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground">{t('Meal calories are worked out from the Ministry of Health’s portion values (portions × kcal per portion).')}</p>
        <Notice tone="info" title={t('How to follow the plan')}>
          <ul className="m-0 list-disc ps-5">{PLAN_RULES.map((r) => <li key={r}>{t(r)}</li>)}</ul>
        </Notice>
        <MohSource />
      </Section>

      {/* Swaps */}
      <Section id="swap-h" title={t('Swap a portion')} icon={ArrowLeftRight}>
        <p className="text-sm text-muted-foreground">{t('Each food below is one portion of its group. Swap foods within the same group, and keep the same number of portions in each meal.')}</p>
        <div className="flex flex-col gap-2">
          {EXCHANGE_GROUPS.map((g) => {
            const Ico = GROUP_ICON[g.id];
            const foods = EXCHANGE_FOODS.filter((f) => f.group === g.id);
            const macros = [g.carbs != null ? t('{n} g carbs', { n: g.carbs }) : null, g.protein != null ? t('{n} g protein', { n: g.protein }) : null, g.fat != null ? t('{n} g fat', { n: g.fat }) : null].filter(Boolean).join(t(', '));
            return (
              <Accordion key={g.id} className={accCls} headClassName={accHead}
                title={<span className="inline-flex flex-wrap items-center gap-x-2"><Ico className="size-4" aria-hidden />{groupName(g, lang)} {lang === 'ar' ? null : <bdi lang="ar" dir="rtl" className="font-sans font-normal text-muted-foreground">{g.labelAr}</bdi>}<span className="font-sans font-normal text-muted-foreground">· {t('1 portion = {n} kcal', { n: g.kcal })}{macros ? `${t(', ')}${macros}` : ''}</span></span>}>
                <ul className="m-0 flex list-none flex-col divide-y divide-border px-3.5 pb-3.5">
                  {foods.map((f) => (
                    <li key={f.id} className="grid gap-x-4 gap-y-0.5 py-2 sm:grid-cols-2">
                      <span className="flex flex-col"><b className="font-semibold">{lang === 'ar' ? f.nameAr : f.name}</b><span className="text-sm">{lang === 'ar' ? f.portionAr : f.portion}</span>{f.note ? <span className="text-sm text-muted-foreground">{t(f.note)}</span> : null}</span>
                      <span className="flex flex-col"><Ar className="font-semibold text-foreground">{f.nameAr}</Ar><Ar>{f.portionAr}</Ar></span>
                    </li>
                  ))}
                </ul>
              </Accordion>
            );
          })}
          <Accordion className={accCls} headClassName={accHead} title={<span>{t('Free foods')} <span className="font-sans font-normal text-muted-foreground">· {t('under {n} kcal a portion', { n: FREE_FOOD_KCAL })}</span></span>}>
            <ul className="m-0 grid list-none gap-x-4 px-3.5 pb-3.5 sm:grid-cols-2">
              {FREE_FOODS.map((f) => (
                <li key={f.name} className="flex items-baseline justify-between gap-3 border-b border-border py-1.5">{lang === 'ar' ? <span>{f.nameAr}</span> : <><span>{f.name}</span><bdi lang="ar" dir="rtl" className="text-[.92rem] text-muted-foreground">{f.nameAr}</bdi></>}</li>
              ))}
            </ul>
          </Accordion>
        </div>
        <MohSource />
      </Section>
      <MoreFromMoh />
    </div>
  );
}

/** "Shopping list" tab: the 7-day list for the plan. Printing prints only this list. */
export function ShoppingTab({ kind, targetKcal, planKcal }: PlanProps) {
  const plan = planFor(planKcal);
  if (!targetKcal || !plan) return <NoPlan kind={kind} />;
  return (
    <div className="flex flex-col gap-5">
      {/* Printing shows the shopping list only: the site header, footer, tabs and other parts are hidden. */}
      <style>{'@media print { header, footer, nav, [href="#main"] { display: none !important; } body { background: #FFFFFF !important; padding: 0 !important; } }'}</style>
      <ShoppingList planKcal={plan.kcal} items={shoppingList(plan.meals as Record<string, Line[]>)} />
      <MoreFromMoh />
    </div>
  );
}

/** "Healthy habits" tab: MOH advice for a healthy lifestyle (shown with or without a plan). */
export function HabitsTab() {
  const { t, lang } = useT();
  return (
    <div className="flex flex-col gap-5">
      <Section id="habits-h" title={t('Healthy habits')} icon={Footprints}>
        <p className="text-sm text-muted-foreground">{t('Simple everyday habits from the same Ministry of Health guide (healthy living for weight loss in adults).')}</p>
        <div className="flex flex-col gap-2">
          {AREAS.map((a) => {
            const tips = LIFESTYLE_TIPS.filter((x) => x.area === a.id);
            const Ico = a.icon;
            return (
              <Accordion key={a.id} className={accCls} headClassName={accHead}
                title={<span className="inline-flex items-center gap-2"><Ico className="size-4" aria-hidden />{t(`${a.label} tips`)} <span className="font-sans font-normal text-muted-foreground">({tips.length})</span></span>}>
                <ul className="m-0 list-disc px-3.5 pb-3.5 ps-9 text-[.95rem]">{tips.map((x) => <li key={x.text}>{t(x.text)}</li>)}</ul>
              </Accordion>
            );
          })}
          <Accordion className={accCls} headClassName={accHead} title={<span className="inline-flex items-center gap-2"><Footprints className="size-4" aria-hidden />{t('Physical activity for adults (18–64)')}</span>}>
            <ul className="m-0 list-disc px-3.5 pb-3.5 ps-9">{ACTIVITY_GUIDE.map((x) => <li key={x}>{t(x)}</li>)}</ul>
          </Accordion>

          <Accordion className={accCls} headClassName={accHead} title={<span className="inline-flex items-center gap-2"><Salad className="size-4" aria-hidden />{t('The healthy plate')}</span>}>
            <div className="flex flex-col gap-3 px-3.5 pb-3.5">
              <div aria-hidden className="flex h-6 w-full overflow-hidden rounded-full border border-border">
                {HEALTHY_PLATE.filter((p) => p.share != null).map((p, i) => (
                  <span key={p.group} className={cn('h-full border-e-2 border-card last:border-e-0', ['bg-sage', 'bg-pink', 'bg-rose', 'bg-mint'][i % 4])} style={{ width: `${p.share}%` }} />
                ))}
              </div>
              <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4">
                {HEALTHY_PLATE.filter((p) => p.share != null).map((p, i) => (
                  <li key={p.group} className="flex items-center gap-2 text-sm">
                    <span aria-hidden className={cn('size-3 shrink-0 rounded-[3px] border border-border', ['bg-sage', 'bg-pink', 'bg-rose', 'bg-mint'][i % 4])} />
                    <span><b className="tabular">{p.share}%</b> {t(p.label)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm">{t('{groups}: shown beside the plate, because the Ministry of Health doesn’t give them a share of it.', { groups: HEALTHY_PLATE.filter((p) => p.share == null).map((p) => t(p.label)).join(t(', ')) })}</p>
            </div>
          </Accordion>

          <Accordion className={accCls} headClassName={accHead} title={<span className="inline-flex items-center gap-2"><Tag className="size-4" aria-hidden />{t('How to read a nutrition label')}</span>}>
            <div className="flex flex-col gap-3 px-3.5 pb-3.5 text-[.95rem]">
              <ol className="m-0 list-decimal ps-5">
                <li>{t(LABEL_GUIDE.servingNote)}</li>
                <li>{t('Calories per serving: {list}.', { list: LABEL_GUIDE.kcalPerServing.map((k) => (lang === 'ar' ? t('{n} kcal: {level}', { n: k.kcal, level: t(k.label) }) : `${k.kcal} kcal ${k.label.toLowerCase()}`)).join(' · ') })}</li>
                <li>{t('% daily value: {low}% or less is low; {high}% or more is high.', { low: LABEL_GUIDE.dailyValue.low, high: LABEL_GUIDE.dailyValue.high })}</li>
                <li>{t('Limit: {list}.', { list: lang === 'ar' ? LABEL_GUIDE.limit.map((x) => t(x)).join('، ') : LABEL_GUIDE.limit.join(', ').toLowerCase() })}</li>
                <li>{t('Get enough: {list}.', { list: lang === 'ar' ? LABEL_GUIDE.getEnough.map((x) => t(x)).join('، ') : LABEL_GUIDE.getEnough.join(', ').toLowerCase() })}</li>
              </ol>
            </div>
          </Accordion>

          <Accordion className={accCls} headClassName={accHead} title={<span className="inline-flex items-center gap-2"><Ruler className="size-4" aria-hidden />{t('Household measures')}</span>}>
            <div className="px-3.5 pb-3.5">
              <Table caption={t('Ministry of Health household measures')} className="text-[.9rem]">
                <thead><tr><Th scope="col">{t('Measure')}</Th><Th scope="col" className="text-end">{t('Volume')}</Th><Th scope="col">{t('Equals')}</Th></tr></thead>
                <tbody>{MEASURES.map((m) => <tr key={m.name}><Td>{t(m.name)}</Td><Td className="text-end tabular">{t('{n} ml', { n: m.ml })}</Td><Td>{t(m.note)}</Td></tr>)}</tbody>
              </Table>
            </div>
          </Accordion>
        </div>
        <MohSource />
      </Section>
      <MoreFromMoh />
    </div>
  );
}

/** The 7-day shopping list (its own tab in Eat well). */
function ShoppingList({ planKcal, items, idPrefix = '', print = false }: { planKcal: number; items: ShopItem[]; idPrefix?: string; print?: boolean }) {
  const { t, lang } = useT();
  return (
    <Section id={`${idPrefix}shop-h`} title={t('Shopping list for 7 days')} icon={ShoppingBasket} className="print:border-0 print:p-0 print:shadow-none"
      action={<Button variant="outline" size="sm" onClick={() => window.print()} className={cn('print:hidden', print && 'hidden')}><Printer aria-hidden />{t('Print')}</Button>}>
      <p className="hidden font-display text-heading print:block">{t('Mizan · MOH {n} kcal meal plan · 7 days', { n: n0(planKcal) })}</p>
      <p className="text-sm text-muted-foreground">
        {t('Everything in the Ministry of Health example for your {n} kcal plan, for 7 days. If you swap a portion for another food from the portion guide, buy that food instead.', { n: n0(planKcal) })}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {EXCHANGE_GROUPS.map((g) => {
          const rows = items.filter((it) => it.group === g.id);
          if (!rows.length) return null;
          const Ico = GROUP_ICON[g.id];
          return (
            <div key={g.id} className="flex flex-col gap-1.5 break-inside-avoid">
              <h3 className="flex items-center gap-2 text-base"><Ico className="size-4" aria-hidden />{groupName(g, lang)}</h3>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {rows.map((it) => (
                  <li key={it.key} className="flex items-start gap-2.5 rounded-[12px] border border-border bg-background px-3 py-2">
                    <span aria-hidden className="mt-1 size-4 shrink-0 rounded-[4px] border border-input bg-card" />
                    <span className="flex min-w-0 flex-col">
                      <b className="font-semibold">{lang === 'ar' ? it.nameAr ?? t(it.name) : it.name}</b>
                      <span className="text-sm tabular">{lang === 'ar'
                        ? <>{fmtAmount(it.perDay)}{unitFor(it.perDay, it.unit, lang)} {t('a day × 7 =')} <b>{fmtAmount(it.perDay * 7)}{unitFor(it.perDay * 7, it.unit, lang)}</b></>
                        : <>{fmtAmount(it.perDay)}{unitFor(it.perDay, it.unit)} a day × 7 = <b>{fmtAmount(it.perDay * 7)}{unitFor(it.perDay * 7, it.unit)}</b></>}</span>
                      {it.hint ? <span className="text-xs text-muted-foreground">{lang === 'ar' ? it.hintAr : it.hint} {t('(MOH)')}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">{t('Rice is measured cooked, as in the Ministry of Health’s portion guide. Amounts are the Ministry of Health portions × 7, and Mizan adds nothing else.')}</p>
      <MohSource />
    </Section>

  );
}
