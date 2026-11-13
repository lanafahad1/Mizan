import { HeartPulse } from 'lucide-react';
import { publicMetadata } from '@/components/public/seo';
import { DISCLAIMER } from '@/lib/site';
import { PageHead } from '@/components/site/page-head';
import { Notice } from '@/components/ui/notice';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata() {
  const t = await getT();
  return publicMetadata({ title: t('Medical Disclaimer'), description: t(DISCLAIMER), path: '/disclaimer' });
}

export default async function DisclaimerPage() {
  const t = await getT();
  return (
    <>
      <PageHead eyebrow={t('Medical Disclaimer')} title={t('Medical disclaimer')} narrow />
      <div className="container-page container-narrow pb-16">
        <div className="prose-cb">
          <Notice tone="rose" icon={<HeartPulse aria-hidden />}>{t(DISCLAIMER)}</Notice>
          <h2>{t('What this means for you')}</h2>
          <ul>
            <li>{t('Mizan does not diagnose conditions, prescribe diets or recommend treatment. Admins define and review every diet order; Mizan supports their decisions.')}</li>
            <li>{t('Screening rules were checked against cited Saudi government guidance by the project team. They have not been clinically validated; a hospital dietetics department would need to review and approve them before real use.')}</li>
            <li>{t('Nutrition values come only from SFDA laboratory analysis of traditional dishes, where imported; the hospital’s own preparation may differ. Where no values are imported, none are shown or estimated.')}</li>
            <li>{t('Mizan never labels a meal “allergy-safe”. The kitchen checks packaged ingredient labels.')}</li>
            <li>{t('Dashboard figures are indicators from recorded meals. They don’t show cause and effect.')}</li>
            <li>{t('All patients, staff and records in this demonstration are fictional.')}</li>
            <li>{t('In an emergency, such as a severe allergic reaction, alert clinical staff or emergency services immediately.')}</li>
          </ul>
        </div>
      </div>
    </>
  );
}
