'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Menu as MenuIcon, X, Sparkles, LogOut, Settings, House, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLinkItem } from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth-client';
import { toast } from '@/components/ui/toast';
import { LangSwitch, useT } from './lang';
import { containerClass } from './page-head';
import type { Space } from '@/lib/site';

type Item = { href: string; label: string };
type ViewerLite = { name: string; username: string; roleLabel: string; role: string | null; patientDemoId: string | null; isDemo: boolean } | null;

const isActive = (path: string, href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`));

/**
 * `tabBar`: the space has the bottom tab bar on phones/tablets (members and patients), so no menu button.
 * `account`: extra links in the account menu (the patient's food profile). `space`: the header width.
 */
export function MainNav({ nav, more, viewer, home, logo, tabBar = false, account = [], space }: { nav: Item[]; more: Item[]; viewer: ViewerLite; home: string; logo: React.ReactNode; tabBar?: boolean; account?: Item[]; space?: Space }) {
  const path = usePathname();
  const router = useRouter();
  const { t } = useT();
  const [open, setOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { setOpen(false); }, [path]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const initials = viewer ? (viewer.name || viewer.username || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '';
  const logout = async () => {
    await authClient.signOut();
    toast(t('You have been logged out.'));
    router.push('/');
    router.refresh();
  };
  // Staff navigation has the most entries: it collapses to the menu button on narrower screens.
  const wide = nav.length > 4;

  return (
    <>
      <div className={cn(containerClass({ space }), 'flex h-16 flex-nowrap items-center gap-2 sm:gap-4')}>
        {logo}
        <nav aria-label="Main" className={cn('ms-2 hidden items-center gap-1', wide ? 'xl:flex' : 'lg:flex')}>
          {nav.map((i) => (
            <Link key={i.href} href={i.href} aria-current={isActive(path, i.href) ? 'page' : undefined}
              className="rounded-full px-3 py-2 font-display text-[.92rem] text-foreground no-underline transition-colors hover:bg-mint hover:text-sage-deep aria-[current=page]:bg-sage aria-[current=page]:text-sage-deep">
              {t(i.label)}
            </Link>
          ))}
          {more.length ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-full px-3 py-2 font-display text-[.92rem] text-foreground hover:bg-mint">{t('More')} <ChevronDown className="size-4" aria-hidden /></DropdownMenuTrigger>
              <DropdownMenuContent>
                {more.map((i) => <DropdownMenuLinkItem key={i.href} render={<Link href={i.href} />}>{t(i.label)}</DropdownMenuLinkItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </nav>
        <div className="ms-auto flex min-w-0 shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
          <LangSwitch />
          {viewer ? (
            <>
              <span className={cn('hidden rounded-full px-2.5 py-1 text-xs font-extrabold tracking-wide sm:inline', viewer.role === 'admin' ? 'bg-warning-soft text-warning' : viewer.role === 'patient' ? 'bg-rose text-rose-ink' : 'bg-mint text-heading')}>{t(viewer.roleLabel)}</span>
              <DropdownMenu>
                <DropdownMenuTrigger aria-label={t('Account menu for {username}', { username: viewer.username })} className="grid size-10 shrink-0 place-items-center rounded-full bg-pink font-display text-sm font-semibold text-rose-ink hover:bg-pink-deep">{initials}</DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="px-3 pb-2 pt-1.5 text-sm">
                    <b className="text-heading">{viewer.name}</b> <span className="text-muted-foreground">@{viewer.username}</span>
                    <div className="text-xs text-muted-foreground">{t(viewer.roleLabel)}{viewer.patientDemoId ? ` · ${viewer.patientDemoId}` : ''}{viewer.isDemo ? ` · ${t('demo account')}` : ''}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuLinkItem render={<Link href={home} />}><House aria-hidden />{t('My start page')}</DropdownMenuLinkItem>
                  {account.map((i) => <DropdownMenuLinkItem key={i.href} render={<Link href={i.href} />}><ClipboardList aria-hidden />{t(i.label)}</DropdownMenuLinkItem>)}
                  <DropdownMenuLinkItem render={<Link href="/settings" />}><Settings aria-hidden />{t('Account settings')}</DropdownMenuLinkItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}><LogOut aria-hidden />{t('Log out')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}>{t('Log in')}</Link>
              {/* Short label on phones so the header never wraps (360–390px). */}
              <Link href="/login" className={cn(buttonVariants({ size: 'sm' }), 'shrink-0 whitespace-nowrap max-[379px]:px-3')}><Sparkles aria-hidden className="max-[379px]:hidden" /><span className="sm:hidden">{t('Demo')}</span><span className="hidden sm:inline">{t('Try the demo')}</span></Link>
            </>
          )}
          {/* Members and patients use the bottom tab bar on phones and tablets (components/member/tab-bar.tsx). */}
          {tabBar ? null : (
            <button type="button" className={cn('grid size-10 shrink-0 place-items-center rounded-full text-heading hover:bg-mint', wide ? 'xl:hidden' : 'lg:hidden')}
              aria-label={open ? t('Close menu') : t('Open menu')} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}>
              {open ? <X className="size-5" aria-hidden /> : <MenuIcon className="size-5" aria-hidden />}
            </button>
          )}
        </div>
      </div>
      {/* Mobile navigation: transitions.dev "Panel reveal". */}
      {tabBar ? null : <div className={cn('overflow-hidden', wide ? 'xl:hidden' : 'lg:hidden', !open && 'pointer-events-none h-0')}>
        <div ref={panelRef} id="mobile-nav" className="t-panel-slide border-t border-border bg-card" data-open={open ? 'true' : 'false'} inert={!open}>
          <nav aria-label="Mobile" className="container-page flex flex-col gap-1 py-3">
            {viewer ? <p className="px-3 pt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t(viewer.roleLabel)} · @{viewer.username}</p> : null}
            {nav.map((i) => <MobileLink key={i.href} item={i} active={isActive(path, i.href)} />)}
            {viewer ? <MobileLink item={{ href: '/settings', label: t('Account settings') }} active={path === '/settings'} /> : null}
            {viewer ? (more.length ? <p className="px-3 pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('Explore')}</p> : null) : <p className="px-3 pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('Your account')}</p>}
            {(viewer ? more : []).map((i) => <MobileLink key={i.href} item={i} active={isActive(path, i.href)} />)}
            {viewer ? (
              <button type="button" onClick={logout} className="flex min-h-12 items-center rounded-[12px] px-3 text-start font-display text-base text-destructive hover:bg-destructive-soft">{t('Log out')}</button>
            ) : (
              <>
                <MobileLink item={{ href: '/login', label: t('Log in') }} active={path === '/login'} />
                <MobileLink item={{ href: '/register', label: t('Create account') }} active={path === '/register'} />
              </>
            )}
          </nav>
        </div>
      </div>}
    </>
  );
}

function MobileLink({ item, active }: { item: Item; active: boolean }) {
  const { t } = useT();
  return (
    <Link href={item.href} aria-current={active ? 'page' : undefined}
      className="flex min-h-12 items-center rounded-[12px] px-3 font-display text-base text-foreground no-underline hover:bg-mint aria-[current=page]:bg-sage aria-[current=page]:text-sage-deep">
      {t(item.label)}
    </Link>
  );
}
