'use client';
// Shared pieces of the health space (members, patients and the care team's Health tab).
import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** API path of a health space: "me" (signed-in member or patient) or a hospital patient id (care team). */
export const H = (who: string, path = '') => `/api/health/${encodeURIComponent(who)}${path}`;

export const fmtNum = (v: number | null | undefined, d = 0) => (v == null ? '–' : v.toLocaleString('en-GB', { maximumFractionDigits: d, minimumFractionDigits: 0 }));

/** A small "Source: …" line linking to the sources page. */
export function SourceNote({ children, className }: { children: React.ReactNode; className?: string }) {
  const { t } = useT();
  return <p className={cn('text-xs text-muted-foreground', className)}>{t('Source:')} {children} <Link href="/sources" className="whitespace-nowrap">{t('All sources')}</Link></p>;
}

/** One headline number with a label and an optional line underneath. */
export function Stat({ label, value, unit, sub, tone = 'default' }: { label: string; value: React.ReactNode; unit?: string; sub?: React.ReactNode; tone?: 'default' | 'warn' | 'ok' }) {
  const { t } = useT();
  return (
    <div className={cn('flex min-w-0 flex-col gap-0.5 rounded-[14px] border px-4 py-3', tone === 'warn' ? 'border-rose bg-blush' : tone === 'ok' ? 'border-sage bg-mint' : 'border-border bg-card')}>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(label)}</span>
      <span className="font-display text-2xl font-semibold text-heading tabular">{value}{unit ? <span className="ms-1 text-sm font-normal text-muted-foreground">{t(unit)}</span> : null}</span>
      {sub ? <span className="text-sm text-muted-foreground">{sub}</span> : null}
    </div>
  );
}

/** MOH BMI categories as an accessible scale with the person's position. */
export function BmiScale({ value }: { value: number | null }) {
  const { t } = useT();
  const bands = [
    { label: 'Under', max: 18.5, cls: 'bg-blush' }, { label: 'Healthy', max: 25, cls: 'bg-mint' }, { label: 'Over', max: 30, cls: 'bg-pink' },
    { label: 'Obesity 1', max: 35, cls: 'bg-rose' }, { label: 'Obesity 2', max: 40, cls: 'bg-pink-deep' }, { label: 'Obesity 3', max: 45, cls: 'bg-rose-ink/70' },
  ];
  const min = 15;
  const max = 45;
  const pos = value == null ? null : Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return (
    <div className="flex flex-col gap-1" dir="ltr" role="img" aria-label={value == null ? t('BMI not available') : t('BMI {value} on the MOH scale', { value })}>
      <div className="relative flex h-2.5 overflow-hidden rounded-full">
        {bands.map((b, i) => <span key={b.label} className={b.cls} style={{ width: `${(((b.max - (i ? bands[i - 1].max : min)) / (max - min)) * 100)}%` }} />)}
        {pos != null ? <span className="absolute -top-1 h-4.5 w-1 rounded-full bg-heading" style={{ left: `calc(${pos}% - 2px)` }} /> : null}
      </div>
      <div className="flex justify-between text-[.7rem] text-muted-foreground" aria-hidden><span>18.5</span><span>25</span><span>30</span><span>35</span><span>40</span></div>
    </div>
  );
}

/** Progress of an amount against a target (no colour judgement beyond "over"). */
export function TargetBar({ label, value, target, unit, d = 0 }: { label: string; value: number | null; target?: number | null; unit: string; d?: number }) {
  const { t } = useT();
  const pct = target ? Math.min(100, ((value ?? 0) / target) * 100) : 0;
  const over = target != null && (value ?? 0) > target;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold text-heading">{t(label)}</span>
        <span className="tabular text-muted-foreground" dir="ltr">{fmtNum(value, d)}{target ? ` / ${fmtNum(target)}` : ''} {t(unit)}</span>
      </div>
      {target ? (
        <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={t(label)} aria-valuemin={0} aria-valuemax={target} aria-valuenow={value ?? 0}>
          <div className={cn('h-full rounded-full', over ? 'bg-rose-ink/70' : 'bg-primary')} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
    </div>
  );
}

export const ASSESSMENT_BADGE: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'border-border bg-muted text-heading' },
  'awaiting-review': { label: 'Awaiting review', cls: 'border-pink bg-blush text-rose-ink' },
  'more-info': { label: 'More information needed', cls: 'border-rose bg-blush text-rose-ink' },
  approved: { label: 'Plan approved', cls: 'border-sage bg-mint text-sage-deep' },
  completed: { label: 'Completed', cls: 'border-sage bg-mint text-sage-deep' },
};

export function StatusPill({ status }: { status: string }) {
  const { t } = useT();
  const b = ASSESSMENT_BADGE[status] ?? ASSESSMENT_BADGE.draft;
  return <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold', b.cls)}>{t(b.label)}</span>;
}

export type Overview = any;
