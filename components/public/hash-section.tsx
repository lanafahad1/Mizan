'use client';
// A collapsible section with a real heading (h2 or h3) around its toggle
// button. Closed by default; it opens itself when the URL points at it or at
// something inside it (`/page#<id>` or `/page?section=<id>`), so links from
// other pages keep working.
import * as React from 'react';
import { cn } from '@/lib/utils';

function target(): string | null {
  const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''));
  if (hash) return hash;
  return new URLSearchParams(window.location.search).get('section');
}

export function HashSection({ id, title, as: As = 'h2', children, className, headClassName, meta, defaultOpen = false }: {
  id: string; title: React.ReactNode; as?: 'h2' | 'h3'; children: React.ReactNode; className?: string; headClassName?: string; meta?: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const ref = React.useRef<HTMLElement>(null);
  const panelId = React.useId();

  React.useEffect(() => {
    const check = (scroll: boolean) => {
      const t = target();
      if (!t || !ref.current) return;
      const el = t === id ? ref.current : document.getElementById(t);
      if (!el || !ref.current.contains(el)) return;
      setOpen(true);
      // The innermost section scrolls once the panels have expanded.
      if (scroll && t === id) window.setTimeout(() => el.scrollIntoView({ block: 'start', behavior: 'smooth' }), 320);
    };
    check(true);
    const onHash = () => check(true);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [id]);

  return (
    <section ref={ref} id={id} className={cn('t-acc scroll-mt-24', className)} data-open={open ? 'true' : 'false'}>
      <As className="m-0">
        <button type="button" className={cn('t-acc-head flex w-full items-center justify-between gap-3 text-start', headClassName)} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span>{title}</span>
            {meta ? <span className="font-sans text-sm font-normal text-muted-foreground">{meta}</span> : null}
          </span>
          <span className="t-acc-chevron text-heading" aria-hidden>
            <svg viewBox="0 0 16 16" width="16" height="16"><path d="M4 6.5L8 10.5L12 6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </button>
      </As>
      <div className="t-acc-panel" id={panelId} role="region" inert={!open}>
        <div className="t-acc-panel-inner">{children}</div>
      </div>
    </section>
  );
}
