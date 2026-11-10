'use client';
// Daily trackers (water, steps, active minutes): one value per day, typed in by
// the person. Shared by Home and the quick-add sheet of the bottom tab bar.
import * as React from 'react';
import { useSWRConfig } from 'swr';
import { apiSend, ApiError } from '@/lib/api-client';
import { toast } from '@/components/ui/toast';
import { useT } from '@/components/site/lang';
import { tMsg } from '@/components/diary/types';

export type DailyType = 'water' | 'steps' | 'activity';
export type Week = {
  from: string; to: string; target: number | null; daysLogged: number; activityMinutes: number; weightChange: number | null;
  days: { date: string; kcal: number; logged: boolean; target: number | null; water: number | null; steps: number | null; activity: number | null }[];
  goals: Record<DailyType, { goal: number | null; goalMin: number | null; weeklyGoal: number | null; text: string; unit: string; label: string }>;
};
export const WEEK_KEY = '/api/health/me/week';
export const OVERVIEW_KEY = '/api/health/me';
export const n0 = (v: number | null | undefined) => (v == null ? '—' : Math.round(v).toLocaleString('en-US'));

/** Refresh every health read of the signed-in person (overview, diary, week). */
export function useRefreshHealth() {
  const { mutate } = useSWRConfig();
  return React.useCallback(() => mutate((key) => typeof key === 'string' && key.startsWith('/api/health/me')), [mutate]);
}

/** Save a daily value (`value` replaces today's number, `add` adds to it). Returns the saved value, or null on error (a toast explains). */
export function useDaily() {
  const { t, lang } = useT();
  const refresh = useRefreshHealth();
  const [busy, setBusy] = React.useState<DailyType | null>(null);
  const save = React.useCallback(async (type: DailyType, body: { value?: number; add?: number }, done?: string): Promise<number | null> => {
    setBusy(type);
    try {
      const out = await apiSend<{ value: number }>('POST', '/api/health/me/daily', { type, ...body });
      if (done) toast(done);
      void refresh();
      return out.value;
    } catch (err) {
      toast(err instanceof ApiError ? tMsg(t, lang, err.message) : t('We couldn’t save this. Please try again.'), { tone: 'error' });
      return null;
    } finally { setBusy(null); }
  }, [refresh, t, lang]);
  /** Clear that day's value ("not logged" again). Returns true when it worked. */
  const clear = React.useCallback(async (type: DailyType, done?: string): Promise<boolean> => {
    setBusy(type);
    try {
      await apiSend('POST', '/api/health/me/daily', { type, clear: true });
      if (done) toast(done);
      void refresh();
      return true;
    } catch (err) {
      toast(err instanceof ApiError ? tMsg(t, lang, err.message) : t('We couldn’t save this. Please try again.'), { tone: 'error' });
      return false;
    } finally { setBusy(null); }
  }, [refresh, t, lang]);
  return { save, clear, busy };
}
