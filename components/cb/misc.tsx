'use client';
import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Illustration } from '@/components/illustrations/illustration';
import type { IllustrationName } from '@/lib/illustrations';
import { ABOUT_NAV } from '@/lib/site';
import { useT } from '@/components/site/lang';

export function PatientHeader({ b, link = true }: { b: { id: string; demoId: string; preferredName?: string; ward: string; wardLabel?: string; bed: string; ageRange?: string }; link?: boolean }) {
  const { t } = useT();
  return (
    <div className="flex min-w-0 flex-col">
      <span className="w-fit rounded-[8px] border border-border bg-blush px-1.5 font-mono text-[.8rem] font-bold text-rose-ink">{b.demoId}</span>
      <span className="font-display text-lg font-semibold text-heading">{link ? <Link href={`/patients/${b.id}`} className="no-underline hover:underline">{b.preferredName || b.demoId}</Link> : b.preferredName || b.demoId}</span>
      <span className="text-sm text-muted-foreground">{b.wardLabel ? t(b.wardLabel) : t('Ward {ward}', { ward: b.ward })} · {t('Bed {bed}', { bed: b.bed })}{b.ageRange ? ` · ${t(b.ageRange)}` : ''}</span>
    </div>
  );
}

/** Demo-ID pill used in tables and lists. */
export const Pid = ({ children }: { children: React.ReactNode }) => <span className="rounded-[8px] border border-border bg-blush px-1.5 font-mono text-[.8rem] font-bold whitespace-nowrap text-rose-ink">{children}</span>;

/** Secondary navigation inside "About & Sources". */
export function AboutNav({ current }: { current: string }) {
  const { t } = useT();
  return (
    <nav aria-label={t('About and sources')} className="container-page flex flex-wrap items-center gap-2 pt-6">
      <span className="me-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('About & Sources')}</span>
      {ABOUT_NAV.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.href === current ? 'page' : undefined}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground no-underline hover:bg-mint aria-[current=page]:border-primary aria-[current=page]:bg-mint aria-[current=page]:text-sage-deep">
          {t(i.label)}
        </Link>
      ))}
    </nav>
  );
}

/** Empty state: an illustration, what is missing and one next action. */
export function EmptyState({ title, children, action, className, art = true, illustration = 'empty-generic' }: { title: string; children?: React.ReactNode; action?: React.ReactNode; className?: string; art?: boolean; illustration?: IllustrationName }) {
  const { t } = useT();
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-input bg-card/70 px-6 py-10 text-center', className)}>
      {art ? <Illustration name={illustration} className="h-[85px] w-24 sm:h-[106px] sm:w-[120px]" /> : null}
      <h3 className="text-lg">{t(title)}</h3>
      {children ? <div className="max-w-md text-muted-foreground">{children}</div> : null}
      {action}
    </div>
  );
}

/** Stat tile for dashboards and summaries. */
export function Stat({ value, label, tone = 'default' }: { value: React.ReactNode; label: React.ReactNode; tone?: 'default' | 'danger' | 'warn' | 'ok' }) {
  const { t } = useT();
  return (
    <div className={cn('flex flex-col gap-1 rounded-[16px] border px-4 py-3', tone === 'danger' ? 'border-destructive-border bg-destructive-soft' : tone === 'warn' ? 'border-warning-border bg-warning-soft' : tone === 'ok' ? 'border-success-border bg-success-soft' : 'border-border bg-card')}>
      <b className="font-display text-2xl font-semibold text-heading tabular">{value}</b>
      <small className="text-sm text-muted-foreground">{typeof label === 'string' ? t(label) : label}</small>
    </div>
  );
}
