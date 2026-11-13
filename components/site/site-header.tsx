import { Logo } from './logo';
import { MainNav } from './main-nav';
import { getViewer, homeFor } from '@/lib/server/session';
import { PUBLIC_NAV, STAFF_NAV, PATIENT_NAV, PATIENT_ACCOUNT_NAV, MEMBER_NAV, type Space } from '@/lib/site';
import { MemberTabBar } from '@/components/member/tab-bar';
import { VerifyEmailBanner } from '@/components/auth/verify-banner';
import { emailConfigured } from '@/lib/server/email';

/** Server-rendered header: navigation comes from the session role and its RBAC permissions. */
export async function SiteHeader() {
  const viewer = await getViewer();
  const active = viewer?.status === 'active';
  const nav = !viewer ? PUBLIC_NAV
    : !active ? [{ href: '/access-pending', label: 'Access request' }]
      : viewer.role === 'member' ? MEMBER_NAV
      : viewer.role === 'patient' ? PATIENT_NAV
        : STAFF_NAV.filter((i) => !i.permission || viewer.permissions.includes(i.permission));
  // Signed-in people keep their own short navigation; public pages stay in the footer.
  const more: typeof nav = [];
  const home = viewer ? homeFor({ role: viewer.role, status: viewer.status }) : '/';
  // Members and patients get the same top tab strip (under the header) on phones and tablets instead of the menu button.
  const bar = active && (viewer?.role === 'member' || viewer?.role === 'patient') ? viewer.role : null;
  const space: Space = !viewer || !active ? 'public' : bar ? 'member' : 'staff';
  const account = bar === 'patient' ? PATIENT_ACCOUNT_NAV : [];
  return (
    <>
      <header style={{ viewTransitionName: 'site-header' }} className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <MainNav
          home={home}
          tabBar={Boolean(bar)}
          space={space}
          nav={nav.map(({ href, label }) => ({ href, label }))}
          more={more.map(({ href, label }) => ({ href, label }))}
          account={account.map(({ href, label }) => ({ href, label }))}
          logo={<Logo href={home} />}
          viewer={viewer ? { name: viewer.name, username: viewer.username, roleLabel: viewer.roleLabel, role: viewer.role, patientDemoId: viewer.patientDemoId, isDemo: viewer.isDemo } : null}
        />
        {bar ? <MemberTabBar space={bar} /> : null}
      </header>
      {active && viewer && !viewer.emailVerified && !viewer.isDemo && emailConfigured() ? <VerifyEmailBanner email={viewer.email} /> : null}
    </>
  );
}
