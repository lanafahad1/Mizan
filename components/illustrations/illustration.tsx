// <Illustration name="empty-diary" className="size-28" /> — decorative by default.
import { cn } from '@/lib/utils';
import { illustrationSvg, type IllustrationName } from '@/lib/illustrations';

export function Illustration({ name, className, label }: { name: IllustrationName; className?: string; label?: string }) {
  return (
    <span role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
      className={cn('inline-block shrink-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full', className)} dangerouslySetInnerHTML={{ __html: illustrationSvg(name) }} />
  );
}
