import { redirect } from 'next/navigation';
import { getActor, homeFor } from '@/lib/server/session';
import { pageMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { DEMO_ACCOUNTS } from '@/domain/demo-data.js';
import { ROLES, label } from '@/domain/constants.js';
import { DemoShell } from '@/components/auth/demo-shell';
import type { DemoAccount } from '@/components/auth/demo-accounts';
import { safeNext } from '@/components/auth/nav';

export async function generateMetadata() {
  const t = await getT();
  return pageMetadata({ title: t('Try the demo'), path: '/demo', noindex: true });
}

export default async function DemoPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const next = safeNext((await searchParams).next);
  const actor = await getActor();
  if (actor) redirect(next ?? homeFor(actor));
  const accounts: DemoAccount[] = (DEMO_ACCOUNTS as Array<{ username: string; name: string; role: string; summary: string; patientDemoId?: string }>).map((a) => ({
    username: a.username, name: a.name, role: a.role, roleLabel: label(ROLES, a.role), summary: a.summary, patientDemoId: a.patientDemoId ?? null,
  }));
  return <DemoShell accounts={accounts} next={next} />;
}
