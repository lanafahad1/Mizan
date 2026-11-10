import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { Providers } from '@/components/site/providers';
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, DEVELOPER } from '@/lib/site';
import { jsonLd } from '@/lib/seo';
import { getLang } from '@/lib/i18n/server';
import { dirOf, makeT } from '@/lib/i18n';
import { LangProvider } from '@/components/site/lang';

const SITE_TITLE = `${SITE_NAME}: Care in every bite`;

const poppins = localFont({
  variable: '--font-poppins',
  display: 'swap',
  src: [
    { path: './fonts/poppins-latin-400-normal.woff2', weight: '400' },
    { path: './fonts/poppins-latin-500-normal.woff2', weight: '500' },
    { path: './fonts/poppins-latin-600-normal.woff2', weight: '600' },
    { path: './fonts/poppins-latin-700-normal.woff2', weight: '700' },
  ],
});
const nunito = localFont({
  variable: '--font-nunito',
  display: 'swap',
  src: [
    { path: './fonts/nunito-latin-400-normal.woff2', weight: '400' },
    { path: './fonts/nunito-latin-600-normal.woff2', weight: '600' },
    { path: './fonts/nunito-latin-700-normal.woff2', weight: '700' },
  ],
});

// Arabic letters (Poppins and Nunito have none): used only when the site is in Arabic.
// IBM Plex Sans Arabic: the Arabic font of the Saudi government unified design system (DGA), used by moh.gov.sa.
const plexArabic = IBM_Plex_Sans_Arabic({ variable: '--font-plex-arabic', subsets: ['arabic'], weight: ['400', '500', '600', '700'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: DEVELOPER.en }],
  creator: DEVELOPER.en,
  keywords: ['obesity', 'type 2 diabetes', 'hypertension', 'chronic disease', 'food diary', 'calorie calculator', 'hospital nutrition', 'Saudi Arabia', 'MOH', 'SFDA', 'Health Informatics'],
  openGraph: { type: 'website', siteName: SITE_NAME, title: SITE_TITLE, description: SITE_DESCRIPTION, url: SITE_URL, locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESCRIPTION },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFF9F7',
  colorScheme: 'light',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const lang = await getLang();
  const t = makeT(lang);
  const org = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, description: SITE_DESCRIPTION, inLanguage: 'en' },
      { '@type': 'Person', '@id': `${SITE_URL}/#developer`, name: DEVELOPER.en, alternateName: DEVELOPER.ar },
    ],
  };
  return (
    <html lang={lang} dir={dirOf(lang)} className={`${poppins.variable} ${nunito.variable} ${plexArabic.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only z-[70] rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-4">{t('Skip to content')}</a>
        <Providers nonce={nonce}>
          <LangProvider lang={lang}>
            <SiteHeader />
            <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">{children}</main>
            <SiteFooter />
          </LangProvider>
        </Providers>
        <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLd(org) }} />
      </body>
    </html>
  );
}
