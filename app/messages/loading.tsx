import { LoadingBlock } from '@/components/ui/skeleton';
import { containerClass } from '@/components/site/page-head';
import { cn } from '@/lib/utils';
import { getT } from '@/lib/i18n/server';

export default async function Loading() {
  const t = await getT();
  return <div className={cn(containerClass({ space: 'staff' }), 'py-10')}><LoadingBlock label={t('Loading messages…')} rows={4} /></div>;
}
