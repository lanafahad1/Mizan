'use client';
// One approved option inside a meal period on My Meals, kept compact: a small
// picture beside the name, one facts line (energy and portion), allergen chips,
// "Why this meal?" folded, and "Choose this meal" as the one primary button.
import * as React from 'react';
import Link from 'next/link';
import { Info, Check, Sparkles, HeartPulse, Layers, TriangleAlert, ShieldCheck } from 'lucide-react';
import { MealArt, NutriSummary } from '@/components/cb/meal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NativeSelect, Label } from '@/components/ui/input';
import { portionLabel, allergenName } from '@/components/cb/labels';
import { portionFactor } from '@/domain/constants.js';
import { cn } from '@/lib/utils';
import { youT } from './helpers';
import { Fold } from './fold';
import { useT } from '@/components/site/lang';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Option = any;
type Nutrition = Record<string, number | null> | null | undefined;

/** Values per standard serving scaled by the portion factor the engine uses (small ½, large 1½). Missing values stay missing. */
const forPortion = (n: Nutrition, portion: string): Record<string, number | null> | null => {
  if (!n) return null;
  const f = portionFactor(portion);
  return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v == null ? null : v * f]));
};

/** Meal name in the viewer's language (a single dish uses its Arabic name when there is one). */
function useMealName(o: Option) {
  const { t, lang } = useT();
  const tr = t(o.name);
  if (lang === 'ar' && tr === o.name && o.type !== 'complete' && o.components?.[0]?.nameAr) return o.components[0].nameAr as string;
  return tr;
}

/** "Why this meal?" from the patient-facing summary the server sends (no rule codes or points). */
export function PatientWhy({ o, portion, defaultOpen = false }: { o: Option; portion: string; defaultOpen?: boolean }) {
  const { t, lang } = useT();
  const w = o.why;
  const sep = lang === 'ar' ? '، ' : ', ';
  const checks = w.checks.map((c: string) => t(c)).join(sep).toLowerCase();
  // The portion sentence is shown once, exactly as the engine wrote it.
  const reasons: string[] = w.reasons.filter((r: string) => r !== w.portionExplanation);
  const a = o.allergens;
  const n = forPortion(o.nutrition, portion);
  const partial = forPortion(o.nutritionPartial, portion);
  const portionName = t(portionLabel(portion)).toLowerCase();
  return (
    <Fold defaultOpen={defaultOpen} className="rounded-[14px] border border-sage bg-mint/60" headClassName="px-3.5 py-2 font-display text-sm font-semibold text-heading"
      title={<span className="inline-flex items-center gap-2"><Info className="size-4" aria-hidden />{t('Why this meal?')}</span>}>
      <div className="flex flex-col gap-3 px-3.5 pb-3.5">
        <ul className="flex flex-col gap-1.5 text-sm">
          <li className="flex items-start gap-2"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-heading" /><span>{w.checks.length ? t('Fits your recorded diet and allergies: {checks}.', { checks }) : t('Checked against your recorded diet, allergies and restrictions.')}</span></li>
          {w.portionExplanation ? <li className="flex items-start gap-2"><Layers aria-hidden className="mt-0.5 size-4 shrink-0 text-heading" /><span>{youT(w.portionExplanation, t, lang)}</span></li> : null}
          {reasons.map((r, i) => <li key={i} className="flex items-start gap-2"><Sparkles aria-hidden className="mt-0.5 size-4 shrink-0 text-heading" /><span>{youT(r, t, lang)}</span></li>)}
          {w.reviewed ? <li className="flex items-start gap-2"><HeartPulse aria-hidden className="mt-0.5 size-4 shrink-0 text-heading" /><span>{o.offer.reviewNote ? t('Checked by an admin: {note}', { note: t(o.offer.reviewNote) }) : t('Checked by an admin.')}</span></li> : null}
        </ul>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-muted-foreground">{t('Nutrition for the {portion} portion', { portion: portionName })}</span>
          <NutriSummary n={n} caption={t('Nutrition for the {portion} portion', { portion: portionName })} partial={partial} missingFrom={o.nutritionMissingFrom} />
        </div>
        {o.description ? <p className="text-sm text-muted-foreground">{t(o.description)}</p> : null}
        {a.labelCheck.length ? <p className="text-sm text-muted-foreground">{t('Kitchen checks labels:')} {a.labelCheck.map((x: string) => t(x)).join(sep)}</p> : null}
        <p className="text-xs text-muted-foreground">{t('Approved for you by {name} from the nutrition team. Your preferences only change the order of options. They never override your diet or allergies.', { name: o.offer.approvedByName })}</p>
      </div>
    </Fold>
  );
}

/** Allergens as chips: always text, never colour alone. */
function AllergenChips({ a }: { a: { contains: string[]; mayContain: string[] } }) {
  const { t } = useT();
  const an = (id: string) => allergenName(id, t);
  if (!a.contains.length && !a.mayContain.length) return <div><Badge variant="ok" className="whitespace-normal"><ShieldCheck aria-hidden />{t('None of the 14 SFDA allergens')}</Badge></div>;
  return (
    <ul aria-label={t('Allergens')} className="m-0 flex list-none flex-wrap gap-1.5 p-0">
      {a.contains.map((x) => <li key={`c-${x}`}><Badge variant="rose" className="whitespace-normal">{t('Contains {allergen}', { allergen: an(x) })}</Badge></li>)}
      {a.mayContain.map((x) => <li key={`m-${x}`}><Badge variant="warn" className="whitespace-normal"><TriangleAlert aria-hidden />{t('May contain {allergen}', { allergen: an(x) })}</Badge></li>)}
    </ul>
  );
}

export function MealOption({ o, period, date, chosen, chosenPortion, canChoose, busy, onChoose }: {
  o: Option; period: string; date: string; chosen: boolean; chosenPortion?: string | null; canChoose: boolean; busy: boolean; onChoose: (mealId: string, portion: string) => void;
}) {
  const { t, lang } = useT();
  const portions: string[] = o.offer.portions;
  const [portion, setPortion] = React.useState<string>((chosen && chosenPortion) || o.offer.suggestedPortion || portions[0]);
  const selectId = `pt-${period}-${o.id}`;
  const name = useMealName(o);
  const kcal = forPortion(o.nutrition, portion)?.kcal;
  const portionText = t('{portion} portion', { portion: t(portionLabel(portion)) });
  const facts = [t(o.cuisine), kcal != null ? t('{n} kcal', { n: Math.round(kcal) }) : null, portionText].filter(Boolean).join(' · ');
  const chooseText = chosen ? t('Update my choice') : t('Choose this meal');
  return (
    <article className={cn('flex flex-col gap-3 rounded-[18px] border bg-card p-3 sm:p-4', chosen ? 'border-heading bg-mint/40 ring-2 ring-heading' : 'border-border')}
      aria-label={chosen ? `${t('Your choice')}: ${name}` : name}>
      <div className="flex items-start gap-3">
        <MealArt meal={o} className="aspect-[4/3] w-24 shrink-0 sm:w-36" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {chosen ? <span className="inline-flex items-center gap-1 font-display text-sm font-semibold text-heading"><Check className="size-4" aria-hidden />{t('Your choice')}</span> : null}
          <h3 className="text-base leading-snug"><Link href={`/meal/${o.id}?date=${date}&period=${period}`} className="no-underline hover:underline">{name}</Link></h3>
          <p className="text-sm text-muted-foreground">{facts}</p>
          <AllergenChips a={o.allergens} />
        </div>
      </div>
      <PatientWhy o={o} portion={portion} />
      {canChoose ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          {portions.length > 1 ? (
            <div className="flex flex-col gap-1.5 sm:min-w-56">
              <Label htmlFor={selectId}>{t('Portion')}</Label>
              <NativeSelect id={selectId} value={portion} onChange={(e) => setPortion(e.target.value)}>
                {portions.map((p) => <option key={p} value={p}>{t(portionLabel(p))}{p === o.offer.suggestedPortion ? ` ${t('(suggested)')}` : ''}</option>)}
              </NativeSelect>
            </div>
          ) : null}
          <Button variant={chosen ? 'outline' : 'default'} disabled={busy} onClick={() => onChoose(o.id, portion)} className="w-full sm:w-auto"
            aria-label={`${chooseText}: ${name}${lang === 'ar' ? '، ' : ', '}${portionText}`}>
            {chosen ? <Check aria-hidden /> : null}{busy ? t('Sending…') : chooseText}
          </Button>
        </div>
      ) : null}
    </article>
  );
}
