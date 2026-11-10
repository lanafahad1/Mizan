import { requirePermission, getViewer } from '@/lib/server/session';
import { serviceCall, getReference, param } from '@/lib/server/data';
import { healthReference } from '@/lib/server/health-ref';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { isoDate } from '@/lib/format';
import { PatientView } from '@/components/patients/patient-view';
import { TABS, type Tab } from '@/components/patients/tabs';

export async function generateMetadata() {
  const t = await getT();
  return privateMetadata(t('Patient Nutrition Profile'));
}

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PatientPage({ params, searchParams }: Props) {
  const { id } = await params;
  const actor = await requirePermission('patient:list', `/patients/${encodeURIComponent(id)}`);
  const viewer = await getViewer();
  const sp = await searchParams;
  const t = param(sp.tab);
  const tab: Tab = (TABS as readonly string[]).includes(t ?? '') ? (t as Tab) : 'meals';
  const date = isoDate(param(sp.date));
  const [record, day, reference, health, healthRef] = await Promise.all([
    serviceCall((s) => s.getPatient(actor, id)),
    serviceCall((s) => s.getDayPlan(actor, id, { date })),
    getReference(),
    serviceCall((s) => s.getHealthOverview(actor, id)),
    healthReference(),
  ]);
  return <PatientView id={String(record.patient.id)} initialRecord={record} initialDay={day} reference={reference} permissions={viewer?.permissions ?? []} initialTab={tab} initialHealth={health} healthRef={healthRef} />;
}
