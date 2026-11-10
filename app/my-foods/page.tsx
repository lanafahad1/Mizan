import { forbidden } from 'next/navigation';
import { requireActor, getViewer } from '@/lib/server/session';
import { serviceCall } from '@/lib/server/data';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { PageHead, PageBody } from '@/components/site/page-head';
import { LinkFirst } from '@/components/patient/link-account';
import type { Food } from '@/components/diary/types';
import { MyFoodsView } from './my-foods-view';

export async function generateMetadata() {
  const t = await getT();
  return privateMetadata(t('My foods'));
}

/** The member's own foods (added from pack labels or barcodes): edit or delete them. */
export default async function MyFoodsPage() {
  const actor = await requireActor('/my-foods');
  if (actor.role !== 'member' && actor.role !== 'patient') forbidden();
  if (actor.role === 'patient') {
    const viewer = await getViewer();
    if (!viewer?.patientId) return <LinkFirst title={(await getT())('My foods')} />;
  }
  const t = await getT();
  const initial = (await serviceCall((s) => s.listCustomFoods(actor, 'me'))) as Food[];
  return (
    <>
      <PageHead space="member" eyebrow={t('Diary')} title={t('My foods')}>
        <p>{t('Products you added from a pack label or a barcode. Fix a value or remove what you no longer eat.')}</p>
      </PageHead>
      <PageBody space="member">
        <MyFoodsView initial={initial} />
      </PageBody>
    </>
  );
}
