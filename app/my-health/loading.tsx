import { LoadingBlock } from '@/components/ui/skeleton';
import { getT } from '@/lib/i18n/server';
import { containerClass } from '@/components/site/page-head';

export default async function Loading() {
  const t = await getT();
  return <div className={`${containerClass({ space: 'member' })} py-10`}><LoadingBlock label={t('Loading your health space…')} rows={3} /></div>;
}
