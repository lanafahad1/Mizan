import { requirePermission, getViewer } from '@/lib/server/session';
import { serviceCall } from '@/lib/server/data';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { LinkFirst } from '@/components/patient/link-account';
import { MyMessagesView } from './my-messages-view';

export async function generateMetadata() {
  const t = await getT();
  return privateMetadata(t('Messages'));
}

/** The patient's conversation with their care team. */
export default async function MyMessagesPage() {
  const actor = await requirePermission('care:own', '/my-messages');
  if (!(await getViewer())?.patientId) return <LinkFirst title="Messages" />;
  const [thread, team] = await Promise.all([
    serviceCall((s) => s.listMessages(actor, 'me')),
    serviceCall((s) => s.getCareTeam(actor, 'me')),
  ]);
  return <MyMessagesView thread={thread} team={team} />;
}
