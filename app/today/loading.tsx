import { Skeleton } from '@/components/ui/skeleton';
import { getT } from '@/lib/i18n/server';
import { containerClass } from '@/components/site/page-head';

export default async function Loading() {
  const t = await getT();
  return (
    <div role="status" aria-live="polite" className={`${containerClass({ space: 'member' })} flex flex-col gap-5 pb-16 pt-8 sm:pt-10`}>
      <span className="sr-only">{t('Loading your food diary…')}</span>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="h-12 w-40" />
        <Skeleton className="size-11 rounded-full" />
      </div>
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row">
        <Skeleton className="size-[132px] rounded-full" />
        <div className="flex w-full flex-col gap-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-3" />
          <Skeleton className="h-3" />
          <Skeleton className="h-3" />
        </div>
      </div>
      {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)}
    </div>
  );
}
