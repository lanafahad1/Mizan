import { forbidden } from 'next/navigation';
import { requireActor, getViewer } from '@/lib/server/session';
import { serviceCall } from '@/lib/server/data';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { PageHead, PageBody } from '@/components/site/page-head';
import { LinkFirst } from '@/components/patient/link-account';
import { AssessmentWizard } from '@/components/health/assessment-wizard';

export async function generateMetadata() {
  const t = await getT();
  return privateMetadata(t('Nutrition & Chronic Disease Assessment'));
}

export default async function AssessmentPage() {
  const actor = await requireActor('/my-health/assessment');
  if (actor.role !== 'member' && actor.role !== 'patient') forbidden();
  if (actor.role === 'patient') {
    const viewer = await getViewer();
    if (!viewer?.patientId) return <LinkFirst title={(await getT())("Assessment")} />;
  }
  const list = await serviceCall((s) => s.listAssessments(actor, 'me'));
  const open = list.find((a: { status: string }) => ['draft', 'more-info'].includes(a.status)) ?? null;
  const member = actor.role === 'member';
  const t = await getT();
  return (
    <>
      <PageHead space="member" eyebrow={t('Optional · about 5 minutes')} title={t('Nutrition & Chronic Disease Assessment')}>
        <p>{member ? t('A few questions to help you understand your health, what your body needs and the foods you enjoy.') : t('Helps your care team understand your health, your nutrition needs and the foods you enjoy.')} {t('Not sure about something? You can always choose “Not sure”.')}</p>
      </PageHead>
      <PageBody space="member">
        <AssessmentWizard who="me" kind={member ? 'member' : 'patient'} initial={open} />
      </PageBody>
    </>
  );
}
