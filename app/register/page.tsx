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
  return pageMetadata({ title: t('Create account'), description: t('Create a free CareBite account to look after your own food and health, or join hospital care as a patient or staff member.'), path: '/register', noindex: true });
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function demoAccounts(): DemoAccount[] {
  return (DEMO_ACCOUNTS as Array<{ username: string; name: string; role: string; summary: string; patientDemoId?: string }>).map((a) => ({
    username: a.username, name: a.name, role: a.role, roleLabel: label(ROLES, a.role), summary: a.summary, patientDemoId: a.patientDemoId ?? null,
  }));
}

export default async function RegisterPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const actor = await getActor();
  if (actor) redirect(next ?? homeFor(actor));
  const s = first(sp.space);
  const t = first(sp.type);
  // Older links use ?type=patient|staff, which implies the hospital space.
  const space: Space | null = s === 'member' || s === 'hospital' ? s : t === 'patient' || t === 'staff' ? 'hospital' : null;
  return <AuthShell mode="register" next={next} initialSpace={space} accounts={demoAccounts()} initialHospitalType={t === 'staff' ? 'staff' : 'patient'} />;
}
