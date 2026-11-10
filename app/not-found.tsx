import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import type { Metadata } from 'next';
import { Illustration } from '@/components/illustrations/illustration';
import { getT, getLang } from '@/lib/i18n/server';

// English keeps the site's default title; Arabic gets an Arabic one.
export async function generateMetadata(): Promise<Metadata> {
  if ((await getLang()) !== 'ar') return {};
  const t = await getT();
  return { title: t('Page not found') };
}

export default async function NotFound() {
  const t = await getT();
  return (
    <div className="container-page flex flex-col items-center gap-4 py-16 text-center sm:py-24">
      <Illustration name="not-found" className="h-[127px] w-36 sm:h-[159px] sm:w-[180px]" />
      <span className="eyebrow">404</span>
      <h1 className="text-4xl">{t('Page not found')}</h1>
      <p className="max-w-md text-muted-foreground">{t('We couldn’t find that page. It may have moved, or the link may be wrong.')}</p>
      <Link href="/" className={buttonVariants()}>{t('Back to the home page')}</Link>
    </div>
  );
}
