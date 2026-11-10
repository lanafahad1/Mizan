import { redirect } from 'next/navigation';
import { getActor, getViewer } from '@/lib/server/session';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { SettingsView } from '@/components/auth/settings-view';

export async function generateMetadata() {
  const t = await getT();
  return privateMetadata(t('Account Settings'));
}

/** Account settings. Pending staff requests may open it too (to change their password or delete the request). */
export default async function SettingsPage() {
  const actor = await getActor();
  if (!actor) redirect('/login?next=/settings');
  const viewer = (await getViewer())!;
  return <SettingsView viewer={viewer} memberSince={actor.createdAt} />;
}
