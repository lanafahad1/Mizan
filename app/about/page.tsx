import type * as React from 'react';
import Link from 'next/link';
import { User, Hospital, List, BookOpen, Target, ShieldCheck, Lock, Shield, Database } from 'lucide-react';
import { publicMetadata } from '@/components/public/seo';
import { SITE_URL, SITE_NAME, DEVELOPER } from '@/lib/site';
import { botanical, teamPortrait } from '@/lib/art.js';
import { AboutNav } from '@/components/cb/misc';
import { Accordion } from '@/components/ui/accordion';
import { Band, SectionHead, CheckList, CheckItem, Benefit, Pipeline, Panel } from '@/components/public/blocks';
import { Citation } from '@/components/public/citation';
import { JsonLd } from '@/components/public/json-ld';
import { getT } from '@/lib/i18n/server';

const DESCRIPTION = 'Meet Mizan, a university Health Informatics project that supports healthier eating for people living with obesity or a chronic disease in Saudi Arabia. It has a private member space and a hospital care space, both built on Saudi government guidance. Meet the developer.';
export async function generateMetadata() {
  const t = await getT();
  return publicMetadata({ title: t('About the Project'), description: t(DESCRIPTION), path: '/about' });
}

function Details({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Accordion className="rounded-[16px] border border-border bg-card" headClassName="min-h-12 px-4 py-3 font-display text-[1rem] font-semibold text-heading sm:px-5" title={title}>
      <div className="flex flex-col gap-4 px-4 pb-5 sm:px-5">{children}</div>
    </Accordion>
  );
}

const initials = (n: string) => { const parts = n.split(/\s+/); return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase(); };

export default async function AboutPage() {
  const t = await getT();
  const ld = {
    '@context': 'https://schema.org', '@type': 'AboutPage', name: t('About {site}', { site: SITE_NAME }), url: `${SITE_URL}/about`, description: t(DESCRIPTION),
    about: { '@id': `${SITE_URL}/#project` },
  };
  return (
    <>
      <JsonLd data={ld} />
      <AboutNav current="/about" />
      <section className="overflow-hidden bg-[radial-gradient(900px_400px_at_90%_0%,var(--cb-rose),transparent_60%),radial-gradient(700px_400px_at_0%_100%,var(--cb-mint),transparent_60%)] py-8 sm:py-12">
        <div className="container-page grid items-center gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <span className="eyebrow">{t('About the project')}</span>
            <h1 className="text-[2rem] leading-tight sm:text-[2.6rem]">{t('Healthier eating for people living with obesity and chronic disease')}</h1>
            <p className="text-[1.1rem]">{t('Mizan brings your health information, Saudi food data and documented dietary guidance together to help you eat better, at home and in hospital.')}</p>
          </div>
          <span className="mx-auto hidden w-40 sm:block md:w-48" dangerouslySetInnerHTML={{ __html: botanical('w-full h-auto') }} />
        </div>
      </section>

      <Band tone="white" aria-labelledby="mission-h" className="py-8 sm:py-10 lg:py-12">
        <div className="container-page grid gap-4 md:grid-cols-3">
          <Panel tone="mint">
            <h2 id="mission-h" className="text-[1.3rem]">{t('Our mission')}</h2>
            <p>{t('To show how Health Informatics can link your health information with Saudi nutrition guidance and food data, so that people living with, or at risk of, obesity and chronic disease can eat more healthily.')}</p>
          </Panel>
          <Benefit icon={User} as="h2" title={t('Member')}>{t('For anyone looking after their own health, healthcare workers included: a food diary, goals for calories, protein, carbs and fat, health readings, a personal health assessment, meal ideas and a shopping list. It’s private: hospital staff can never see it.')}</Benefit>
          <Benefit icon={Hospital} as="h2" title={t('Hospital care')}>{t('For patients, staff and admins: a care-team assessment, daily nutrient targets, meals checked against several conditions at once, and a plan for eating at home after discharge. It uses a fictional hospital and made-up data.')}</Benefit>
        </div>
      </Band>

      <Band aria-labelledby="team-h" className="py-8 sm:py-10 lg:py-12">
        <div className="container-page flex flex-col items-center gap-5 text-center">
          <SectionHead center eyebrow={t('Meet the developer')} title={t('Designed with Care. Built for Better Nutrition.')} id="team-h" className="mb-1" />
          <div className="relative flex w-full max-w-xs flex-col items-center gap-3 overflow-hidden rounded-xl border border-border bg-card px-5 pb-6 pt-7 after:pointer-events-none after:absolute after:inset-x-[-30%] after:bottom-[-55%] after:h-[70%] after:bg-[radial-gradient(closest-side,var(--cb-rose),transparent)] after:opacity-70 after:content-['']">
            <span className="relative z-10 size-28 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: teamPortrait(initials(DEVELOPER.en), 0).replace('aria-label="Decorative monogram ', `aria-label="${t('Decorative monogram')} `) }} />
            <h3 className="relative z-10 text-[1.15rem] font-medium">{DEVELOPER.en}</h3>
            <p className="relative z-10 font-arabic text-[1.05rem] text-heading" lang="ar" dir="rtl">{DEVELOPER.ar}</p>
            <p className="relative z-10 text-sm text-muted-foreground">{t('Website design and development')}</p>
          </div>
        </div>
      </Band>

      <Band tone="white" aria-labelledby="more-h" className="py-8 sm:py-10 lg:py-12">
        <div className="container-page flex flex-col gap-3">
          <h2 id="more-h" className="text-[1.4rem] leading-tight sm:text-[1.7rem]">{t('More about the project')}</h2>

          <Details title={t('Why we focus on this')}>
            <p>{t('The Ministry of Health’s dietary guidelines advise cutting back on sugary, salty and fatty foods to lower the risk of obesity, diabetes and high blood pressure. Mizan turns that advice into simple tools you can use every day.')}</p>
          </Details>

          <Details title={t('How the information connects: from three sources to one decision')}>
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <CheckList>
                <CheckItem icon={User} title={t('Personal information:')}>{t('targets, food diary and readings for members; conditions, diet order and allergies for hospital patients.')}</CheckItem>
                <CheckItem icon={List} title={t('Food data:')}>{t('SFDA Saudi Food Composition Tables for Saudi dishes, plus documented sources for ingredients and packaged products.')}</CheckItem>
                <CheckItem icon={BookOpen} title={t('Documented rules:')}>{t('based on Saudi government guidance, each with its logic, source and review status.')}</CheckItem>
              </CheckList>
              <Pipeline label={t('From capture to learning')} className="p-4 sm:p-5" steps={[
                { title: t('Capture'), text: t('Coded records, food data and a rule knowledge base.') },
                { title: t('Validate'), text: t('Server-side checks, role permissions and review flags.'), safety: true },
                { title: t('Check'), text: t('Allergies and diet first, then nutrient limits and targets.'), safety: true },
                { title: t('Support'), text: t('Suggestions come with reasons; people and their care team decide.') },
                { title: t('Learn'), text: t('Intake and feedback improve future suggestions.') },
              ]} />
            </div>
          </Details>

          <Details title={t('Intended benefits: what Mizan is built to help with')}>
            <div className="grid gap-3 md:grid-cols-2">
              <Benefit icon={Target} title={t('Healthier daily choices')}>{t('Clear daily goals and a simple food diary make Saudi dietary guidance easier to follow.')}</Benefit>
              <Benefit icon={ShieldCheck} title={t('Safer hospital meals')}>{t('Every offered meal is checked against the diet order, allergies and each recorded condition.')}</Benefit>
            </div>
          </Details>

          <Details title={t('Privacy and safety by design: minimum necessary information')}>
            <CheckList>
              <CheckItem icon={Lock}>{t('The member space is private: hospital staff can never see it.')}</CheckItem>
              <CheckItem icon={Shield}>{t('In hospital care, only an admin can change clinical dietary restrictions; patients send requests instead.')}</CheckItem>
              <CheckItem icon={Database}>{t('Fictional demonstration identifiers (MZ-####), never medical record numbers.')}</CheckItem>
              <CheckItem icon={List}>{t('An audit log of every change to a patient’s record and meals.')}</CheckItem>
            </CheckList>
          </Details>

          <Panel className="mt-3">
            <h3 className="text-lg">{t('Cite this project')}</h3>
            <Citation id="about-cite" />
            <p className="text-sm"><Link href="/sources">{t('All data sources and limitations')}</Link></p>
          </Panel>
        </div>
      </Band>
    </>
  );
}
