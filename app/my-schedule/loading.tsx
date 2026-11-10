import { LoadingBlock } from '@/components/ui/skeleton';
import { getT } from '@/lib/i18n/server';

export default async function Loading() {
  const t = await getT();
  return <div className="container-page container-narrow py-10"><LoadingBlock label={t('Loading your meal week…')} rows={4} /></div>;
}
