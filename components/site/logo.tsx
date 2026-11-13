import Link from 'next/link';
import { logoMark } from '@/lib/art.js';

export function Logo({ href = '/', className = '' }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 font-display text-xl font-semibold text-heading no-underline ${className}`} aria-label="Mizan home">
      <span className="size-10 shrink-0" dangerouslySetInnerHTML={{ __html: logoMark() }} />
      <span className="flex flex-col leading-none">
        <span className="text-foreground">Mi<b className="font-semibold text-accent-foreground">zan</b></span>
        <span lang="ar" dir="rtl" className="font-arabic mt-0.5 self-start text-[.8rem] font-semibold text-primary">ميزان</span>
      </span>
    </Link>
  );
}
