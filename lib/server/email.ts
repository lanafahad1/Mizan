// Account emails (email confirmation and password reset) and new-message alerts, sent through Gmail SMTP
// with an app password. Configuration lives only in environment variables:
//   GMAIL_USER          the Gmail address that sends the emails
//   GMAIL_APP_PASSWORD  a 16-character Google app password (needs 2-step verification)
//   EMAIL_FROM_NAME     optional display name (default "Mizan")
// Without them, no email is sent: the app says the feature is unavailable, and in
// development the link is printed in the server log so it can still be tested.
import 'server-only';
import nodemailer from 'nodemailer';
import { SITE_NAME, SITE_URL, originOf } from '@/lib/site';
import { LANG_COOKIE, type Lang } from '@/lib/i18n';
import { EMAIL_LOGO_PNG_BASE64 } from './email-logo';

const LOGO_CID = 'logo@mizan';

export const emailConfigured = () => Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
const isDev = process.env.NODE_ENV !== 'production';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;
function transport() {
  transporter ??= nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: process.env.GMAIL_USER, pass: (process.env.GMAIL_APP_PASSWORD ?? '').replace(/\s+/g, '') },
  });
  return transporter;
}

/** The language of the request (from the language switch cookie). */
export function langOf(request?: Request): Lang {
  const cookie = request?.headers.get('cookie') ?? '';
  return new RegExp(`(?:^|;\\s*)${LANG_COOKIE}=ar(?:;|$)`).test(cookie) ? 'ar' : 'en';
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

type Mail = { heading: string; intro: string; button: string; note: string; subject: string };
export type EmailKind = 'verify' | 'reset' | 'message-patient' | 'message-team';
const TEXT: Record<EmailKind, Record<Lang, (name: string, username: string) => Mail>> = {
  verify: {
    en: (name) => ({
      subject: 'Confirm your email for Mizan', heading: `Welcome to Mizan${name ? `, ${name}` : ''}`,
      intro: 'We’re glad you’re here. Confirm your email so we can help if you ever forget your password.',
      button: 'Confirm my email', note: 'This link works for 1 hour. Didn’t sign up for Mizan? You can ignore this email.',
    }),
    ar: (name) => ({
      subject: 'أكّد بريدك الإلكتروني في ميزان', heading: `أهلًا بك في ميزان${name ? `، ${name}` : ''}`,
      intro: 'سعداء بانضمامك. أكّد بريدك الإلكتروني حتى نتمكن من مساعدتك إذا نسيت كلمة المرور.',
      button: 'أكّد بريدي', note: 'الرابط صالح لمدة ساعة. إذا لم تسجّل في ميزان، يمكنك تجاهل هذه الرسالة.',
    }),
  },
  reset: {
    en: (_n, username) => ({
      subject: 'Reset your Mizan password', heading: 'Reset your password',
      intro: `Someone asked to reset the password for @${username}. If it was you, choose a new one below.`,
      button: 'Choose a new password', note: 'This link works once, for 1 hour. Changing your password signs you out on your other devices. Didn’t ask for this? Ignore this email and your password stays the same.',
    }),
    ar: (_n, username) => ({
      subject: 'إعادة تعيين كلمة المرور في ميزان', heading: 'إعادة تعيين كلمة المرور',
      intro: `وصلنا طلب لإعادة تعيين كلمة المرور للحساب @${username}. إذا كان الطلب منك، فاختر كلمة مرور جديدة من الزر أدناه.`,
      button: 'اختر كلمة مرور جديدة', note: 'يعمل الرابط مرة واحدة ولمدة ساعة. عند تغيير كلمة المرور، سيُسجَّل خروجك من أجهزتك الأخرى. إذا لم تطلب ذلك، فتجاهل هذه الرسالة وستبقى كلمة المرور كما هي.',
    }),
  },
  // New-message alerts say only that there is a message: never what it says. (The second
  // argument carries the patient's demonstration id for the care team's alert.)
  'message-patient': {
    en: (name) => ({
      subject: 'You have a new message from your care team', heading: `You have a new message${name ? `, ${name}` : ''}`,
      intro: 'Your care team sent you a message in Mizan. Open Mizan to read it and reply.',
      button: 'Read the message', note: 'For your privacy, this email never includes what the message says. For emergencies call 997 or go to the nearest emergency department.',
    }),
    ar: (name) => ({
      subject: 'لديك رسالة جديدة من فريق الرعاية', heading: `لديك رسالة جديدة${name ? `، ${name}` : ''}`,
      intro: 'أرسل لك فريق الرعاية رسالة في ميزان. افتح ميزان لقراءتها والرد عليها.',
      button: 'اقرأ الرسالة', note: 'حفاظًا على خصوصيتك، لا تتضمن هذه الرسالة نص الرسالة أبدًا. في حالات الطوارئ اتصل بالرقم 997 أو توجّه إلى أقرب قسم طوارئ.',
    }),
  },
  'message-team': {
    en: (_n, demoId) => ({
      subject: `New message from patient ${demoId}`, heading: `New message from patient ${demoId}`,
      intro: 'A patient sent a message to their care team in Mizan. Open the conversation to read it and reply.',
      button: 'Open the conversation', note: 'For privacy, this email never includes the message itself.',
    }),
    ar: (_n, demoId) => ({
      subject: `رسالة جديدة من المريض ${demoId}`, heading: `رسالة جديدة من المريض ${demoId}`,
      intro: 'أرسل مريض رسالة إلى فريق رعايته في ميزان. افتح المحادثة لقراءتها والرد عليها.',
      button: 'افتح المحادثة', note: 'حفاظًا على الخصوصية، لا تتضمن هذه الرسالة نص الرسالة أبدًا.',
    }),
  },
};
const FOOT: Record<Lang, string> = {
  en: 'Your plate, your balance · A university Health Informatics project. You’re getting this because a Mizan account uses this address. Mizan will never ask for your password by email.',
  ar: 'طبقك، توازنك · مشروع جامعي في المعلوماتية الصحية. وصلتك هذه الرسالة لأن حسابًا في ميزان يستخدم هذا البريد. لن يطلب ميزان كلمة المرور عبر البريد أبدًا.',
};

/** Email HTML: one centred card, inline styles only (email clients ignore stylesheets), RTL for Arabic. */
export function renderEmail(kind: EmailKind, lang: Lang, url: string, user: { name?: string; username?: string }) {
  const m = TEXT[kind][lang](user.name ?? '', user.username ?? '');
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const font = lang === 'ar' ? "Rubik, 'Geeza Pro', Tahoma, Arial, sans-serif" : "Nunito, 'Segoe UI', Arial, sans-serif";
  const head = lang === 'ar' ? font : "Poppins, 'Segoe UI', Arial, sans-serif";
  const logo = `cid:${LOGO_CID}`;
  const html = `<!doctype html><html lang="${lang}" dir="${dir}"><body style="margin:0;background:#F3EFE8;padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border:1px solid #E8E2D8;border-radius:16px;overflow:hidden" dir="${dir}">
<tr><td style="background:#EEEDFA;padding:16px 24px;border-bottom:1px solid #DCD9F4"><img src="${logo}" width="40" height="40" alt="" style="vertical-align:middle;border:0"> <span dir="ltr" style="vertical-align:middle;font-family:${head};font-size:20px;font-weight:600;color:#1B1A3A">Mi<span style="color:#0B5A88">zan</span></span></td></tr>
<tr><td style="padding:24px;font-family:${font};font-size:15px;line-height:1.6;color:#1B1A3A;text-align:${lang === 'ar' ? 'right' : 'left'}">
<h1 style="margin:0 0 10px;font-family:${head};font-size:20px;color:#1B1A3A">${esc(m.heading)}</h1>
<p style="margin:0 0 18px">${esc(m.intro)}</p>
<p style="margin:0 0 18px"><a href="${esc(url)}" style="display:inline-block;background:#3730A3;color:#FFFFFF;text-decoration:none;border-radius:999px;padding:12px 24px;font-family:${head};font-size:15px">${esc(m.button)}</a></p>
<p style="margin:0 0 14px;font-size:13px;color:#615F74">${esc(m.note)}</p>
<p style="margin:0;font-size:12px;color:#615F74">${lang === 'ar' ? 'إذا لم يعمل الزر، فانسخ هذا الرابط:' : 'Button not working? Copy this link:'}<br><a href="${esc(url)}" dir="ltr" style="color:#3730A3;word-break:break-all">${esc(url)}</a></p>
</td></tr>
<tr><td style="background:#FBF8F3;padding:14px 24px;border-top:1px solid #E8E2D8;font-family:${font};font-size:12px;line-height:1.5;color:#615F74;text-align:${lang === 'ar' ? 'right' : 'left'}">${esc(FOOT[lang])}</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${m.heading}\n\n${m.intro}\n\n${m.button}: ${url}\n\n${m.note}\n\n${FOOT[lang]}`;
  return { subject: m.subject, html, text };
}

/** Send an account email. Returns false when email is not configured (nothing is sent). */
export async function sendAccountEmail(kind: 'verify' | 'reset', to: string, url: string, user: { name?: string; username?: string }, request?: Request) {
  const lang = langOf(request);
  const mail = renderEmail(kind, lang, url, user);
  if (!emailConfigured()) {
    if (isDev) console.info(`[email not configured] ${kind} email for ${to}: ${url}`);
    return false;
  }
  // Demo and test accounts use reserved, fictional domains (.test, .local, .example,
  // .invalid, example.com/org/net): never try to deliver to them.
  if (/(\.(test|local|example|invalid|localhost)|(^|\.)example\.(com|org|net))$/i.test(to.split('@')[1] ?? '')) return false;
  await transport().sendMail({ from: { name: process.env.EMAIL_FROM_NAME || SITE_NAME, address: process.env.GMAIL_USER as string }, to, subject: mail.subject, html: mail.html, text: mail.text,
    attachments: [{ filename: 'mizan.png', content: Buffer.from(EMAIL_LOGO_PNG_BASE64, 'base64'), cid: LOGO_CID, contentType: 'image/png' }] });
  return true;
}

/** A new-message alert queued by the domain (domain/care-service.js): who gets it and where it links. */
export type MessageAlert = { type: 'message'; kind: 'patient' | 'team'; to: string; name?: string; lang?: string; demoId: string; path: string };

/**
 * Email that there is a new message (never its text). The domain already skipped demo accounts,
 * reserved test domains and alerts sent in the last hour; test domains are skipped here as well.
 */
export async function sendMessageAlert(a: MessageAlert) {
  const lang: Lang = a.lang === 'ar' ? 'ar' : 'en';
  const base = originOf(process.env.BETTER_AUTH_URL) || SITE_URL;
  const url = `${base}${a.path.startsWith('/') ? a.path : `/${a.path}`}`;
  const mail = renderEmail(a.kind === 'patient' ? 'message-patient' : 'message-team', lang, url, { name: a.name ?? '', username: a.demoId });
  if (!emailConfigured()) {
    if (isDev) console.info(`[email not configured] new-message alert for ${a.to}: ${url}`);
    return false;
  }
  if (/(\.(test|local|example|invalid|localhost)|(^|\.)example\.(com|org|net))$/i.test(a.to.split('@')[1] ?? '')) return false;
  await transport().sendMail({ from: { name: process.env.EMAIL_FROM_NAME || SITE_NAME, address: process.env.GMAIL_USER as string }, to: a.to, subject: mail.subject, html: mail.html, text: mail.text,
    attachments: [{ filename: 'mizan.png', content: Buffer.from(EMAIL_LOGO_PNG_BASE64, 'base64'), cid: LOGO_CID, contentType: 'image/png' }] });
  return true;
}
