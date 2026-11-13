import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-display font-medium leading-tight whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-55 [&_svg]:size-[1.1em] [&_svg]:shrink-0 cursor-pointer no-underline max-sm:whitespace-normal max-sm:text-center',
  {
    variants: {
      variant: {
        // A · Pill: one solid indigo main action, a soft lavender second action, a quiet text action.
        default: 'bg-primary text-primary-foreground font-semibold hover:bg-primary-hover',
        secondary: 'bg-secondary text-secondary-foreground font-semibold hover:bg-secondary-hover',
        outline: 'border border-border bg-card text-primary font-semibold hover:border-sage hover:bg-secondary',
        ghost: 'bg-transparent text-primary font-semibold hover:bg-secondary',
        soft: 'bg-secondary text-secondary-foreground font-semibold hover:bg-secondary-hover',
        destructive: 'bg-destructive-soft text-destructive font-semibold hover:bg-destructive-border',
        'destructive-solid': 'bg-destructive text-white font-semibold hover:bg-destructive/90',
        link: 'text-primary underline underline-offset-4 hover:text-primary-hover px-0',
      },
      size: {
        sm: 'min-h-9 px-3.5 py-1.5 text-sm',
        default: 'min-h-11 px-5 py-2.5 text-[.95rem]',
        lg: 'min-h-12 px-6 py-3 text-base',
        icon: 'size-10 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
