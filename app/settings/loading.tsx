import { LoadingBlock } from '@/components/ui/skeleton';
import { getT } from '@/lib/i18n/server';

export default async function Loading() {
  const t = await getT();
  return (
    <div className="container-page flex flex-col gap-6 pb-16 pt-8 sm:pt-12">
      <LoadingBlock label={t('Loading your account settings…')} rows={4} />
    </div>
  );
}
