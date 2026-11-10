import { redirect } from 'next/navigation';
import { getActor, homeFor } from '@/lib/server/session';
import { pageMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { DEMO_ACCOUNTS } from '@/domain/demo-data.js';
import { ROLES, label } from '@/domain/constants.js';
import { AuthShell, type Space } from '@/components/auth/auth-shell';
import type { DemoAccount } from '@/components/auth/demo-accounts';
import { safeNext } from '@/components/auth/nav';

export async function generateMetadata() {
  const t = await getT();
  return pageMetadata({ title: t('Log in'), description: t('Log in to CareBite as a member or for hospital care, with your username or email.'), path: '/login', noindex: true });
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function demoAccounts(): DemoAccount[] {
  return (DEMO_ACCOUNTS as Array<{ username: string; name: string; role: string; summary: string; patientDemoId?: string }>).map((a) => ({
    username: a.username, name: a.name, role: a.role, roleLabel: label(ROLES, a.role), summary: a.summary, patientDemoId: a.patientDemoId ?? null,
  }));
}

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const actor = await getActor();
  if (actor) redirect(next ?? homeFor(actor));
  const s = first(sp.space);
  const space: Space | null = s === 'member' || s === 'hospital' ? s : null;
  return <AuthShell mode="login" next={next} initialSpace={space} accounts={demoAccounts()} />;
}
