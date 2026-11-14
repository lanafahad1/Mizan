import { requirePermission } from '@/lib/server/session';
import { serviceCall } from '@/lib/server/data';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { InboxView } from './inbox-view';

export async function generateMetadata() {
  const t = await getT();
  return privateMetadata(t('Messages'));
}

/** Every patient conversation, unread first (healthcare providers and admins). */
export default async function MessagesPage() {
  const actor = await requirePermission('care:read', '/messages');
  const initial = await serviceCall((s) => s.inbox(actor));
  return <InboxView initial={initial} />;
}
