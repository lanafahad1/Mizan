import { LoadingBlock } from '@/components/ui/skeleton';
import { getT } from '@/lib/i18n/server';

export default async function Loading() {
  const t = await getT();
  return (
    <div className="container-page container-narrow pb-16 pt-8 sm:pt-12">
      <LoadingBlock label={t('Loading your access request…')} rows={3} />
    </div>
  );
}
