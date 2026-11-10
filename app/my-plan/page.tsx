import { redirect } from 'next/navigation';

/** The MOH meal plan now lives in Eat well ("My plan" tab). The old address keeps working. */
export default function MyPlanPage() {
  redirect('/eat-well?tab=plan');
}
