import { forbidden } from 'next/navigation';
import { requireActor, getViewer } from '@/lib/server/session';
import { serviceCall } from '@/lib/server/data';
import { healthReference } from '@/lib/server/health-ref';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { PageHead, PageBody } from '@/components/site/page-head';
import { LinkFirst } from '@/components/patient/link-account';
import { HealthSpace } from '@/components/health/health-space';
import Link from 'next/link';
import { Salad } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
        {actor.role === 'patient' ? (
          <section aria-labelledby="home-plan-h" className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-mint/50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Salad className="mt-1 size-6 shrink-0 text-sage-deep" aria-hidden />
              <div>
                <h2 id="home-plan-h" className="text-lg">{t('Your plan for home')}</h2>
                <p className="text-sm text-muted-foreground">{t('Meal ideas, a Ministry of Health meal plan and a shopping list for when you’re back home.')}</p>
              </div>
            </div>
            <Link href="/eat-well" className={cn(buttonVariants({ variant: 'outline' }), 'no-underline')}>{t('Open Eat well')}</Link>
          </section>
        ) : null}
      </PageBody>
    </>
  );
}
