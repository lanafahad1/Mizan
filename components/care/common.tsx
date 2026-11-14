'use client';
// Shared pieces of the care-team features (domain/care-service.js): API paths,
// shapes, the provider name line and the "refresh everything about this patient" hook.
import * as React from 'react';
import { useSWRConfig } from 'swr';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** API path of a care space: "me" (the signed-in patient, or a member for progress) or a hospital patient id. */
export const C = (who: string, path = '') => `/api/care/${encodeURIComponent(who)}${path}`;
export const UNREAD_KEY = '/api/care/unread';

export type Provider = { id?: string; name: string; role: string; roleLabel: string; specialty: string | null; specialtyLabel: string | null; bio: string; addedAt?: string };
export type Field = { key: string; label: string; unit: string; min: number; max: number; decimals?: number };
export type CareRef = {
  specialties: { id: string; label: string }[]; goalFields: Field[]; limitFields: Field[];
  checkinQuestions: { id: 'hunger' | 'energy' | 'mood'; label: string; question: string; scale: string[] }[];
  noteVisibility: { id: string; label: string }[]; noteMax: number; messageMax: number; bioMax: number;
};
export type Goals = { goal: any | null; progress: any | null };

/** Refresh every care and health read of one space (after a change). */
export function useCareRefresh(who: string) {
  const { mutate } = useSWRConfig();
  return React.useCallback(() => mutate((key) => typeof key === 'string' && (key.startsWith(C(who)) || key.startsWith(`/api/health/${encodeURIComponent(who)}`) || key === UNREAD_KEY || key.startsWith('/api/care/attention') || key.startsWith('/api/care/inbox'))), [mutate, who]);
}

/** Initials in a small round tile (no photos are stored). */
export function Initials({ name, className }: { name: string; className?: string }) {
  const text = (name || '?').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return <span aria-hidden className={cn('grid size-10 shrink-0 place-items-center rounded-full bg-secondary font-display text-sm font-semibold text-secondary-foreground', className)}>{text}</span>;
}

/** "Huda · Dietitian" (or the role when no specialty is recorded). */
export function ProviderLine({ p, className }: { p: { name: string; specialtyLabel?: string | null; roleLabel?: string }; className?: string }) {
  const { t } = useT();
  const what = p.specialtyLabel ?? p.roleLabel ?? null;
  return <span className={className}><bdi>{t(p.name)}</bdi>{what ? <span className="text-muted-foreground"> · {t(what)}</span> : null}</span>;
}

/** A character count that turns amber near the limit and is announced only near it. */
export function CharCount({ value, max, id }: { value: string; max: number; id?: string }) {
  const { t } = useT();
  const n = value.length;
  const near = n > max * 0.9;
  return <span id={id} className={cn('text-xs tabular', near ? 'font-semibold text-warning' : 'text-muted-foreground')} aria-live={near ? 'polite' : undefined}>{t('{n} of {max} characters', { n, max })}</span>;
}
