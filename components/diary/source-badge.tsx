'use client';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/components/site/lang';
import { sourceLabel } from './types';

/** Where a food's values come from, as a small text badge. */
export function SourceBadge({ basis, sourceId, className }: { basis?: string | null; sourceId?: string | null; className?: string }) {
  const { t } = useT();
  const s = sourceLabel({ basis, sourceId });
  return <Badge variant={s.tone} className={`max-w-full whitespace-normal text-start ${className ?? ''}`}>{t(s.text)}</Badge>;
}

/** An Arabic name, isolated (<bdi>) so brackets and punctuation around it stay in place on English pages. */
export function ArabicName({ children, className }: { children?: string | null; className?: string }) {
  if (!children) return null;
  return <bdi dir="rtl" lang="ar" className={className}>{children}</bdi>;
}
