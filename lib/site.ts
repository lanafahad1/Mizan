// Site-wide constants (safe for client and server).
export const SITE_NAME = 'Mizan';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
export const SITE_DESCRIPTION = 'Your plate, your balance. Log what you eat, know your daily calories and plan meals you enjoy, at home or in hospital. Built on guidance from the Saudi Ministry of Health and SFDA. A university Health Informatics project.';

/** Credited on the site: the developer only (owner's decision, 2026-11-10). */
export const TEAM = ['Lana Fahad Alhari'];

/** The website's developer (credited on every page). */
export const DEVELOPER = { en: 'Lana Fahad Alhari', ar: 'لانا فهد الحريّ' };
/** The project's public contact address (also the sender of account emails). */
export const CONTACT_EMAIL = 'mizan.careteam@gmail.com';

export const DISCLAIMER = 'Mizan is an educational Health Informatics project designed to demonstrate personalized nutritional decision support. It does not diagnose medical conditions, replace professional medical advice, or guarantee clinical outcomes. Meal suggestions depend on the available data and reviewed dietary rules. Users with complex medical conditions, prescribed diets, or uncertain allergy information should consult a qualified healthcare professional.';

export type NavItem = { href: string; label: string; permission?: string };

export const PUBLIC_NAV: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/tools/calculator', label: 'Calculator' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
];

/** Signed-in navigation. Items are shown only when the role holds the RBAC permission. */
export const STAFF_NAV: NavItem[] = [
  { href: '/patients', label: 'Patients', permission: 'patient:list' },
  { href: '/dashboard', label: 'Dashboard', permission: 'dashboard:view' },
  { href: '/requests', label: 'Requests', permission: 'request:list' },
  { href: '/schedule', label: 'Schedule', permission: 'schedule:view' },
  { href: '/kitchen', label: 'Kitchen', permission: 'kitchen:view' },
  { href: '/menu/manage', label: 'Menu', permission: 'menu:manage-view' },
  { href: '/staff-access', label: 'Staff Access', permission: 'staff:manage' },
];
/** Patient space. Same pattern and words as the member space (Diary, Health); the food profile sits in the account menu. */
export const PATIENT_NAV: NavItem[] = [
  { href: '/my-meals', label: 'My meals' },
  { href: '/today', label: 'Diary' },
  { href: '/my-health', label: 'Health' },
  { href: '/my-requests', label: 'Requests' },
  { href: '/eat-well', label: 'Eat well' },
];
/** Extra links in the patient's account menu (and nowhere else in the header). */
export const PATIENT_ACCOUNT_NAV: NavItem[] = [
  { href: '/my-profile', label: 'My food profile' },
  { href: '/eat-well', label: 'Eat well' },
];
/** Member space (personal use, no hospital). */
export const MEMBER_NAV: NavItem[] = [
  { href: '/home', label: 'Home' },
  { href: '/today', label: 'Diary' },
  { href: '/my-health', label: 'Health' },
  { href: '/eat-well', label: 'Eat well' },
];

/**
 * Page widths, one per space. Use with PageHead/PageBody `space` (or the class directly):
 * member & patient pages 880 px, staff pages 1,200 px, public pages the default 1,180 px.
 */
export type Space = 'public' | 'member' | 'staff';
export const SPACE_CLASS: Record<Space, string> = { public: '', member: 'container-member', staff: 'container-staff' };

export const ABOUT_NAV: NavItem[] = [
  { href: '/about', label: 'About the project' },
  { href: '/diets', label: 'Diets & rules' },
  { href: '/sources', label: 'Data sources & limitations' },
  { href: '/contact', label: 'Contact' },
];

export const CITATION = 'Alhari, L. F. (2026). Mizan: Your plate, your balance [University Health Informatics project].';
