import { forbidden } from 'next/navigation';
import { requireActor, getViewer } from '@/lib/server/session';
import { serviceCall } from '@/lib/server/data';
import { healthReference } from '@/lib/server/health-ref';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { PageHead, PageBody } from '@/components/site/page-head';
import { LinkFirst } from '@/components/patient/link-account';
import { HealthSpace } from '@/components/health/health-space';

export async function generateMetadata() {
  const t = await getT();
  return privateMetadata(t('Health'));
}

export default async function MyHealthPage() {
  const actor = await requireActor('/my-health');
  if (actor.role !== 'member' && actor.role !== 'patient') forbidden();
  if (actor.role === 'patient') {
    const viewer = await getViewer();
    if (!viewer?.patientId) return <LinkFirst title={(await getT())('Health')} />;
  }
  const t = await getT();
  const [initial, reference] = await Promise.all([serviceCall((s) => s.getHealthOverview(actor, 'me')), healthReference()]);
  return (
    <>
      <PageHead space="member" eyebrow={actor.role === 'member' ? t('Private to you') : t('Hospital care')} title={t('Health')}>
        <p>{t('Your weight, daily targets, readings and assessment, all in one place.')}</p>
      </PageHead>
      <PageBody space="member">
        <HealthSpace who="me" initial={initial} reference={reference} assessmentHref="/my-health/assessment" />
      </PageBody>
    </>
  );
}
