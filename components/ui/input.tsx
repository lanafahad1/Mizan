import * as React from 'react';
import { cn } from '@/lib/utils';

export const inputClass =
  // B · Filled: soft and quiet until you type (bg-muted, no visible edge); on focus a white field with the ring colour.
  'w-full min-h-11 rounded-[12px] border-[1.5px] border-transparent bg-muted px-3.5 py-2 text-base text-foreground placeholder:text-muted-foreground transition-[background-color,border-color,box-shadow] duration-150 hover:border-input focus-visible:outline-none focus-visible:bg-card focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:bg-destructive-soft/40 disabled:opacity-60';

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea className={cn(inputClass, 'min-h-24 py-2.5 leading-relaxed', className)} {...props} />;
}

/** The select's chevron, in the primary colour (an inline style: a data URL inside a Tailwind class is not generated). */
const CHEVRON = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M4 6.5 8 10.5 12 6.5" fill="none" stroke="#3730A3" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>')}")`;

/** Native select: accessible and comfortable on phones. */
export function NativeSelect({ className, style, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(inputClass, 'appearance-none bg-[length:16px] bg-[position:right_12px_center] rtl:bg-[position:left_12px_center] bg-no-repeat pe-10', className)}
      style={{ backgroundImage: CHEVRON, ...style }}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return <label className={cn('font-display text-sm font-semibold text-heading', className)} {...props} />;
}
