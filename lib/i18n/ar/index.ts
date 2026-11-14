// Arabic dictionary, split by area so several people can work on it at once.
// Key = the exact English text in the code; value = Arabic.
// Style: simple, warm standard Arabic (فصحى مبسّطة), like Saudi government health
// apps, with no dialect; precise standard Arabic for health, legal and source text.
// Official names keep their official Arabic form.
import { COMMON } from './common.ts';
import { PUBLIC } from './public.ts';
import { AUTH } from './auth.ts';
import { HEALTH } from './health.ts';
import { PATIENT } from './patient.ts';
import { STAFF } from './staff.ts';
import { DOMAIN } from './domain.ts';
import { MEMBER } from './member.ts';
import { DIARY } from './diary.ts';
import { ART } from './art.ts';
import { NAMES } from './names.ts';
import { CARE } from './care.ts';
import { WELLBEING } from './wellbeing.ts';
export { PATTERNS } from './patterns.ts';

export const AR: Record<string, string> = { ...WELLBEING, ...NAMES, ...CARE, ...DOMAIN, ...STAFF, ...PATIENT, ...HEALTH, ...ART, ...DIARY, ...MEMBER, ...AUTH, ...PUBLIC, ...COMMON };
