import * as React from 'react';
import { cn } from '@/lib/utils';
import { SPACE_CLASS, type Space } from '@/lib/site';

/**
 * Width of a page block. `space` picks the one width of that space (member & patient 880px,
 * staff 1200px) and wins over `narrow`; public pages leave it out (1180px, or 760px when narrow).
 */
export function containerClass({ space, narrow }: { space?: Space; narrow?: boolean } = {}) {
  return cn('container-page', space && space !== 'public' ? SPACE_CLASS[space] : narrow && 'container-narrow');
}

type Width = { narrow?: boolean; space?: Space };

/** Page title block: eyebrow, h1, intro and an optional action area. */
export function PageHead({ eyebrow, title, children, actions, className, narrow, space }: { eyebrow?: React.ReactNode; title: React.ReactNode; children?: React.ReactNode; actions?: React.ReactNode; className?: string } & Width) {
  return (
    <div className={cn(containerClass({ space, narrow }), 'flex flex-col gap-4 pb-6 pt-8 sm:pt-12 md:flex-row md:items-end md:justify-between', className)}>
      <div className="flex max-w-3xl flex-col gap-3">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1 className="text-[2rem] leading-tight sm:text-[2.6rem]">{title}</h1>
        {children ? <div className="text-[1.05rem] text-muted-foreground [&_p+p]:mt-2">{children}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 md:justify-end">{actions}</div> : null}
    </div>
  );
}

/** Main content wrapper with bottom spacing. */
export function PageBody({ children, className, narrow, space }: { children: React.ReactNode; className?: string } & Width) {
  return <div className={cn(containerClass({ space, narrow }), 'flex flex-col gap-6 pb-16', className)}>{children}</div>;
}
