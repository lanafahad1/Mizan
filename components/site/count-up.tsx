'use client';
// A number that counts up from 0 (~600 ms, requestAnimationFrame) the first time it is seen.
// A number that was server-rendered and is already on screen when the page hydrates is left as it is
// (counting it down to 0 would flash). Screen readers always get the real value.
import * as React from 'react';
import { onFirstView, prefersReducedMotion } from './reveal';

const noop = () => () => {};

export function CountUp({ value, format, duration = 600 }: { value: number; format: (n: number) => string; duration?: number }) {
  // false while hydrating server HTML, true when mounted on the client (a client navigation).
  const clientMount = React.useSyncExternalStore(noop, () => true, () => false);
  const fresh = React.useRef(clientMount);
  const ref = React.useRef<HTMLSpanElement>(null);
  const latest = React.useRef({ value, format });
  React.useLayoutEffect(() => { latest.current = { value, format }; });
  React.useLayoutEffect(() => {
    const el = ref.current;
    const node = el?.firstChild;
    if (!el || !(node instanceof Text) || prefersReducedMotion() || !(latest.current.value > 0)) return;
    const r = el.getBoundingClientRect();
    if (!fresh.current && r.top < window.innerHeight && r.bottom > 0) return;
    const show = (v: number) => { node.nodeValue = latest.current.format(v); };
    let raf = 0;
    let done = false;
    show(0);
    const stop = onFirstView(el, () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const target = latest.current.value;
        show(p < 1 ? target * (1 - (1 - p) ** 3) : target);
        if (p < 1) raf = requestAnimationFrame(tick); else done = true;
      };
      raf = requestAnimationFrame(tick);
    });
    return () => { stop(); cancelAnimationFrame(raf); if (!done) show(latest.current.value); };
  }, [duration]);
  return (
    <>
      <span ref={ref} aria-hidden="true">{format(value)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
