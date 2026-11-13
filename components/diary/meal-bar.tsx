'use client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/components/site/lang';
import { fmt, MEAL_IDS, MEAL_LABELS, type MealId } from './types';

/** One colour per meal (chart-1..4), the same on Home and in the diary. */
export const MEAL_COLOR: Record<MealId, string> = {
  breakfast: 'bg-chart-1', lunch: 'bg-chart-2', dinner: 'bg-chart-3', snack: 'bg-chart-4',
};

/**
 * The day's calories as a "meal bar": the big number against the target, a tag with what is
 * left (or "over by"), one bar segment per meal plus the part still left, and a small legend.
 * - no target: only what was eaten (the bar is shared out between the meals);
 * - over target: the bar is full and the tag turns amber;
 * - nothing eaten: an empty bar.
 * The bar is decorative; the same numbers are written out (legend and a sentence for screen readers).
 */
export function MealBar({ meals, target, className, size = 'md' }: {
  meals: { id: MealId; kcal: number | null | undefined }[];
  target: number | null | undefined;
  className?: string;
  size?: 'md' | 'lg';
}) {
  const { t } = useT();
  const kcalOf = (id: MealId) => Math.max(0, Math.round(meals.find((m) => m.id === id)?.kcal ?? 0));
  const parts = MEAL_IDS.map((id) => ({ id, kcal: kcalOf(id) })).filter((p) => p.kcal > 0);
  const eaten = parts.reduce((a, p) => a + p.kcal, 0);
  const hasTarget = Boolean(target && target > 0);
  const left = hasTarget ? Math.round(target! - eaten) : null;
  const over = left != null && left < 0;
  const rest = left != null && left > 0 ? left : 0;
  const legendText = (id: MealId, n: number) => `${t(MEAL_LABELS[id])} ${fmt(n)}`;
  const summary = [
    hasTarget ? t('{n} of {target} kcal eaten today.', { n: fmt(eaten), target: fmt(target) }) : t('{n} kcal eaten today.', { n: fmt(eaten) }),
    ...parts.map((p) => t('{meal}: {n} kcal', { meal: t(MEAL_LABELS[p.id]), n: fmt(p.kcal) })),
    left == null ? null : over ? t('over by {n}', { n: fmt(-left) }) : t('{n} left', { n: fmt(left) }),
  ].filter(Boolean).join(' ');
  return (
    <div className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      <p className="sr-only">{summary}</p>
      <div aria-hidden className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <p className="m-0 flex items-baseline gap-1.5 text-muted-foreground">
          <bdi dir="ltr" className="tabular">
            <b className={cn('font-display font-bold leading-none text-foreground', size === 'lg' ? 'text-[2rem]' : 'text-[1.6rem]')}>{fmt(eaten)}</b>
            {hasTarget ? <span className="text-sm font-semibold"> / {fmt(target)}</span> : null}
          </bdi>
          <span className="text-sm font-semibold">{hasTarget ? t('kcal') : t('kcal eaten')}</span>
        </p>
        {left == null ? null : over
          ? <Badge variant="warn">{t('over by {n}', { n: fmt(-left) })}</Badge>
          : <Badge variant="info">{t('{n} left', { n: fmt(left) })}</Badge>}
      </div>
      <div aria-hidden className="flex h-3.5 w-full gap-1 overflow-hidden" data-testid="meal-bar">
        {parts.map((p) => <span key={p.id} className={cn('min-w-1.5 rounded-full', MEAL_COLOR[p.id])} style={{ flexGrow: p.kcal, flexBasis: 0 }} />)}
        {rest > 0 || !parts.length ? <span className="rounded-full bg-muted shadow-[inset_0_0_0_1px_var(--border)]" style={{ flexGrow: rest || 1, flexBasis: 0 }} /> : null}
      </div>
      {parts.length || rest > 0 ? (
        <ul aria-hidden className="m-0 grid list-none grid-cols-2 gap-x-3 gap-y-1 p-0 text-[.8rem] text-muted-foreground sm:flex sm:flex-wrap sm:gap-x-4">
          {parts.map((p) => (
            <li key={p.id} className="flex min-w-0 items-center gap-1.5"><i className={cn('size-2.5 shrink-0 rounded-[3px]', MEAL_COLOR[p.id])} /><span className="truncate tabular">{legendText(p.id, p.kcal)}</span></li>
          ))}
          {rest > 0 ? <li className="flex min-w-0 items-center gap-1.5"><i className="size-2.5 shrink-0 rounded-[3px] border border-border bg-muted" /><span className="truncate tabular">{t('Left {n}', { n: fmt(rest) })}</span></li> : null}
        </ul>
      ) : null}
    </div>
  );
}
