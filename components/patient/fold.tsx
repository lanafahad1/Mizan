'use client';
// A small disclosure ("Why this meal?", "Screening results") that is safe to nest
// inside the shared Accordion. The Accordion's CSS opens every `.t-acc-panel`
// below an open one, so a nested Accordion would show up already open; this one
// keeps its own state with Tailwind classes only. Closed by default.
import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Fold({ title, children, defaultOpen = false, className, headClassName, id }: {
  title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; className?: string; headClassName?: string; id?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const panelId = React.useId();
  return (
    <div className={className} id={id} data-fold-open={open ? 'true' : 'false'}>
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}
        className={cn('flex min-h-11 w-full items-center justify-between gap-3 text-start', headClassName)}>
        <span className="min-w-0 flex-1">{title}</span>
        <ChevronDown aria-hidden className={cn('size-4 shrink-0 text-heading transition-transform duration-200 motion-reduce:transition-none', open && 'rotate-180')} />
      </button>
      <div id={panelId} role="region" inert={!open}
        className={cn('grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className={cn('min-h-0 overflow-hidden transition-opacity duration-200 motion-reduce:transition-none', open ? 'opacity-100' : 'opacity-0')}>{children}</div>
      </div>
    </div>
  );
}
