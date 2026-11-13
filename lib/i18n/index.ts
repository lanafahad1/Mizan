// Language support: English (default) and Arabic (Saudi-friendly wording; health,
// medical and source text in clear standard Arabic). The English text is the key:
// a string without an Arabic entry is shown in English, so nothing ever breaks.
// The choice is a cookie set only when the person clicks the language switch.
import { AR, PATTERNS } from './ar/index.ts';

export type Lang = 'en' | 'ar';
export const LANG_COOKIE = 'mizan-lang';
export const isLang = (v: unknown): v is Lang => v === 'en' || v === 'ar';
export const dirOf = (lang: Lang) => (lang === 'ar' ? 'rtl' : 'ltr');

export type Vars = Record<string, string | number | null | undefined>;
export type T = (text: string, vars?: Vars) => string;

const fill = (s: string, vars?: Vars) => (vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : String(vars[k]))) : s);

/** Arabic for a sentence built with values (see ar/patterns.ts), or null. Nested parts are translated too. */
function byPattern(text: string, depth = 0): string | null {
  if (depth > 3) return null;
  for (const [re, tpl] of PATTERNS) {
    const m = text.match(re);
    if (!m) continue;
    return tpl.replace(/\{t:\$(\d+)\}/g, (_, i) => arabicOf(m[Number(i)] ?? '', depth + 1)).replace(/\$(\d+)/g, (_, i) => m[Number(i)] ?? '');
  }
  return byList(text, depth);
}

/** "A, B and C" where every item has an Arabic entry → "A، B وC". */
function byList(text: string, depth: number): string | null {
  const parts = text.split(/, | and /);
  if (parts.length < 2) return null;
  const ar = parts.map((p) => AR[p] ?? AR[p.charAt(0).toUpperCase() + p.slice(1)] ?? (depth < 3 ? byPattern(p, depth + 1) : null));
  if (ar.some((x) => x == null)) return null;
  return ar.length === 2 ? `${ar[0]} و${ar[1]}` : `${ar.slice(0, -1).join('، ')} و${ar.at(-1)}`;
}

/** Several notes joined by "; " (change summaries): translate each part. */
function byParts(text: string, depth: number): string | null {
  if (depth > 3 || !text.includes('; ')) return null;
  return text.split('; ').map((p) => arabicOf(p, depth + 1)).join('؛ ');
}

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
const arabicOf = (x: string, depth: number): string => AR[x] ?? AR[x.trim()] ?? AR[cap(x)] ?? byPattern(x, depth) ?? byParts(x, depth) ?? x;

/** Translate an English text (with optional {placeholders}) into the given language. */
export function translate(lang: Lang, text: string, vars?: Vars): string {
  if (text == null || typeof text !== 'string') return text;
  if (lang !== 'ar') return fill(text, vars);
  return fill(arabicOf(text, 0), vars);
}

export const makeT = (lang: Lang): T => (text, vars) => translate(lang, text, vars);
