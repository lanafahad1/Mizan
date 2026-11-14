'use client';
import { useT } from '@/components/site/lang';
import { sourceLabel } from './types';

/** Where a food's values come from, as small quiet text (not a pill), so food lists stay calm. */
export function SourceBadge({ basis, sourceId, className }: { basis?: string | null; sourceId?: string | null; className?: string }) {
  const { t } = useT();
  const s = sourceLabel({ basis, sourceId });
  return <span className={`inline-block max-w-full text-start text-[.78rem] leading-snug text-muted-foreground ${className ?? ''}`}>{t(s.text)}</span>;
}

/** An Arabic name, isolated (<bdi>) so brackets and punctuation around it stay in place on English pages. */
export function ArabicName({ children, className }: { children?: string | null; className?: string }) {
  if (!children) return null;
  return <bdi dir="rtl" lang="ar" className={className}>{children}</bdi>;
}
