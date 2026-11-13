'use client';
// The picture of one food in a list: its own tiny-world drawing (lib/art.js foodArt),
// decorative, as the food's name is written next to it.
import { foodArt } from '@/lib/art.js';
import { cn } from '@/lib/utils';

export type PictureFood = { id: string; kind?: string; name?: string; brand?: string | null; category?: string | null; art?: unknown };

export function FoodPicture({ food, className }: { food: PictureFood; className?: string }) {
  return (
    <span aria-hidden className={cn('block overflow-hidden rounded-[12px] bg-muted [&>svg]:block [&>svg]:h-full [&>svg]:w-full', className)}
      dangerouslySetInnerHTML={{ __html: foodArt(food) }} />
  );
}
