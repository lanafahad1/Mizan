import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { getActor, homeFor } from '@/lib/server/session';
import { PageHead, PageBody } from '@/components/site/page-head';
import { Notice } from '@/components/ui/notice';
import { buttonVariants } from '@/components/ui/button';
import { Illustration } from '@/components/illustrations/illustration';

export async function generateMetadata() {
  const t = await getT();
  return pageMetadata({ title: t('Email confirmed'), description: t('Your CareBite email is confirmed.'), path: '/email-verified', noindex: true });
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function EmailVerifiedPage({ searchParams }: Props) {
  const t = await getT();
  const sp = await searchParams;
  const failed = Boolean(sp.error);
  const actor = await getActor();
  return (
    <>
      <PageHead narrow eyebrow={t('Account')} title={failed ? t('We couldn’t confirm your email') : t('Your email is confirmed')} actions={<Illustration name={failed ? 'error' : 'welcome'} className="size-24" />}>
        <p>{failed ? t('The link has expired or was already used. You can send a new one from Account settings.') : t('Thank you. If you ever forget your password, we can now send you a reset link.')}</p>
      </PageHead>
      <PageBody narrow>
        {failed ? <Notice tone="warn">{t('Links work for 1 hour.')}</Notice> : null}
        <Link href={actor ? homeFor(actor) : '/login'} className={buttonVariants({ className: 'self-start' })}>{actor ? t('Continue') : t('Log in')}</Link>
      </PageBody>
    </>
  );
}
