'use client';
import * as React from 'react';
import Link from 'next/link';
import { Lock, HeartPulse, Hospital, ChevronRight, ShieldCheck, Calculator, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Illustration } from '@/components/illustrations/illustration';
import { useT } from '@/components/site/lang';
import { DemoAccountList, type DemoAccount } from './demo-accounts';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

export const DEMO_PASSWORD = 'Mizan#2026';

/** The two Mizan spaces. Member = personal lifestyle use; hospital = patients and hospital staff. */
export type Space = 'member' | 'hospital';
type Mode = 'login' | 'register';

const HOSPITAL_ROLES = ['admin', 'staff', 'patient'];

const SPACE: Record<Space, { title: string; description: string; icon: LucideIcon; tone: string }> = {
  member: { title: 'Member', description: 'Track your own food, weight and health. Private to you.', icon: HeartPulse, tone: 'bg-mint text-sage-deep' },
  hospital: { title: 'Hospital care', description: 'Patients and hospital staff.', icon: Hospital, tone: 'bg-rose text-rose-ink' },
};

const STEP_TEXT: Record<Mode, Record<Space, { heading: string; help: string }>> = {
  login: {
    member: { heading: 'Member log in', help: 'Use the username or email of your member account.' },
    hospital: { heading: 'Hospital care log in', help: 'Patients and staff: log in with your username or the email you signed up with.' },
  },
  register: {
    member: { heading: 'Create a member account', help: 'Free and just for you: log your food, track your readings and set your own goals. It isn’t linked to any hospital, and only you can see it.' },
    hospital: { heading: 'Join hospital care', help: 'Your hospital runs this space. Patients join with the one-time link code from their nutrition team. Staff send an access request, and an admin approves it.' },
  },
};

/** Query string carrying the chosen space and a safe `next` between /login and /register. */
function authQuery(space: Space | null, next: string | null) {
  const qs = new URLSearchParams();
  if (space) qs.set('space', space);
  if (next) qs.set('next', next);
  const s = qs.toString();
  return s ? `?${s}` : '';
}

/** Log in / Create account switch (two pages, so these are links, not ARIA tabs). */
function AuthSwitch({ mode, query }: { mode: Mode; query: string }) {
  const { t } = useT();
  const item = (href: string, active: boolean, text: string) => (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-11 flex-1 items-center justify-center rounded-full px-4 font-display text-sm font-medium no-underline transition-colors',
        active ? 'bg-card text-heading shadow-soft' : 'text-muted-foreground hover:text-heading',
      )}
    >
      {text}
    </Link>
  );
  return (
    <nav aria-label={t('Account')} className="flex gap-1 rounded-full bg-blush p-1">
      {item(`/login${query}`, mode === 'login', t('Log in'))}
      {item(`/register${query}`, mode === 'register', t('Create account'))}
    </nav>
  );
}

/** Step 1: "Member or Hospital care?" as two large option buttons. */
function SpaceChoice({ headingRef, onChoose }: { headingRef: React.RefObject<HTMLHeadingElement | null>; onChoose: (s: Space) => void }) {
  const { t } = useT();
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-3 w-full">
        <h2 ref={headingRef} tabIndex={-1} className="text-lg outline-none sm:text-xl">{t('Are you a member or in hospital care?')}</h2>
      </legend>
      {(['member', 'hospital'] as const).map((id) => {
        const s = SPACE[id];
        const Icon = s.icon;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChoose(id)}
            className="group flex min-h-20 w-full cursor-pointer items-center gap-4 rounded-[18px] border border-border bg-card px-4 py-4 text-start shadow-soft transition-colors hover:border-primary hover:bg-mint focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25"
          >
            <span aria-hidden className={cn('grid size-12 shrink-0 place-items-center rounded-full', s.tone)}><Icon className="size-6" /></span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-display text-[1.05rem] font-semibold text-heading">{t(s.title)}</span>
              <span className="text-sm text-muted-foreground">{t(s.description)}</span>
            </span>
            <ChevronRight aria-hidden className="size-5 shrink-0 text-heading transition-transform group-hover:translate-x-0.5" />
          </button>
        );
      })}
      <p className="text-sm text-muted-foreground">
        {t('Work at a hospital and want Mizan for yourself too? Create a separate Member account. Your personal data stays private.')}
      </p>
    </fieldset>
  );
}

/** Step 2 header: the chosen space, its help text and a "Change" button back to step 1. */
function SpaceHeader({ mode, space, headingRef, onChange }: { mode: Mode; space: Space; headingRef: React.RefObject<HTMLHeadingElement | null>; onChange: () => void }) {
  const { t: tr } = useT();
  const s = SPACE[space];
  const t = STEP_TEXT[mode][space];
  const Icon = s.icon;
  return (
    <div className={cn('flex flex-col gap-2 rounded-[16px] border px-4 py-3', space === 'member' ? 'border-sage bg-mint' : 'border-border bg-blush')}>
      <div className="flex items-center justify-between gap-3">
        <h2 ref={headingRef} tabIndex={-1} className="flex min-w-0 items-center gap-2 text-lg outline-none">
          <Icon aria-hidden className="size-5 shrink-0" />{tr(t.heading)}
        </h2>
        <button type="button" onClick={onChange} className="-me-2 min-h-11 shrink-0 cursor-pointer rounded-full px-2 font-display text-sm font-semibold text-heading underline underline-offset-4 hover:text-sage-deep focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25">
          {tr('Change')}<span className="sr-only"> {tr('(choose Member or Hospital care again)')}</span>
        </button>
      </div>
      <p className="text-sm text-foreground">{tr(t.help)}</p>
    </div>
  );
}

/**
 * Shared frame for /login and /register. Step 1 asks "Member or Hospital care?";
 * step 2 shows the matching form and demo accounts. The choice only changes the
 * wording and options: the server sends every account to its own role's home.
 */
export function AuthShell({ mode, next, initialSpace, accounts, initialHospitalType = 'patient' }: {
  mode: Mode; next: string | null; initialSpace: Space | null; accounts: DemoAccount[]; initialHospitalType?: 'patient' | 'staff';
}) {
  const { t } = useT();
  const [space, setSpace] = React.useState<Space | null>(initialSpace);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const userMoved = React.useRef(false);
  const isLogin = mode === 'login';

  // Move focus to the new step's heading after the user changes step (not on first load).
  React.useEffect(() => {
    if (userMoved.current) headingRef.current?.focus();
  }, [space]);

  const choose = React.useCallback((s: Space | null) => {
    userMoved.current = true;
    setSpace(s);
    const url = new URL(window.location.href);
    if (s) url.searchParams.set('space', s); else url.searchParams.delete('space');
    url.searchParams.delete('type');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const query = authQuery(space, next);
  return (
    <div className="container-page grid items-start gap-6 pb-16 pt-6 sm:pt-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-8">
      <section className="flex min-w-0 flex-col gap-6 rounded-xl border border-border bg-card p-5 shadow-soft sm:p-8">
        <AuthSwitch mode={mode} query={query} />
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <span className="eyebrow">{isLogin ? t('Welcome back') : t('Join Mizan')}</span>
            <h1 className="text-[1.75rem] leading-tight sm:text-[2.1rem]">{isLogin ? t('Log in to Mizan') : t('Create your Mizan account')}</h1>
            {space === null ? (
              <p className="text-muted-foreground">{isLogin ? t('First, tell us where you use Mizan.') : t('First, choose the kind of account you need.')}</p>
            ) : null}
          </div>
          <Illustration name={isLogin ? 'login' : 'welcome'} className="-mt-1 h-[57px] w-16 sm:h-[85px] sm:w-24" />
        </div>
        {space === null ? (
          <SpaceChoice headingRef={headingRef} onChoose={choose} />
        ) : (
          <>
            <SpaceHeader mode={mode} space={space} headingRef={headingRef} onChange={() => choose(null)} />
            {isLogin
              ? <LoginForm key={space} next={next} space={space} />
              : <RegisterForm key={space} next={next} space={space} initialType={initialHospitalType} onSwitchSpace={choose} />}
          </>
        )}
        <p className="text-muted-foreground">
          {isLogin
            ? <>{t('New to Mizan?')} <Link href={`/register${query}`} className="font-semibold">{t('Create an account')}</Link></>
            : <>{t('Already have an account?')} <Link href={`/login${query}`} className="font-semibold">{t('Log in')}</Link></>}
        </p>
      </section>
      <AuthAside space={space} accounts={accounts} next={next} />
    </div>
  );
}

function DemoPanel({ title, intro, accounts, next }: { title: string; intro: React.ReactNode; accounts: DemoAccount[]; next: string | null }) {
  const { t } = useT();
  return (
    <section aria-labelledby="demo-h" className="flex flex-col gap-4 rounded-xl border border-border bg-blush p-5 sm:p-6">
      <h2 id="demo-h" className="text-xl sm:text-[1.4rem]">{title}</h2>
      <p className="text-muted-foreground">{intro}</p>
      <DemoAccountList accounts={accounts} password={DEMO_PASSWORD} next={next} />
      {accounts.length ? <p className="text-sm text-muted-foreground">
        {t('Or type in the demo username')} <code dir="ltr" className="rounded bg-card px-1.5 py-0.5 text-[.85em] text-heading">{accounts[0]?.username}</code> {t('and the shared password')} <code dir="ltr" className="rounded bg-card px-1.5 py-0.5 text-[.85em] text-heading">{DEMO_PASSWORD}</code>.
      </p> : null}
    </section>
  );
}

function InfoPanel({ id, icon: Icon, title, children }: { id: string; icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 sm:p-6">
      <h2 id={id} className="flex items-center gap-2 text-lg"><Icon aria-hidden className="size-5 text-sage-deep" />{title}</h2>
      {children}
    </section>
  );
}

function AuthAside({ space, accounts, next }: { space: Space | null; accounts: DemoAccount[]; next: string | null }) {
  const { t } = useT();
  if (space === null) {
    return (
      <div className="flex min-w-0 flex-col gap-5">
        <InfoPanel id="spaces-h" icon={ShieldCheck} title={t('Two spaces, kept apart')}>
          <dl className="flex flex-col gap-3 text-sm">
            <div><dt className="font-display font-semibold text-heading">{t('Member')}</dt><dd>{t('Your own food diary, readings and goals. Not linked to any hospital, and private to you.')}</dd></div>
            <div><dt className="font-display font-semibold text-heading">{t('Hospital care')}</dt><dd>{t('Patients join with a link code from their nutrition team. Staff send an access request that an admin approves.')}</dd></div>
          </dl>
          <p className="text-sm text-muted-foreground">{t('Work in a hospital and want personal use too? Keep your staff account for work and create a separate Member account for yourself.')}</p>
        </InfoPanel>
      </div>
    );
  }

  if (space === 'member') {
    const members = accounts.filter((a) => a.role === 'member');
    return (
      <div className="flex min-w-0 flex-col gap-5">
        {members.length ? (
          <DemoPanel
            title={t('Explore the demo member')}
            intro={<><strong className="font-semibold text-foreground">{t('Demonstration access:')}</strong> {t('this member and their records are fictional, and no identity is checked. Everyone using this demo account sees the same changes.')}</>}
            accounts={members}
            next={next}
          />
        ) : null}
        <InfoPanel id="private-h" icon={Lock} title={t('Your member space is private')}>
          <ul className="flex list-disc flex-col gap-1.5 ps-5 text-sm">
            <li>{t('Only you can see your food diary, readings and goals. No hospital account can read them.')}</li>
            <li>{t('You don’t need a link code, and your account isn’t linked to any hospital.')}</li>
            <li>{t('Hospital staff: keep your work account for work and use a separate member account for yourself.')}</li>
            <li>{t('Your password is stored scrambled (hashed with scrypt), and you stay logged in through a secure HttpOnly cookie that page scripts can’t read.')}</li>
          </ul>
        </InfoPanel>
        <Link href="/tools/calculator" className="flex min-h-11 items-center gap-2 self-start font-display text-sm font-semibold">
          <Calculator aria-hidden className="size-4" />{t('Try the BMI and calorie calculator first')}
        </Link>
      </div>
    );
  }

  const hospital = accounts.filter((a) => HOSPITAL_ROLES.includes(a.role));
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <DemoPanel
        title={t('Explore the demonstration hospital')}
        intro={<><strong className="font-semibold text-foreground">{t('Demonstration access:')}</strong> {t('every patient, staff member and record is fictional, and no identity is checked. Each account shows what that role can see and do. Everyone using the same demo account sees the same changes.')}</>}
        accounts={hospital}
        next={next}
      />
      <InfoPanel id="protect-h" icon={Lock} title={t('How accounts are protected')}>
        <ul className="flex list-disc flex-col gap-1.5 ps-5 text-sm">
          <li>{t('Three roles: patients see only their own meals, staff run the daily meal service, and admins manage everything, including clinical information and staff access.')}</li>
          <li>{t('An admin assigns staff roles. Nobody picks their own role at sign-up.')}</li>
          <li>{t('Only an admin can change diet orders, allergies or medical restrictions. Patients can ask for a change by sending a request.')}</li>
          <li>{t('Your password is stored scrambled (hashed with scrypt), and you stay logged in through a secure HttpOnly cookie that page scripts can’t read.')}</li>
        </ul>
      </InfoPanel>
    </div>
  );
}
