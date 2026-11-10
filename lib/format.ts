// Small formatters shared by server and client components.
// Dates follow the site language: pass `lang` from server components (getLang());
// in the browser it defaults to the page language. Arabic uses the Gregorian
// calendar with Western digits (as most Saudi apps do), e.g. "الثلاثاء، 10 نوفمبر".
type L = 'en' | 'ar';
const pageLang = (): L => (typeof document !== 'undefined' && document.documentElement.lang === 'ar' ? 'ar' : 'en');
const loc = (lang?: L) => ((lang ?? pageLang()) === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-US');

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }, lang?: L) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(loc(lang), opts);
}
export const formatLongDate = (iso: string, lang?: L) => formatDate(iso, { weekday: 'long', month: 'long', day: 'numeric' }, lang);
export function formatDateTime(iso: string, lang?: L) {
  return new Date(iso).toLocaleString(loc(lang), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
export function timeAgo(iso: string, now = Date.now(), lang?: L) {
  const ar = (lang ?? pageLang()) === 'ar';
  const s = (now - new Date(iso).getTime()) / 1000;
  if (s < 60) return ar ? 'الحين' : 'just now';
  if (s < 3600) return ar ? `قبل ${Math.floor(s / 60)} دقيقة` : `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return ar ? `قبل ${Math.floor(s / 3600)} ساعة` : `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString(loc(lang), { month: 'short', day: 'numeric' });
}
export const cap = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const isoDate = (s?: string | null) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined);
