import { requirePermission } from '@/lib/server/session';
import { getReference } from '@/lib/server/data';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { emptyPatient } from '@/domain/patient.js';
import { todayIso } from '@/domain/dates.js';
import { NewPatientForm } from '@/components/patients/new-patient-form';

export async function generateMetadata() {
  const t = await getT();
  return privateMetadata(t('New patient profile'));
}

export default async function NewPatientPage() {
  await requirePermission('patient:create', '/patients/new');
  const reference = await getReference();
  const blank = { ...emptyPatient(), admittedOn: todayIso() };
  return <NewPatientForm reference={reference} blank={blank} />;
}
