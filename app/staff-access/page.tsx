import { requirePermission } from '@/lib/server/session';
import { serviceCall } from '@/lib/server/data';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { StaffAccessView } from './staff-access-view';

export async function generateMetadata() {
  const t = await getT();
  return privateMetadata(t('Provider access'));
}

export default async function StaffAccessPage() {
  const actor = await requirePermission('staff:manage', '/staff-access');
  const initial = await serviceCall((s) => s.listStaff(actor));
  return <StaffAccessView initial={initial} />;
}
