import { requirePermission } from '@/lib/server/session';
import { serviceCall, param } from '@/lib/server/data';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { isoDate } from '@/lib/format';
import { CONDITIONS } from '@/domain/constants.js';
import { BMI_CATEGORIES } from '@/domain/calculator.js';
import { DashboardView, type Chronic } from './dashboard-view';

export async function generateMetadata() {
  const t = await getT();
  return privateMetadata(t('Nutrition Team Dashboard'));
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Conditions shown on the dashboard, in this order. */
const CHRONIC = ['obesity', 't2d', 'hypertension', 'cvd', 'kidney', 'cholesterol'];
const conditionLabel = (id: string) => CONDITIONS.find((c: { id: string }) => c.id === id)?.label ?? id;

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function DashboardPage({ searchParams }: Props) {
  const actor = await requirePermission('dashboard:view', '/dashboard');
  const date = isoDate(param((await searchParams).date));
  const [initial, attention, chronic] = await Promise.all([
    serviceCall((s) => s.getDashboard(actor, { date })),
    serviceCall((s) => s.careAttention(actor)),
    serviceCall((s): Chronic => {
      const admitted: any[] = s.listPatients(actor, {}).patients;
      const people = new Map<string, { demoId: string; name: string }>();
      const conditions = Object.fromEntries(CHRONIC.map((c) => [c, 0]));
      const bmi = Object.fromEntries(BMI_CATEGORIES.map((c: { id: string }) => [c.id, 0]));
      let noBmi = 0;
      for (const p of admitted) {
        people.set(String(p.id), { demoId: p.demoId, name: p.preferredName });
        let o: any;
        try { o = s.getHealthOverview(actor, String(p.id)); } catch { continue; }
        for (const c of o.profile?.conditions ?? []) if (c in conditions) conditions[c]++;
        if (o.body?.bmiCategory?.id && o.body.bmiCategory.id in bmi) bmi[o.body.bmiCategory.id]++;
        else noBmi++;
      }
      const work = s.healthWorklist(actor);
      const who = (pid: string) => {
        if (!people.has(pid)) {
          try { const o = s.getHealthOverview(actor, pid); people.set(pid, { demoId: o.demoId ?? pid, name: o.name ?? '' }); } catch { people.set(pid, { demoId: pid, name: '' }); }
        }
        return people.get(pid)!;
      };
      return {
        admitted: admitted.length,
        conditions: CHRONIC.map((id) => ({ id, label: conditionLabel(id), count: conditions[id] })),
        bmi: [
          ...BMI_CATEGORIES.map((c: { id: string; label: string }) => ({ id: c.id, label: c.label, count: bmi[c.id] })),
          { id: 'none', label: 'No weight or height recorded', count: noBmi },
        ],
        waiting: work.waiting.map((w: any) => ({ patientId: w.patientId, ...who(w.patientId), submittedAt: w.submittedAt ?? null })),
        due: [...work.due].sort((a: any, b: any) => a.nextReviewOn.localeCompare(b.nextReviewOn))
          .map((d: any) => ({ patientId: d.patientId, ...who(d.patientId), nextReviewOn: d.nextReviewOn, overdue: Boolean(d.overdue) })),
      };
    }),
  ]);
  return <DashboardView initial={initial} requestedDate={date ?? null} chronic={chronic} attention={attention} />;
}
