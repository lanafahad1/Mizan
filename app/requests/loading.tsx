import { LoadingBlock } from '@/components/ui/skeleton';
import { containerClass } from '@/components/site/page-head';
import { cn } from '@/lib/utils';

export default function Loading() {
  return <div className={cn(containerClass({ space: 'staff' }), 'py-10')}><LoadingBlock label="Loading requests…" rows={4} /></div>;
}
