import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Info, CircleCheck, CircleAlert, OctagonAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

// Soft banner: a compact row with an icon, then the title in bold and the text on the same line.
// Warnings and allergies are light red (never a solid red block); information is soft lavender.
const noticeVariants = cva('flex items-start gap-2.5 rounded-[12px] px-3.5 py-2.5 text-[.92rem] leading-snug [&>svg]:mt-[1px] [&>svg]:size-[18px] [&>svg]:shrink-0', {
  variants: {
    tone: {
      info: 'bg-secondary text-secondary-foreground',
      ok: 'bg-success-soft text-success',
      warn: 'bg-warning-soft text-warning',
      danger: 'bg-destructive-soft text-destructive',
      rose: 'bg-accent text-accent-foreground',
    },
  },
  defaultVariants: { tone: 'info' },
});
const ICON = { info: Info, ok: CircleCheck, warn: CircleAlert, danger: OctagonAlert, rose: Info };

/** Status message: text plus icon (never colour alone). Short text sits on one line after the bold title. */
export function Notice({ tone = 'info', title, children, className, role, icon }: VariantProps<typeof noticeVariants> & { title?: React.ReactNode; children?: React.ReactNode; className?: string; role?: string; icon?: React.ReactNode }) {
  const Icon = ICON[tone ?? 'info'];
  const inline = typeof children === 'string' || typeof children === 'number';
  return (
    <div role={role ?? (tone === 'danger' ? 'alert' : undefined)} className={cn(noticeVariants({ tone }), className)}>
      {icon ?? <Icon aria-hidden />}
      {inline || !children ? (
        <p className="m-0 min-w-0">
          {title ? <strong className="font-display font-semibold">{title}</strong> : null}
          {title && children != null ? ' ' : null}
          {children}
        </p>
      ) : (
        <div className="flex min-w-0 flex-col gap-1">
          {title ? <strong className="font-display font-semibold">{title}</strong> : null}
          <div className="leading-snug">{children}</div>
        </div>
      )}
    </div>
  );
}
