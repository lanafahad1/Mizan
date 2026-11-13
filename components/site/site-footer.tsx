import Link from 'next/link';
import { Logo } from './logo';
import { DISCLAIMER, DEVELOPER } from '@/lib/site';
import { getLang } from '@/lib/i18n/server';
import { getT } from '@/lib/i18n/server';
import { getViewer } from '@/lib/server/session';

const COLS: [string, [string, string][]][] = [
  ['Explore', [['/tools/calculator', 'Calculator'], ['/how-it-works', 'How It Works'], ['/menu', 'Hospital Meal Menu'], ['/login', 'Try the demo']]],
  ['About & Sources', [['/about', 'About the project'], ['/diets', 'Diets & rules'], ['/sources', 'Data sources & limitations'], ['/contact', 'Contact']]],
  ['Trust', [['/privacy', 'Privacy Policy'], ['/disclaimer', 'Medical Disclaimer'], ['/settings', 'Your account & data']]],
];

/** Signed-in people get one quiet line; the full disclaimer text stays on /disclaimer and on the public footer. */
const COMPACT: [string, string][] = [['/disclaimer', 'Medical disclaimer'], ['/privacy', 'Privacy'], ['/sources', 'Sources']];

export async function SiteFooter() {
  const [t, viewer, lang] = await Promise.all([getT(), getViewer(), getLang()]);
  const developer = <b className="font-semibold text-heading" lang={lang}>{DEVELOPER[lang]}</b>;
  const year = new Date().getFullYear();
  if (viewer) {
    return (
      <footer className="mt-auto border-t border-border bg-blush pb-[max(1rem,env(safe-area-inset-bottom))] print:hidden">
        <nav aria-label={t('Footer')} className="container-page flex flex-wrap items-center justify-center gap-x-1 py-2 text-sm text-muted-foreground">
          {COMPACT.map(([href, label], i) => (
            <span key={href} className="inline-flex items-center gap-1">
              {i ? <span aria-hidden>·</span> : null}
              <Link href={href} className="inline-flex min-h-11 items-center px-1.5 text-foreground no-underline hover:text-heading hover:underline">{t(label)}</Link>
            </span>
          ))}
          {/* Own line on phones (no dangling dot), same line from the sm breakpoint. */}
          <span className="inline-flex basis-full items-center justify-center gap-1 sm:basis-auto"><span aria-hidden className="max-sm:hidden">·</span><span className="px-1.5">© {year} CareBite · {t('Developed by')} {developer}</span></span>
        </nav>
      </footer>
    );
  }
  return (
    <footer className="mt-auto border-t border-border bg-blush pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="text-muted-foreground">{t('Care in every bite. Keep a private food diary at home, and get meals checked for you in hospital, guided by Saudi government sources (MOH, SFDA).')}</p>
          <p className="rounded-[16px] border border-border bg-card p-4 text-sm text-muted-foreground"><b className="text-heading">{t('Medical disclaimer.')}</b> {t(DISCLAIMER)}</p>
        </div>
        {COLS.map(([title, links]) => (
          <nav key={title} aria-label={t(title)}>
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[.12em] text-rose-ink">{t(title)}</h2>
            <ul className="flex flex-col gap-2">
              {links.map(([href, label]) => <li key={href}><Link href={href} className="text-foreground no-underline hover:text-heading hover:underline">{t(label)}</Link></li>)}
            </ul>
          </nav>
        ))}
      </div>
      <div className="container-page flex flex-col gap-1 border-t border-border pt-5 text-sm text-muted-foreground">
        <span>© {year} CareBite · {t('A university Health Informatics project')} · {t('Fictional hospital and made-up data only')}</span>
        <span>{t('Website developed by')} {developer}</span>
      </div>
    </footer>
  );
}
