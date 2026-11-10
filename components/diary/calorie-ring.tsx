'use client';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { fmt } from './types';

/**
 * Calories eaten against the day's target as a ring. The numbers are always
 * written out next to it (the ring is decorative for screen readers).
 * `show="left"` puts the calories left (or over) in the middle instead of the calories eaten.
 */
export function CalorieRing({ eaten, target, className, show = 'eaten', size = 132 }: {
  eaten: number; target: number | null | undefined; className?: string; show?: 'eaten' | 'left'; size?: number;
}) {
  const { t } = useT();
  const stroke = Math.round(size / 11);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const share = target ? Math.min(eaten / target, 1) : 0;
  const over = Boolean(target && eaten > target);
  const left = target ? target - eaten : null;
  const big = show === 'left' && left != null ? Math.abs(left) : eaten;
  const small = show === 'left' && left != null ? (left >= 0 ? t('kcal left') : t('kcal over')) : target ? t('of {n} kcal', { n: fmt(target) }) : t('kcal eaten');
  return (
    <div className={cn('relative grid shrink-0 place-items-center', className)} style={{ width: size, height: size }}>
      <svg aria-hidden width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--cb-mint)" strokeWidth={stroke} />
        {target ? (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
            stroke={over ? 'var(--destructive)' : 'var(--cb-heading)'} strokeDasharray={c} strokeDashoffset={c * (1 - share)}
            className="transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none" />
        ) : null}
      </svg>
      <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
        <b className={cn('font-display font-semibold tabular', size >= 150 ? 'text-[2.1rem]' : 'text-[1.65rem]', over && show === 'left' ? 'text-destructive' : 'text-heading')}>{fmt(big)}</b>
        <small className="text-xs text-muted-foreground">{small}</small>
      </div>
    </div>
  );
}
