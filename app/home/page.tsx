import { redirect } from 'next/navigation';
import { requireActor, homeFor } from '@/lib/server/session';
import { serviceCall } from '@/lib/server/data';
import { healthReference } from '@/lib/server/health-ref';
import { privateMetadata } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';
import { LIFESTYLE_TIPS } from '@/data/moh-calorie-guide.js';
import { buildIdeas, ideaForMeal } from '@/components/member/ideas-data';
import { mealForHour, dayNumber } from '@/components/member/meal-time';
import { HomeView } from '@/components/member/home-view';

export async function generateMetadata() {
  const t = await getT();
  return privateMetadata(t('Home'));
}

/** Member Home: the first page after logging in (today, trackers, next steps, this week, small wins, a MOH tip and a meal idea). */
export default async function HomePage() {
  const actor = await requireActor('/home');
  if (actor.role !== 'member') redirect(homeFor(actor));
  const [overview, diary, week, reference, wins] = await Promise.all([
    serviceCall((s) => s.getHealthOverview(actor, 'me')),
    serviceCall((s) => s.getDiary(actor, 'me', {})),
    serviceCall((s) => s.getWeek(actor, 'me', {})),
    healthReference(),
    serviceCall((s) => s.getWins(actor, 'me')),
  ]);
  const hour = new Date().getHours();
  const day = dayNumber(diary.today);
  const tip = LIFESTYLE_TIPS[day % LIFESTYLE_TIPS.length];
  const meal = mealForHour(hour);
  const { ideas } = buildIdeas(overview.profile?.allergies ?? []);
  const found = ideaForMeal(ideas, meal, overview.targets?.kcal ?? null, day);
  const first = (actor.name || actor.username || '').trim().split(/\s+/)[0] ?? '';
  return (
    <HomeView
      name={first}
      hour={hour}
      overview={overview}
      diary={diary}
      week={week}
      wins={wins}
      activityLevels={reference.activityLevels}
      tip={{ text: tip.text, area: tip.area }}
      idea={found ? { ...found, meal } : null}
    />
  );
}
