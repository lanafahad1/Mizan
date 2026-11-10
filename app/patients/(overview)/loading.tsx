import { LoadingBlock } from '@/components/ui/skeleton';
import { containerClass } from '@/components/site/page-head';
import { cn } from '@/lib/utils';

export default function Loading() {
  return (
    <div className={cn(containerClass({ space: 'staff' }), 'flex flex-col gap-6 pb-16 pt-8 sm:pt-12')}>
      <LoadingBlock label="Loading patients…" rows={5} />
    </div>
  );
}
