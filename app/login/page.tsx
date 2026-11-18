import { redirect } from 'next/navigation';
import { getActor, homeFor } from '@/lib/server/session';
import { pageMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { AuthShell, type Space } from '@/components/auth/auth-shell';
import { safeNext } from '@/components/auth/nav';

export async function generateMetadata() {
  const t = await getT();
  return pageMetadata({ title: t('Log in'), description: t('Log in to Mizan as a member or for hospital care, with your username or email.'), path: '/login', noindex: true });
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const actor = await getActor();
  if (actor) redirect(next ?? homeFor(actor));
  const s = first(sp.space);
  const space: Space | null = s === 'member' || s === 'hospital' ? s : null;
  return <AuthShell mode="login" next={next} initialSpace={space} />;
}
