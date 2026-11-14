'use client';
// A small link from packaged foods (search results, barcode and pack-label foods) to
// the Ministry of Health label lessons in Eat well. It opens in a new tab, so the food
// being logged is not lost.
import Link from 'next/link';
import { Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';

export const LABELS_HREF = '/eat-well?tab=habits#labels';

export function LabelLessonLink({ className }: { className?: string }) {
  const { t } = useT();
  return (
    <Link href={LABELS_HREF} target="_blank" rel="noopener" className={cn('inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-semibold sm:min-h-9', className)}>
      <Tag aria-hidden className="size-4" />{t('How to read a food label')}<span className="sr-only"> {t('(opens in a new tab)')}</span>
    </Link>
  );
}
