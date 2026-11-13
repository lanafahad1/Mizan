import Link from 'next/link';
import { publicMetadata } from '@/components/public/seo';
import { SITE_URL, DEVELOPER, CONTACT_EMAIL } from '@/lib/site';
import { AboutNav } from '@/components/cb/misc';
import { PageHead } from '@/components/site/page-head';
import { Notice } from '@/components/ui/notice';
import { JsonLd } from '@/components/public/json-ld';
import { getT } from '@/lib/i18n/server';

const DESCRIPTION = 'Mizan is a university Health Informatics project. Email the Mizan team with questions, feedback or bugs. Mizan is not a medical service.';
export async function generateMetadata() {
  const t = await getT();
  return publicMetadata({ title: t('Contact'), description: t(DESCRIPTION), path: '/contact' });
}

export default async function ContactPage() {
  const t = await getT();
  const ld = { '@context': 'https://schema.org', '@type': 'ContactPage', name: t('Contact the project team'), url: `${SITE_URL}/contact`, description: t(DESCRIPTION), about: { '@id': `${SITE_URL}/#project` } };
  return (
    <>
      <JsonLd data={ld} />
      <AboutNav current="/contact" />
      <PageHead eyebrow={t('Contact')} title={t('Get in touch')} narrow>
        <p>{t('Mizan was designed and developed as a university Health Informatics project by:')}</p>
      </PageHead>
      <div className="container-page container-narrow pb-16">
        <div className="prose-cb">
          <ul className="!list-none !ps-0 grid gap-2 sm:grid-cols-2">
            <li className="rounded-[14px] border border-border bg-card px-4 py-3 font-display font-medium text-heading">{DEVELOPER.en} · <span lang="ar" dir="rtl" className="font-arabic">{DEVELOPER.ar}</span></li>
          </ul>
          <h2>{t('Email')}</h2>
          <p><a href={`mailto:${CONTACT_EMAIL}`} dir="ltr" className="font-display font-medium">{CONTACT_EMAIL}</a></p>
          <p>{t('Write in with questions about the project, feedback or bugs you spot. Please don’t include health information: email isn’t a secure place for medical details.')}</p>
          <Notice title={t('Not a medical service')}>{t('Mizan cannot provide medical or dietary advice. For health questions, contact a qualified healthcare professional. In an emergency, alert clinical staff or emergency services.')}</Notice>
          <p className="text-sm text-muted-foreground">{t('Looking for the citation? You’ll find it on')} <Link href="/sources">{t('Data sources & limitations')}</Link>{t('.')}</p>
        </div>
      </div>
    </>
  );
}
