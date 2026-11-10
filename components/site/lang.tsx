'use client';
// Client side of the language support: the provider (fed by the server layout),
// `useT()` for client components, and the switch button in the header.
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { LANG_COOKIE, makeT, type Lang, type T } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const LangCtx = React.createContext<{ lang: Lang; t: T }>({ lang: 'en', t: makeT('en') });

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const value = React.useMemo(() => ({ lang, t: makeT(lang) }), [lang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

/** `const { t, lang } = useT();` in client components. */
export const useT = () => React.useContext(LangCtx);

/** The language switch: English ⇄ عربي. Only changes language when clicked. */
export function LangSwitch({ className }: { className?: string }) {
  const { lang, t } = useT();
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const next: Lang = lang === 'ar' ? 'en' : 'ar';
  const toggle = () => {
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`;
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    start(() => router.refresh());
  };
  return (
    <button type="button" onClick={toggle} aria-label={next === 'ar' ? t('Switch to Arabic') : t('Switch to English')} aria-busy={pending || undefined}
      lang={next} className={cn('inline-flex min-h-10 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-border bg-card px-2.5 font-display text-sm font-semibold leading-none text-heading hover:bg-mint sm:gap-1.5 sm:px-3', className)}>
      <Languages aria-hidden className="size-4 shrink-0" />
      {/* A compact pill on phones: icon + عربي / EN; the full word from the sm breakpoint. */}
      <span className={next === 'ar' ? 'font-arabic' : undefined}>{next === 'ar' ? 'عربي' : <><span className="sm:hidden">EN</span><span className="hidden sm:inline">English</span></>}</span>
    </button>
  );
}
