// Label helpers shared by server and client components.
import { ALLERGENS, PERIODS, PORTIONS, APPETITE, INTAKE_AMOUNTS, REFUSAL_REASONS, REQUEST_TYPES, REQUEST_STATUS, ENTRY_STATUS, label } from '@/domain/constants.js';

/** Lower-case allergen name; with a translator, the translated name when there is one. */
export const allergenName = (id: string, t?: unknown) => { const s = label(ALLERGENS, id); const tr = typeof t === 'function' ? (t as (x: string) => string)(s) : s; return tr === s ? s.toLowerCase() : tr; };
export const periodLabel = (id: string) => label(PERIODS, id);
export const portionLabel = (id?: string | null) => (id ? label(PORTIONS, id) : '');
export const appetiteLabel = (id: string) => label(APPETITE, id);
export const amountLabel = (id: string) => label(INTAKE_AMOUNTS, id);
export const reasonLabel = (id: string) => label(REFUSAL_REASONS, id);
export const requestLabel = (id: string) => label(REQUEST_TYPES, id);
export const requestStatusLabel = (id: string) => label(REQUEST_STATUS, id);
export const entryStatusLabel = (id: string) => label(ENTRY_STATUS, id);
export const ROLE_LABEL: Record<string, string> = { admin: 'Admin', staff: 'Healthcare provider', patient: 'Patient', system: 'Mizan' };
export const roleLabel = (r?: string | null) => (r ? ROLE_LABEL[r] ?? r : 'Mizan');
