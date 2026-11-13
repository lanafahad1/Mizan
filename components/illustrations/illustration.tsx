// <Illustration name="empty-diary" className="size-28" /> — decorative by default.
import type * as React from 'react';
import { cn } from '@/lib/utils';
import { illustrationSvg, type IllustrationName } from '@/lib/illustrations';

/** A fixed offset per drawing, so the gentle bob (app/styles/motion.css) is not in step everywhere. */
const offset = (name: string) => `${-([...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 50) / 10}s`;

/** `still`: no idle bob or sparkle twinkle (small pictures repeated in lists); it still lifts with its card on hover. */
export function Illustration({ name, className, label, still = false }: { name: IllustrationName; className?: string; label?: string; still?: boolean }) {
  return (
    <span role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
      className={cn('mz-illo inline-block shrink-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full', still && 'mz-still', className)}
      style={{ '--mz-o': offset(name) } as React.CSSProperties} dangerouslySetInnerHTML={{ __html: illustrationSvg(name) }} />
  );
}
