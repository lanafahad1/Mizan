// Server side: the language comes from the cookie the switch sets (English by default).
import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { LANG_COOKIE, isLang, makeT, type Lang } from './index';

export const getLang = cache(async (): Promise<Lang> => {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : 'en';
});

/** Translator for server components: `const t = await getT();` */
export async function getT() {
  return makeT(await getLang());
}
