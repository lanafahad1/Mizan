'use client';
// Motion runtime (styles in app/styles/motion.css). Mounted once in the root layout; renders nothing.
// - Scroll reveal: sections, cards, list rows and tiles in <main> that start BELOW the fold fade and
//   rise ~12px the first time they enter the viewport; lists and [data-reveal-group] children inside
//   them follow with a small stagger. What is on screen when the page loads is never hidden.
// - Page entry: content that replaces the page in <main> after a client navigation fades in.
// - Play on first view: the CSS animations inside .mz-play / .mz-illo (bars growing, the week line
//   drawing, illustrations) start when they first come into view instead of off screen.
// One shared IntersectionObserver; each element is handled once and then unobserved.
// Everything runs through the Web Animations API, so no class or attribute is written to markup that
// React may still be hydrating, and nothing runs when the person prefers reduced motion.
import * as React from 'react';

const EASE = 'cubic-bezier(.2,.7,.2,1)';
/** Things that reveal on their own (the outermost one wins). */
const ITEMS = 'section, article, li, [data-reveal], [data-reveal-group] > *';
/** Hosts of CSS animations that should wait until they are seen. */
const PLAY = '.mz-play, .mz-illo';
/** Never reveal inside these (navigation, menus, popups, folded panels, loading placeholders, hidden text). */
const SKIP = 'nav, header, footer, [role="tablist"], [role="listbox"], [role="menu"], [role="radiogroup"], [role="dialog"], [role="status"], .t-acc-panel, .t-skel, .sr-only, [hidden], [data-no-reveal], svg, table';
/** Leave these (and everything inside them) alone: their own entrance motion, canvases, fixed/sticky children. */
const STILL = '.mz-rise, canvas, video, iframe, .fixed, .sticky, [data-no-reveal]';

/** The browser runs page changes as view transitions (app/template.tsx). */
const VT = typeof document !== 'undefined' && 'startViewTransition' in document;

/** Anything a person presses: buttons, button-like links, tabs, chips, clickable cards. */
const PRESSABLE = 'button:not(:disabled), [role="button"]:not([aria-disabled="true"]), [role="tab"], [role="menuitem"], [role="option"], summary, a.mz-press, a.mz-lift, label:has(> input[type="checkbox"], > input[type="radio"])';
const GLOW: Keyframe[] = [
  { outlineOffset: '0px', outlineColor: 'color-mix(in srgb, var(--primary) 55%, transparent)' },
  { outlineOffset: '9px', outlineColor: 'color-mix(in srgb, var(--primary) 0%, transparent)' },
];
/** Tap glow: a soft ring spreads out around what was pressed (outline, so it never shifts layout). */
function glow(target: EventTarget | null) {
  const el = target instanceof Element ? target.closest(PRESSABLE) : null;
  if (!(el instanceof HTMLElement)) return;
  el.getAnimations().forEach((a) => { if ((a as Animation & { id: string }).id === 'mz-glow') a.cancel(); });
  el.classList.add('mz-glow-ring');
  const a = el.animate(GLOW, { duration: 560, easing: 'cubic-bezier(.2,.7,.2,1)' });
  a.id = 'mz-glow';
  const done = () => { if (!el.getAnimations().some((x) => x.id === 'mz-glow')) el.classList.remove('mz-glow-ring'); };
  a.onfinish = done; a.oncancel = done;
}

const RISE: Keyframe[] = [{ opacity: 0, transform: 'translate3d(0, 12px, 0)' }, { opacity: 1, transform: 'none' }];
const RISE_KID: Keyframe[] = [{ opacity: 0, transform: 'translate3d(0, 8px, 0)' }, { opacity: 1, transform: 'none' }];

type Watcher = { cb: (order: number) => void; stagger: boolean };

let io: IntersectionObserver | null = null;
const waiting = new Map<Element, Watcher[]>();
/** Reveal state per element: still (left alone), wait (hidden until seen), done, kid (part of a parent's stagger). */
const seen = new WeakMap<Element, 'still' | 'wait' | 'done' | 'kid'>();
const played = new WeakSet<Element>();

export const prefersReducedMotion = () => typeof window === 'undefined' || !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function release(el: Element, order: number) {
  const list = waiting.get(el);
  if (!list) return;
  waiting.delete(el);
  io?.unobserve(el);
  for (const w of list) w.cb(order);
}

function onIntersect(entries: IntersectionObserverEntry[]) {
  const hits = entries.filter((e) => e.isIntersecting).map((e) => e.target);
  hits.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  let order = 0;
  for (const el of hits) {
    const list = waiting.get(el);
    if (!list) continue;
    release(el, list.some((w) => w.stagger) ? order++ : 0);
  }
}

/**
 * Call `cb` once, the first time `el` enters the viewport (through the one shared observer).
 * `order` is its place among the reveal items that entered together (for a stagger). Returns a cancel function.
 */
export function onFirstView(el: Element, cb: (order: number) => void, stagger = false): () => void {
  if (typeof IntersectionObserver === 'undefined') { cb(0); return () => {}; }
  io ??= new IntersectionObserver(onIntersect, { rootMargin: '0px 0px -6% 0px' });
  const w: Watcher = { cb, stagger };
  const list = waiting.get(el);
  if (list) list.push(w); else { waiting.set(el, [w]); io.observe(el); }
  return () => {
    const l = waiting.get(el);
    if (!l) return;
    const rest = l.filter((x) => x !== w);
    if (rest.length) waiting.set(el, rest); else { waiting.delete(el); io?.unobserve(el); }
  };
}

const inView = (r: DOMRect, vh: number) => r.top < vh * 0.94 && r.bottom > 0;
const isHidden = (r: DOMRect) => !r.width && !r.height;

/** Lists and [data-reveal-group]s inside a reveal item: their children rise in turn (2–12 per list, 16 at most). */
function kidsOf(el: Element): HTMLElement[] {
  const out: HTMLElement[] = [];
  const groups = [...(el.matches('[data-reveal-group]') ? [el] : []), ...el.querySelectorAll('[data-reveal-group], ul, ol')];
  for (const g of groups) {
    if (out.length >= 16) break;
    if (g !== el && g.closest(SKIP)) continue;
    if (out.some((k) => k.contains(g))) continue;
    const kids = [...g.children].filter((c): c is HTMLElement => c instanceof HTMLElement && !c.classList.contains('sr-only'));
    if (kids.length >= 2 && kids.length <= 12) out.push(...kids.slice(0, 16 - out.length));
  }
  return out;
}

function trackItem(el: Element, main: Element, vh: number) {
  if (seen.has(el) || !(el instanceof HTMLElement)) return;
  for (let p = el.parentElement; p && p !== main; p = p.parentElement) if (seen.has(p)) return;
  if (el.closest(SKIP)) return;
  if (el.matches(STILL) || el.querySelector(STILL)) { seen.set(el, 'still'); return; }
  const r = el.getBoundingClientRect();
  if (isHidden(r)) return; // display:none for now (a closed tab): left as it is
  if (r.height > vh * 1.1) return; // taller than the screen: its parts reveal on their own
  if (r.top < vh && r.bottom > 0) { seen.set(el, 'done'); return; } // already on screen: never hide it
  if (r.bottom <= 0) { seen.set(el, 'done'); return; } // above the viewport (scroll restored)
  const anim = el.animate(RISE, { duration: 420, easing: EASE, fill: 'backwards' });
  anim.pause();
  const kids = kidsOf(el).map((k) => {
    seen.set(k, 'kid');
    const a = k.animate(RISE_KID, { duration: 340, easing: EASE, fill: 'backwards' });
    a.pause();
    return a;
  });
  seen.set(el, 'wait');
  onFirstView(el, (order) => {
    const d = Math.min(order, 5) * 70;
    anim.effect?.updateTiming({ delay: d });
    anim.play();
    kids.forEach((a, i) => { a.effect?.updateTiming({ delay: d + 100 + Math.min(i, 10) * 45 }); a.play(); });
    seen.set(el, 'done');
  }, true);
}

function trackPlay(el: Element, vh: number) {
  if (played.has(el)) return;
  played.add(el);
  const r = el.getBoundingClientRect();
  if (isHidden(r) || inView(r, vh) || r.bottom <= 0) return; // CSS plays it now (or when it is shown)
  const anims = el.getAnimations({ subtree: true }).filter((a) => typeof CSSAnimation !== 'undefined' && a instanceof CSSAnimation && a.animationName.startsWith('mz-'));
  if (!anims.length) return;
  for (const a of anims) { a.pause(); a.currentTime = 0; }
  onFirstView(el, () => { for (const a of anims) a.play(); });
}

function scan(root: Element, main: Element) {
  const vh = window.innerHeight;
  if (root !== main && root.matches(ITEMS)) trackItem(root, main, vh);
  root.querySelectorAll(ITEMS).forEach((el) => trackItem(el, main, vh));
  if (root.matches(PLAY)) trackPlay(root, vh);
  root.querySelectorAll(PLAY).forEach((el) => trackPlay(el, vh));
}

/** Show everything still waiting at once (printing). */
function flushAll() { for (const el of [...waiting.keys()]) release(el, 0); }

export function MotionRuntime() {
  // Tap glow on every pressable thing on the page (pointer, and Enter/Space from the keyboard).
  React.useEffect(() => {
    if (prefersReducedMotion() || !Element.prototype.animate) return;
    const onDown = (e: PointerEvent) => { if (e.button === 0) glow(e.target); };
    const onKey = (e: KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) glow(e.target); };
    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

  React.useEffect(() => {
    const main = document.getElementById('main');
    if (!main || prefersReducedMotion() || typeof IntersectionObserver === 'undefined' || !Element.prototype.animate) return;
    scan(main, main);
    const mo = new MutationObserver((records) => {
      let removed = false;
      for (const rec of records) {
        if (rec.removedNodes.length) removed = true;
        rec.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement) || !n.isConnected || n.closest('[hidden]')) return;
          // Page entry: a new page (or the content replacing its loading placeholder) fades in.
          // (Browsers with view transitions get the smoother page change from app/template.tsx instead.)
          if (!VT && n.parentElement === main && !(n instanceof HTMLScriptElement) && !(n instanceof HTMLTemplateElement)) {
            n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: EASE });
          }
          scan(n, main);
        });
      }
      if (removed) for (const el of [...waiting.keys()]) if (!el.isConnected) { waiting.delete(el); io?.unobserve(el); }
    });
    mo.observe(main, { childList: true, subtree: true });
    // Keyboard users: anything that takes focus is shown at once.
    const onFocus = (e: FocusEvent) => {
      for (let p = e.target instanceof Element ? e.target : null; p && p !== main; p = p.parentElement) if (waiting.has(p)) release(p, 0);
    };
    document.addEventListener('focusin', onFocus);
    window.addEventListener('beforeprint', flushAll);
    return () => {
      mo.disconnect();
      document.removeEventListener('focusin', onFocus);
      window.removeEventListener('beforeprint', flushAll);
    };
  }, []);
  return null;
}
