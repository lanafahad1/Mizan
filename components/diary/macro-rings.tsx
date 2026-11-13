'use client';
import type * as React from 'react';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { fmt, LABELS, UNITS, type NutrientKey, type Nutrients } from './types';
import { MacroBars } from './macro-bars';

const KEYS = ['carbs', 'protein', 'fat'] as const;
/** Ring colour per macro (theme chart tokens, so dark mode follows). */
const COLOR: Record<(typeof KEYS)[number], string> = { carbs: 'var(--chart-2)', protein: 'var(--chart-1)', fat: 'var(--chart-5)' };
const R = [84, 64, 44];

/**
 * Carbs, protein and fat as three rings filling towards today's goals, with the amounts beside them.
 * The rings are decorative (aria-hidden): every number is also written out in the list.
 * Going over a goal fills the ring in the warning colour and says so in words.
 * Without goals there is nothing to fill towards, so the plain amounts are shown instead.
 */
export function MacroRings({ totals, targets, missing }: { totals: Nutrients; targets: Nutrients | null; missing: Partial<Record<NutrientKey, number>> }) {
  const { t } = useT();
  if (!targets || KEYS.some((k) => !targets[k])) return <MacroBars totals={totals} targets={targets} missing={missing} />;
  const rows = KEYS.map((k) => {
    const v = totals[k] ?? 0;
    const goal = targets[k]!;
    return { k, v, goal, share: Math.min(v / goal, 1), over: v > goal };
  });
  const avg = Math.round((rows.reduce((s, r) => s + r.share, 0) / rows.length) * 100);

  return (
    <div className="mz-play grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-6">
      <svg viewBox="0 0 200 200" aria-hidden className="h-auto w-full max-w-40 overflow-visible">
        {rows.map((r, i) => (
          <g key={r.k}>
            <circle cx="100" cy="100" r={R[i]} fill="none" strokeWidth="15" className="stroke-mint" />
            <circle cx="100" cy="100" r={R[i]} fill="none" strokeWidth="15" strokeLinecap="round" pathLength={100}
              transform="rotate(-90 100 100)"
              className="mz-ring"
              stroke={r.over ? 'var(--destructive)' : COLOR[r.k]}
              style={{ strokeDasharray: `${r.share * 100} 100`, opacity: r.v > 0 ? 1 : 0, '--i': i } as React.CSSProperties} />
          </g>
        ))}
        <text x="100" y="104" textAnchor="middle" className="fill-heading font-display text-[26px] font-semibold tabular">{avg}%</text>
        <text x="100" y="124" textAnchor="middle" className="fill-muted-foreground text-[12px]">{t('of goals')}</text>
      </svg>
      <ul className="flex min-w-0 flex-col gap-2.5">
        {rows.map((r) => {
          const unit = t(UNITS[r.k]);
          const n = missing[r.k] ?? 0;
          return (
            <li key={r.k} className="flex min-w-0 flex-col gap-0.5">
              <span className="inline-flex items-center gap-2 font-display text-[.88rem] font-medium text-heading">
                <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: r.over ? 'var(--destructive)' : COLOR[r.k] }} />
                {t(LABELS[r.k])}
              </span>
              <span className="tabular text-sm leading-tight" dir="ltr">
                <b className="font-semibold text-foreground">{fmt(r.v, r.k)}</b>
                <span className="text-muted-foreground"> / {fmt(r.goal, r.k)} {unit}</span>
                {n ? <span className="sr-only"> ({n === 1 ? t('1 entry does not report {nutrient}', { nutrient: t(LABELS[r.k]).toLowerCase() }) : t('{n} entries do not report {nutrient}', { n, nutrient: t(LABELS[r.k]).toLowerCase() })})</span> : null}
              </span>
              {r.over ? <span dir="auto" className={cn('text-xs font-semibold text-destructive')}>{t('{amount} over', { amount: `${fmt(r.v - r.goal, r.k)} ${unit}` })}</span> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
