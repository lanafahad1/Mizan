// Reference data for the health space pages (server only).
import 'server-only';
import { serviceCall, getReference } from './data';
import type { HealthRef } from '@/components/health/health-space';

export async function healthReference(): Promise<HealthRef> {
  const [h, ref] = await Promise.all([serviceCall((s) => s.healthReference()), getReference()]);
  return { ...h, vocab: { conditions: ref.vocab.conditions, allergens: ref.vocab.allergens } };
}
