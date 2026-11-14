'use client';
// Small wins (domain/wins.js): gentle habit badges from the person's own logs.
// Earned badges are filled; the ones not earned yet are soft and dashed, with how far
// along they are. Never about weight, never a ranking.
import * as React from 'react';
import Link from 'next/link';
import { CalendarCheck, CalendarHeart, ChevronRight, ClipboardCheck, Footprints, GlassWater, HeartHandshake, Moon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';

export type Win = { id: string; label: string; hint: string; earned: boolean; n: number; of: number };
export type Wins = { earned: number; total: number; wins: Win[] };

const ICON: Record<string, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  'logged-7': CalendarCheck, 'logged-30': CalendarHeart, 'water-5': GlassWater, 'steps-goal': Footprints,
  'sleep-5': Moon, 'checkin-1': ClipboardCheck, 'checkin-4': HeartHandshake,
};

function Badge({ w, size = 'md' }: { w: Win; size?: 'sm' | 'md' }) {
  const Icon = ICON[w.id] ?? Sparkles;
  return (
    <span aria-hidden className={cn('grid shrink-0 place-items-center rounded-full',
      size === 'sm' ? 'size-10 [&_svg]:size-[18px]' : 'size-12 [&_svg]:size-[22px]',
      w.earned ? 'bg-primary text-primary-foreground shadow-[0_0_0_3px_var(--secondary)]' : 'border-[1.5px] border-dashed border-input bg-card text-muted-foreground opacity-80')}>
      <Icon aria-hidden />
    </span>
  );
}

/** All badges, with progress for the ones not earned yet (My progress and the care team's Progress tab). */
export function WinsCard({ wins, team = false }: { wins: Wins; team?: boolean }) {
  const { t } = useT();
  return (
    <section aria-labelledby="wins-h" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="wins-h" className="flex items-center gap-2 text-lg sm:text-xl"><Sparkles aria-hidden className="size-5 text-primary" />{t('Small wins')}</h2>
        <span className="text-sm text-muted-foreground">{t('{n} of {total} earned', { n: wins.earned, total: wins.total })}</span>
      </div>
      <p className="m-0 text-sm text-muted-foreground">{team ? t('Habits the patient has built, from their own logs. Never about weight.') : t('Small habits add up. These come from what you log, and they’re never about weight.')}</p>
      <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 min-[420px]:grid-cols-2 lg:grid-cols-3">
        {wins.wins.map((w) => (
          <li key={w.id} className={cn('flex min-h-16 items-center gap-3 rounded-[14px] px-3 py-2.5', w.earned ? 'bg-secondary' : 'bg-muted/60')}>
            <Badge w={w} />
            <span className="flex min-w-0 flex-1 flex-col gap-1 leading-tight">
              <b className={cn('font-display text-[.92rem] font-medium', w.earned ? 'text-heading' : 'text-foreground')}>{t(w.label)}</b>
              {w.earned ? (
                <span className="text-xs font-semibold text-secondary-foreground">{t('Earned')}</span>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground">{t(w.hint)} <span className="tabular">{t('{n} of {of}', { n: w.n, of: w.of })}</span></span>
                  {w.of > 1 ? <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-card"><span className="block h-full rounded-full bg-chart-3" style={{ width: `${Math.round((w.n / w.of) * 100)}%` }} /></span> : null}
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A short row for Home and the patient's meals page: the badges as icons, the next one to work on, and a link to all. */
export function WinsStrip({ wins }: { wins: Wins }) {
  const { t } = useT();
  const next = wins.wins.filter((w) => !w.earned).sort((a, b) => b.n / b.of - a.n / a.of)[0] ?? null;
  return (
    <section aria-labelledby="wins-strip-h" className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="wins-strip-h" className="flex items-center gap-2 text-lg sm:text-xl"><Sparkles aria-hidden className="size-5 text-primary" />{t('Small wins')}</h2>
        <span className="text-sm text-muted-foreground">{t('{n} of {total} earned', { n: wins.earned, total: wins.total })}</span>
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {wins.wins.map((w) => (
          <li key={w.id} title={t(w.label)}>
            <Badge w={w} size="sm" />
            <span className="sr-only">{t(w.label)}: {w.earned ? t('Earned') : t('{n} of {of}', { n: w.n, of: w.of })}</span>
          </li>
        ))}
      </ul>
      <p className="m-0 text-sm">
        {next ? <>{t('Next:')} <b className="font-semibold text-heading">{t(next.label)}</b> <span className="text-muted-foreground tabular">({t('{n} of {of}', { n: next.n, of: next.of })})</span></> : t('You’ve earned every badge. Well done.')}
      </p>
      <Link href="/my-progress#wins-h" className="inline-flex min-h-11 w-fit items-center gap-1 text-sm font-semibold">{t('See all your small wins')}<ChevronRight aria-hidden className="size-4 rtl:rotate-180" /></Link>
    </section>
  );
}
