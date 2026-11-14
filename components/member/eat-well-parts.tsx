'use client';
// Small pieces shared by the Eat well tabs (app/my-plan/plan-view.tsx, the plate
// builder and the label lessons): a section card and the MOH Calorie Guide source line.
import * as React from 'react';
import { MOH_GUIDE_META } from '@/data/moh-calorie-guide.js';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';

type Icon = React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

export function MohSource({ className }: { className?: string }) {
  const { t, lang } = useT();
  if (lang === 'ar') {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        {t('Source:')} <a href={MOH_GUIDE_META.url} target="_blank" rel="noopener noreferrer">{MOH_GUIDE_META.titleAr}<span className="sr-only"> {t('(opens in a new tab)')}</span></a>{' '}
        {t('Saudi Ministry of Health, Live Well programme.')}
      </p>
    );
  }
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      Source: <a href={MOH_GUIDE_META.url} target="_blank" rel="noopener noreferrer">Saudi Ministry of Health, Calorie Guide for Weight Loss<span className="sr-only"> (opens in a new tab)</span></a>{' '}
      (<bdi lang="ar" dir="rtl">{MOH_GUIDE_META.titleAr}</bdi>), Live Well programme.
    </p>
  );
}

export function Section({ id, title, icon: Ico, children, action, className }: { id: string; title: string; icon: Icon; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn('flex min-w-0 flex-col gap-4 rounded-[20px] border border-border bg-card p-4 shadow-soft sm:p-5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 id={id} className="flex items-center gap-2 text-lg sm:text-xl"><Ico className="size-5 shrink-0" aria-hidden /><span>{title}</span></h2>
        {action}
      </div>
      {children}
    </section>
  );
}

