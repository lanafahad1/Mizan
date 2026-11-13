import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Meal card "Row": a compact horizontal card for lists. A square picture on the start side,
 * then the name, one facts line ("540 kcal · 320 g · 38 g protein") and the status tags.
 * `children` go under the row (buttons, folded details). Used by Eat well ideas, the diary
 * food lists and the patient's meal options.
 */
export function RowCard({ art, title, facts, sub, tags, children, className, artClassName, size = 'md', as: As = 'li', ...rest }: {
  art: React.ReactNode;
  title: React.ReactNode;
  facts?: (string | null | undefined | false)[];
  /** A second, quieter line under the facts (cuisine, brand…). */
  sub?: React.ReactNode;
  tags?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  artClassName?: string;
  /** md = 76 px picture (cards), sm = 56 px picture (long food lists). */
  size?: 'md' | 'sm';
  as?: 'li' | 'article' | 'div';
} & Omit<React.HTMLAttributes<HTMLElement>, 'title'>) {
  const line = (facts ?? []).filter(Boolean).join(' · ');
  return (
    <As className={cn('flex min-w-0 flex-col gap-3', className)} {...rest}>
      <div className={cn('grid items-center gap-3', size === 'md' ? 'grid-cols-[76px_minmax(0,1fr)]' : 'grid-cols-[56px_minmax(0,1fr)]')}>
        <div aria-hidden className={cn('grid aspect-square w-full place-items-center overflow-hidden bg-muted [&>div]:size-full [&>svg]:size-full', size === 'md' ? 'rounded-[14px]' : 'rounded-[12px]', artClassName)}>{art}</div>
        <div className="flex min-w-0 flex-col gap-0.5">
          {title}
          {line ? <p className="m-0 text-sm text-muted-foreground tabular">{line}</p> : null}
          {sub ? <div className="text-[.8rem] text-muted-foreground">{sub}</div> : null}
          {tags ? <div className="mt-1 flex flex-wrap gap-1.5">{tags}</div> : null}
        </div>
      </div>
      {children}
    </As>
  );
}
