import { Skeleton } from '@/components/ui/skeleton';
import { getT } from '@/lib/i18n/server';
import { containerClass } from '@/components/site/page-head';

export default async function Loading() {
  const t = await getT();
  return (
    <div role="status" aria-live="polite" className={`${containerClass({ space: 'member' })} flex flex-col gap-6 pb-16 pt-8 sm:pt-10`}>
      <span className="sr-only">{t('Loading your home page…')}</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="flex flex-col items-center gap-4 rounded-[24px] border border-border bg-card p-5 sm:flex-row">
        <Skeleton className="size-[132px] rounded-full" />
        <div className="grid w-full grid-cols-2 gap-2">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-44" />)}
      </div>
      <Skeleton className="h-56" />
    </div>
  );
}
