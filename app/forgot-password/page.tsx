import { pageMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { emailConfigured } from '@/lib/server/email';
import { PageHead, PageBody } from '@/components/site/page-head';
import { Illustration } from '@/components/illustrations/illustration';
import { ForgotPasswordForm } from '@/components/auth/password-reset';

export async function generateMetadata() {
  const t = await getT();
  return pageMetadata({ title: t('Forgot your password?'), description: t('Get a link by email to choose a new CareBite password.'), path: '/forgot-password', noindex: true });
}

export default async function ForgotPasswordPage() {
  const t = await getT();
  return (
    <>
      <PageHead narrow eyebrow={t('Account')} title={t('Forgot your password?')} actions={<Illustration name="login" className="size-24" />}>
        <p>{t('Enter the email of your account and we’ll send you a link to choose a new password.')}</p>
      </PageHead>
      <PageBody narrow>
        <div className="max-w-md"><ForgotPasswordForm enabled={emailConfigured()} dev={process.env.NODE_ENV !== 'production'} /></div>
      </PageBody>
    </>
  );
}
