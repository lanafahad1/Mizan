import Link from 'next/link';
import { publicMetadata } from '@/components/public/seo';
import { PageHead } from '@/components/site/page-head';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata() {
  const t = await getT();
  return publicMetadata({
    title: t('Privacy Policy'),
    description: t('How Mizan, an academic demonstration built around a fictional hospital, handles information: what is stored and why, who can see what, how it is protected, your controls and the Saudi Personal Data Protection Law (PDPL).'),
    path: '/privacy',
  });
}

export default async function PrivacyPage() {
  const t = await getT();
  // A sentence whose subject is bold: one key, so Arabic keeps its own word order.
  const bold = (key: string) => { const [a, b, c] = t(key).split(/<\/?b>/); return <>{a}<b>{b}</b>{c}</>; };
  return (
    <>
      <PageHead eyebrow={t('Privacy Policy')} title={t('How Mizan looks after your information')} narrow>
        <p>{t('Mizan is a university demonstration built around a fictional hospital. It shows how health information can be handled with privacy in mind. Please use made-up information only.')}</p>
      </PageHead>
      <div className="container-page container-narrow pb-16">
        <div className="prose-cb">
          <h2>{t('Who manages the information')}</h2>
          <p>{t('Mizan is managed by the hospital. Patient nutrition records are created and maintained by the hospital nutrition team, which remains responsible for dietary oversight. Patients can link a personal account to take part in planning their own meals.')}</p>
          <h2>{t('What we store, and why')}</h2>
          <ul>
            <li><b>{t('Accounts:')}</b> {t('username, email, display name, role and a hashed password.')}</li>
            <li><b>{t('Account emails:')}</b> {t('your email is used only to confirm it and to send a password-reset link when you ask for one. Mizan sends no newsletters or marketing, and never asks for your password by email.')}</li>
            <li><b>{t('Patient nutrition profile:')}</b> {t('a demonstration identifier (CB-####), ward and bed, age range, relevant conditions, the prescribed diet order, allergies and intolerances (recorded separately), medically required exclusions, food preferences and appetite. Used only to screen, rank and prepare meals.')}</li>
            <li><b>{t('Meals and feedback:')}</b> {t('offered options, selections and confirmations, appetite before meals, intake, reasons, satisfaction, weighed plate waste and requests to the nutrition team.')}</li>
            <li><b>{t('Audit log:')}</b> {t('who changed a patient’s record or meals, and when.')}</li>
            <li>{t('Mizan does not store real names, medical record numbers, national ID numbers, contact details or device identifiers.')}</li>
          </ul>
          <h2>{t('Who can see what')}</h2>
          <ul>
            <li>{bold('<b>Admins</b> control the whole platform. They see and edit full nutrition profiles, are the only role that can change diet orders, allergies and medical restrictions or approve meals that need review, and approve staff access and assign roles.')}</li>
            <li>{bold('<b>Staff</b> see patient profiles and update details, preferences, appetite, schedules and intake, run the kitchen (menu, preparation and delivery) and answer non-clinical requests. They cannot change clinical information.')}</li>
            <li>{bold('<b>Kitchen tray tickets</b> show only what preparation needs: ward, bed, demonstration ID, diet, allergy alerts and preparation instructions.')}</li>
            <li>{bold('<b>Patients</b> see only their own profile, schedule, options, feedback and requests. Staff notes are not shown to them.')}</li>
          </ul>
          <h2>{t('How your information is protected')}</h2>
          <ul>
            <li>{t('Permissions and all screening run on the server for every request; the browser is never trusted to enforce them.')}</li>
            <li>{t('Sessions use an HttpOnly cookie; passwords are hashed with scrypt. No secret keys are sent to the browser.')}</li>
            <li>{t('Your information is never sold, shared with third parties or used for advertising.')}</li>
          </ul>
          <h2>{t('Your controls')}</h2>
          <ul>
            <li>{t('Patients can view their record, update preferences and appetite, and report changes to allergies or diet for an admin to review.')}</li>
            <li>{t('Every user can export the information linked to their account as a JSON file from')} <Link href="/settings">{t('Your account & data')}</Link>{t('.')}</li>
            <li><b>{t('Discharge keeps records:')}</b> {t('when a patient is discharged, upcoming meals are cancelled and the patient leaves meal and kitchen lists, but past meals, intake and requests are kept read-only by the hospital. Discharge, removing a patient account link and deleting a record are separate actions; only an admin can permanently delete a demonstration record.')}</li>
            <li>{t('You can delete your personal account at any time. The hospital nutrition record is kept by the hospital nutrition team; an admin can delete a demonstration record.')}</li>
          </ul>
          <h2>{t('Saudi data protection')}</h2>
          <p>{t('Health information is sensitive personal data under the Saudi Personal Data Protection Law (PDPL), overseen by the Saudi Data & AI Authority (SDAIA). Mizan is designed around its principles: health data is used only for the purpose it was collected for (meal screening and preparation), access is limited to what each role needs, and every change is logged. A real deployment would also need the hospital’s own PDPL compliance review.')}</p>
        </div>
      </div>
    </>
  );
}
