import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, CircleAlert, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

// Status tags: soft filled pills (one meaning per colour) with a leading icon, so status is never colour alone.
// green = fits / done, amber = check, red = allergen or problem, sky = waiting or information.
export const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[.78rem] font-bold leading-5 whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0', {
  variants: {
    variant: {
      neutral: 'border-border bg-card text-foreground',
      sage: 'border-transparent bg-secondary text-secondary-foreground',
      mint: 'border-transparent bg-secondary text-secondary-foreground',
      rose: 'border-transparent bg-accent text-accent-foreground',
      info: 'border-transparent bg-accent text-accent-foreground',
      warn: 'border-transparent bg-warning-soft text-warning',
      danger: 'border-transparent bg-destructive-soft text-destructive',
      ok: 'border-transparent bg-success-soft text-success',
      dark: 'border-transparent bg-primary text-primary-foreground',
      outline: 'border-dashed border-input bg-transparent text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'neutral' },
});

/** The icon a health-status tag gets when the caller does not pass one. */
const DEFAULT_ICON: Partial<Record<string, React.ComponentType<{ 'aria-hidden'?: boolean }>>> = { ok: Check, warn: CircleAlert, danger: Ban };

export function Badge({ className, variant, children, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  const Icon = DEFAULT_ICON[variant ?? 'neutral'];
  // Callers that start with their own icon (any element) keep it; plain text gets the default icon.
  const first = React.Children.toArray(children)[0];
  const needsIcon = Icon && !React.isValidElement(first);
  return <span className={cn(badgeVariants({ variant }), className)} {...props}>{needsIcon ? <Icon aria-hidden /> : null}{children}</span>;
}
