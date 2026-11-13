'use client';
import type * as React from 'react';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { fmt, LABELS, UNITS, type NutrientKey, type Nutrients } from './types';

/**
 * One nutrient against its target: label, "eaten / target unit" and a thin bar.
 * Without a target only the amount is shown. Going over is written in words.
 */
export function NutrientBar({ k, value, target, missing = 0, compact = false }: { k: NutrientKey; value: number | null | undefined; target?: number | null; missing?: number; compact?: boolean }) {
  const { t } = useT();
  const v = value ?? 0;
  const share = target ? Math.min(v / target, 1) : 0;
  const over = Boolean(target && v > target);
  const unit = t(UNITS[k]);
  return (
    <div className={cn('flex flex-col', compact ? 'gap-1' : 'gap-1.5')}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className={cn('font-display font-medium text-heading', compact && 'text-[.85rem]')}>{t(LABELS[k])}</span>
        <span className="tabular text-end" dir="ltr">
          <b className="font-semibold text-foreground">{fmt(v, k)}</b>
          {target ? <span className="text-muted-foreground"> / {fmt(target, k)} {unit}</span> : <span className="text-muted-foreground"> {unit}</span>}
          {over ? <span dir="auto" className="ms-1.5 font-semibold text-destructive">· {t('{amount} over', { amount: `${fmt(v - target!, k)} ${unit}` })}</span> : null}
          {missing ? <span className="sr-only"> ({missing === 1 ? t('1 entry does not report {nutrient}', { nutrient: t(LABELS[k]).toLowerCase() }) : t('{n} entries do not report {nutrient}', { n: missing, nutrient: t(LABELS[k]).toLowerCase() })})</span> : null}
        </span>
      </div>
      {target ? (
        <div aria-hidden className={cn('overflow-hidden rounded-full bg-mint', compact ? 'h-1.5' : 'h-2')}>
          <div className={cn('mz-bar h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none', over ? 'bg-destructive' : 'bg-primary')} style={{ width: `${share * 100}%` }} />
        </div>
      ) : null}
    </div>
  );
}

/** One macro as a small column: name, amount (of target) and a short bar. */
function MacroMini({ k, value, target, missing = 0, i = 0 }: { k: NutrientKey; value: number | null | undefined; target?: number | null; missing?: number; i?: number }) {
  const { t } = useT();
  const v = value ?? 0;
  const share = target ? Math.min(v / target, 1) : 0;
  const over = Boolean(target && v > target);
  const unit = t(UNITS[k]);
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="font-display text-[.82rem] font-medium text-heading">{t(LABELS[k])}</span>
      <span className="self-start tabular text-sm leading-tight" dir="ltr">
        <b className="font-semibold text-foreground">{fmt(v, k)}</b>
        <span className="text-muted-foreground">{target ? ` / ${fmt(target, k)}` : ''} {unit}</span>
        {missing ? <span className="sr-only"> ({missing === 1 ? t('1 entry does not report {nutrient}', { nutrient: t(LABELS[k]).toLowerCase() }) : t('{n} entries do not report {nutrient}', { n: missing, nutrient: t(LABELS[k]).toLowerCase() })})</span> : null}
      </span>
      {target ? (
        <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-mint">
          <div className={cn('mz-bar h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none', over ? 'bg-destructive' : 'bg-primary')} style={{ width: `${share * 100}%`, '--i': i } as React.CSSProperties} />
        </div>
      ) : null}
      {over ? <span dir="auto" className="text-xs font-semibold text-destructive">{t('{amount} over', { amount: `${fmt(v - target!, k)} ${unit}` })}</span> : null}
    </div>
  );
}

/** Carbs, protein and fat as three small bars side by side. */
export function MacroBars({ totals, targets, missing }: { totals: Nutrients; targets: Nutrients | null; missing: Partial<Record<NutrientKey, number>> }) {
  return (
    <div className="mz-play grid grid-cols-3 gap-3 sm:gap-5">
      {(['carbs', 'protein', 'fat'] as const).map((k, i) => <MacroMini key={k} k={k} value={totals[k]} target={targets?.[k]} missing={missing[k]} i={i} />)}
    </div>
  );
}

/** Sugar and sodium (shown under "More"). */
export function MinorBars({ totals, targets, missing }: { totals: Nutrients; targets: Nutrients | null; missing: Partial<Record<NutrientKey, number>> }) {
  return (
    <div className="mz-play grid grid-cols-1 gap-3 sm:grid-cols-2">
      {(['sugar', 'sodium'] as const).map((k) => <NutrientBar key={k} k={k} value={totals[k]} target={targets?.[k]} missing={missing[k]} compact />)}
    </div>
  );
}
