import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Illustration } from '@/components/illustrations/illustration';
import { getViewer, homeFor } from '@/lib/server/session';
import { getT } from '@/lib/i18n/server';

/** Rendered by forbidden(): the role lacks the RBAC permission for this page. */
export default async function Forbidden() {
  const viewer = await getViewer();
  const t = await getT();
  return (
    <div className="container-page flex flex-col items-center gap-4 py-16 text-center sm:py-24">
      <Illustration name="forbidden" className="h-[127px] w-36 sm:h-[159px] sm:w-[180px]" />
      <h1 className="text-3xl">{t('This page isn’t available for your account')}</h1>
      <p className="max-w-md text-muted-foreground">{t('To keep things private, Mizan shows each person only what they need.')}{viewer ? ` ${t('{role} accounts can’t open this page.', { role: t(viewer.roleLabel) })}` : ''}</p>
      <Link href={homeFor(viewer ? { role: viewer.role, status: viewer.status } : null)} className={buttonVariants()}>{t('Go to my start page')}</Link>
    </div>
  );
}
