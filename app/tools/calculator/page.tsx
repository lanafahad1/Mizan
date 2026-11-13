import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { pageMetadata } from '@/lib/seo';
import { SITE_URL, SITE_NAME } from '@/lib/site';
import { PageHead, PageBody } from '@/components/site/page-head';
import { buttonVariants } from '@/components/ui/button';
import { ExtLink } from '@/components/public/blocks';
import { JsonLd } from '@/components/public/json-ld';
import { MOH_GUIDE_META } from '@/data/moh-calorie-guide.js';
import { SOURCES } from '@/domain/rules.js';
import { CalculatorView } from './calculator-view';
import { getT } from '@/lib/i18n/server';

const TITLE = 'BMI & Calorie Calculator (Saudi MOH method)';
const DESCRIPTION = 'Free BMI, waist and daily calorie calculator for adults, using the Saudi Ministry of Health method (Mifflin-St Jeor × activity level), with suggested daily targets and the nearest MOH meal plan. Runs in your browser.';
const PATH = '/tools/calculator';
const MOH_CALC_URL = 'https://www.moh.gov.sa/en/healthawareness/medicaltools/pages/caloriecalculate.aspx';
const MOH_SALT = SOURCES['MOH-SALT'];

export async function generateMetadata() {
  const t = await getT();
  return pageMetadata({ title: t(TITLE), description: t(DESCRIPTION), path: PATH });
}

const jsonLd = (t: (s: string) => string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: t('Mizan BMI and calorie calculator'),
  url: `${SITE_URL}${PATH}`,
  description: t(DESCRIPTION),
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Any (web browser)',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: 0, priceCurrency: 'SAR' },
  publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  citation: [
    { '@type': 'CreativeWork', name: t('Saudi Ministry of Health calorie & BMI calculators'), url: MOH_CALC_URL },
    { '@type': 'CreativeWork', name: t(MOH_GUIDE_META.title), url: MOH_GUIDE_META.url },
  ],
});

export default async function CalculatorPage() {
  const t = await getT();
  return (
    <>
      <JsonLd data={jsonLd(t)} />
      <PageHead eyebrow={t('Free tool')} title={t('BMI and calorie calculator')}>
        <p>{t('Find your BMI, your waist risk and how much energy your body uses each day, worked out the Saudi Ministry of Health way. You’ll also get suggested daily goals from Ministry of Health sources.')}</p>
        <p className="text-base">{t('These are estimates for adults, not a prescription.')}</p>
      </PageHead>
      <PageBody>
        <CalculatorView />

        <section aria-labelledby="sources-h" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 id="sources-h" className="flex items-center gap-2 text-xl"><BookOpen aria-hidden className="size-5 text-sage-deep" />{t('Sources and limits')}</h2>
          <ul className="flex flex-col gap-3 text-sm">
            <li id="source-moh-calc" className="scroll-mt-24">
              <ExtLink href={MOH_CALC_URL} className="font-semibold">{t('Saudi Ministry of Health calorie & BMI calculators')}</ExtLink>
              <span className="block text-muted-foreground">{t('BMI = weight ÷ height², with the MOH adult categories. Daily energy = Mifflin-St Jeor resting energy × activity factor.')}</span>
            </li>
            <li id="source-moh-guide" className="scroll-mt-24">
              <ExtLink href={MOH_GUIDE_META.url} className="font-semibold">{t('MOH Calorie Guide for Weight Loss')}</ExtLink>
              <span className="block text-muted-foreground">{t('{publisher}. Meal plans from 1,200 to 2,200 kcal, food-group portions, waist circumference risk levels and added sugar advice.', { publisher: t(MOH_GUIDE_META.publisher) })}</span>
            </li>
            {MOH_SALT?.url ? (
              <li id="source-moh-salt" className="scroll-mt-24">
                <ExtLink href={MOH_SALT.url} className="font-semibold">{t(MOH_SALT.title)}</ExtLink>
                <span className="block text-muted-foreground">{t('Sodium: up to 2,000 mg a day for an adult.')}</span>
              </li>
            ) : null}
          </ul>
          <ul className="flex list-disc flex-col gap-1 ps-5 text-sm text-muted-foreground">
            <li>{t('For adults (18 or older). If you’re pregnant or breastfeeding, your care team sets your targets instead.')}</li>
            <li>{t('MOH rounds BMI to a whole number; Mizan shows one decimal place.')}</li>
            <li>{t('These are estimates only and don’t replace advice from a doctor or dietitian.')}</li>
          </ul>
        </section>

        <section aria-labelledby="cta-h" className="flex flex-col items-start gap-3 rounded-xl border border-sage bg-mint p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex flex-col gap-1">
            <h2 id="cta-h" className="text-xl">{t('Track it every day')}</h2>
            <p className="text-sm text-sage-deep">{t('Create a free member account to keep a private food diary, your readings and your own goals.')}</p>
          </div>
          <Link href="/register?space=member" className={buttonVariants({ size: 'lg', className: 'w-full sm:w-auto' })}>
            {t('Create a free member account')}<ArrowRight aria-hidden className="rtl:-scale-x-100" />
          </Link>
        </section>
      </PageBody>
    </>
  );
}
