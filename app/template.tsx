import { ViewTransition } from 'react';

// Re-mounted on every navigation, so each new page can animate in: the old page fades out and the
// new one fades in and rises a little (styles in app/styles/motion.css). The header has its own
// transition name and stays still. Without view-transition support pages simply swap, as before.
export default function Template({ children }: { children: React.ReactNode }) {
  return <ViewTransition enter="mz-page-in" exit="mz-page-out" default="none">{children}</ViewTransition>;
}
