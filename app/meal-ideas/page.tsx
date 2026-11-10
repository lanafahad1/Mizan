import { redirect } from 'next/navigation';

/** Meal ideas now live in Eat well (first tab). The old address keeps working. */
export default function MealIdeasPage() {
  redirect('/eat-well?tab=ideas');
}
