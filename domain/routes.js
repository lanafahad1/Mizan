// API route table shared by the Node server and the browser demo backend.
// Authentication endpoints are implemented separately by each backend
// because they deal with cookies (server) or local demo accounts (browser).

import { ServiceError } from './service.js';

export function createApiRoutes(service) {
  const r = (method, path, handler, opts = {}) => ({ method, path, handler, ...opts });
  return [
    r('GET', '/api/reference', () => service.getReference(), { public: true }),
    r('GET', '/api/menu', ({ query }) => service.getMenu({ date: query.date || undefined, period: query.period || null, q: query.q ?? '', diet: query.diet || null, type: query.type || null, view: query.view === 'all' ? 'all' : 'date', cuisine: query.cuisine || null }), { public: true }),
    r('GET', '/api/meals/:id', ({ params, query, user }) => service.getMealDetail(user, params.id, { patientId: query.patient || null, date: query.date || undefined, period: query.period || null }), { public: true }),

    r('GET', '/api/dashboard', ({ user, query }) => service.getDashboard(user, { date: query.date || undefined })),
    r('GET', '/api/patients', ({ user, query }) => service.listPatients(user, { date: query.date || undefined, ward: query.ward || null, include: query.include || 'admitted' })),
    r('POST', '/api/patients', ({ user, body }) => service.createPatient(user, body)),
    r('GET', '/api/patients/:id', ({ user, params }) => service.getPatient(user, params.id)),
    r('DELETE', '/api/patients/:id', ({ user, params, body }) => service.deletePatient(user, params.id, body)),
    r('PATCH', '/api/patients/:id/sections/:section', ({ user, params, body }) => service.updatePatientSection(user, params.id, params.section, body)),
    r('POST', '/api/patients/:id/discharge', ({ user, params, body }) => service.dischargePatient(user, params.id, body)),
    r('POST', '/api/patients/:id/readmit', ({ user, params, body }) => service.readmitPatient(user, params.id, body)),
    r('POST', '/api/patients/:id/link-code', ({ user, params }) => service.createLinkCode(user, params.id)),
    r('DELETE', '/api/patients/:id/accounts', ({ user, params }) => service.unlinkAccounts(user, params.id)),
    r('GET', '/api/patients/:id/day', ({ user, params, query }) => service.getDayPlan(user, params.id, { date: query.date || undefined })),
    r('GET', '/api/patients/:id/my-meals', ({ user, params, query }) => service.getMyMeals(user, params.id, { date: query.date || undefined, week: query.week || null })),
    r('GET', '/api/patients/:id/schedule', ({ user, params, query }) => service.getPatientSchedule(user, params.id, { from: query.from || undefined, days: query.days })),
    r('POST', '/api/patients/:id/offers', ({ user, params, body }) => service.offerOptions(user, params.id, body)),
    r('POST', '/api/patients/:id/auto-schedule', ({ user, params, body }) => service.autoSchedule(user, params.id, body)),
    r('POST', '/api/patients/:id/select', ({ user, params, body }) => service.selectMeal(user, params.id, body)),
    r('POST', '/api/patients/:id/confirm', ({ user, params, body }) => service.confirmMeal(user, params.id, body)),
    r('POST', '/api/patients/:id/cancel', ({ user, params, body }) => service.cancelMeal(user, params.id, body)),
    r('POST', '/api/patients/:id/review', ({ user, params, body }) => service.resolveEntry(user, params.id, body)),
    r('POST', '/api/patients/:id/intake', ({ user, params, body }) => service.recordIntake(user, params.id, body)),
    r('GET', '/api/patients/:id/requests', ({ user, params }) => service.listPatientRequests(user, params.id)),
    r('POST', '/api/patients/:id/requests', ({ user, params, body }) => service.createRequest(user, params.id, body)),

    r('GET', '/api/requests', ({ user, query }) => service.listRequests(user, { status: query.status ?? 'open' })),
    r('PATCH', '/api/requests/:id', ({ user, params, body }) => service.resolveRequest(user, params.id, body)),
    r('GET', '/api/schedule', ({ user, query }) => service.getSchedule(user, { date: query.date || undefined, ward: query.ward || null })),
    r('GET', '/api/kitchen', ({ user, query }) => service.getKitchenSummary(user, { date: query.date || undefined, period: query.period || null })),
    r('POST', '/api/entries/:id/progress', ({ user, params, body }) => service.progressEntry(user, params.id, body)),
    r('POST', '/api/entries/:id/undo', ({ user, params }) => service.undoProgress(user, params.id)),
    r('POST', '/api/entries/:id/changes/:change/ack', ({ user, params }) => service.ackChange(user, params.id, params.change)),

    r('GET', '/api/manage/catalog', ({ user }) => service.getManageCatalog(user)),
    r('POST', '/api/manage/ingredients', ({ user, body }) => service.saveIngredient(user, body)),
    r('POST', '/api/manage/dishes', ({ user, body }) => service.saveDish(user, body)),
    r('POST', '/api/manage/meals', ({ user, body }) => service.saveMeal(user, body)),
    r('POST', '/api/manage/meals/:id/availability', ({ user, params, body }) => service.setAvailability(user, params.id, body)),
    r('POST', '/api/manage/meals/:id/verify', ({ user, params, body }) => service.verifyMeal(user, params.id, body)),
    r('GET', '/api/manage/menu', ({ user, query }) => service.getMenuPlan(user, { from: query.from || undefined })),
    r('POST', '/api/manage/menu', ({ user, body }) => service.setMenu(user, body)),

    // Personal health space. :who is "me" (the signed-in member or patient) or a hospital patient id (care team).
    r('GET', '/api/health/:who', ({ user, params }) => service.getHealthOverview(user, params.who)),
    r('PATCH', '/api/health/:who/profile', ({ user, params, body }) => service.updateHealthProfile(user, params.who, body)),
    r('POST', '/api/health/:who/targets', ({ user, params, body }) => service.setHealthTargets(user, params.who, body)),
    r('GET', '/api/health/:who/readings', ({ user, params, query }) => service.listReadings(user, params.who, { type: query.type || null, days: query.days })),
    r('POST', '/api/health/:who/readings', ({ user, params, body }) => service.addReading(user, params.who, body)),
    r('DELETE', '/api/health/:who/readings/:id', ({ user, params }) => service.deleteReading(user, params.who, params.id)),
    r('GET', '/api/health/:who/assessments', ({ user, params }) => service.listAssessments(user, params.who)),
    r('POST', '/api/health/:who/assessments', ({ user, params, body }) => service.saveAssessment(user, params.who, body)),
    r('POST', '/api/health/:who/assessments/:id/submit', ({ user, params }) => service.submitAssessment(user, params.who, params.id)),
    r('POST', '/api/health/:who/assessments/:id/review', ({ user, params, body }) => service.reviewAssessment(user, params.who, params.id, body)),
    r('GET', '/api/health/:who/diary', ({ user, params, query }) => service.getDiary(user, params.who, { date: query.date || undefined })),
    r('POST', '/api/health/:who/diary', ({ user, params, body }) => service.addDiaryEntry(user, params.who, body)),
    r('DELETE', '/api/health/:who/diary/:id', ({ user, params }) => service.deleteDiaryEntry(user, params.who, params.id)),
    r('PATCH', '/api/health/:who/diary/:id', ({ user, params, body }) => service.updateDiaryEntry(user, params.who, params.id, body)),
    r('POST', '/api/health/:who/diary/restore', ({ user, params, body }) => service.restoreDiaryEntry(user, params.who, body)),
    r('POST', '/api/health/:who/foods', ({ user, params, body }) => service.addCustomFood(user, params.who, body)),
    r('GET', '/api/health/:who/foods', ({ user, params }) => service.listCustomFoods(user, params.who)),
    r('PATCH', '/api/health/:who/foods/:id', ({ user, params, body }) => service.updateCustomFood(user, params.who, params.id, body)),
    r('DELETE', '/api/health/:who/foods/:id', ({ user, params }) => service.deleteCustomFood(user, params.who, params.id)),
    r('POST', '/api/health/:who/daily', ({ user, params, body }) => service.setDaily(user, params.who, body)),
    r('GET', '/api/health/:who/week', ({ user, params, query }) => service.getWeek(user, params.who, { to: query.to || undefined })),
    r('POST', '/api/health/:who/ramadan', ({ user, params, body }) => service.setRamadanMode(user, params.who, body)),
    r('GET', '/api/health/:who/favorites', ({ user, params }) => service.listFavorites(user, params.who)),
    r('POST', '/api/health/:who/favorites', ({ user, params, body }) => service.toggleFavorite(user, params.who, body)),
    r('POST', '/api/health/:who/diary/repeat', ({ user, params, body }) => service.repeatMeal(user, params.who, body)),
    r('GET', '/api/health-worklist', ({ user }) => service.healthWorklist(user)),
    r('GET', '/api/foods', ({ user, query }) => service.findFoods(user, { q: query.q ?? '', kinds: query.kinds ? String(query.kinds).split(',') : null, who: query.who || null, group: query.group || null, limit: query.limit }), { public: true }),
    r('GET', '/api/foods/barcode/:code', ({ params }) => service.lookupBarcode(params.code), { public: true }),
    r('GET', '/api/foods/:id', ({ user, params, query }) => service.getFoodDetail(user, params.id, query.who || 'me'), { public: true }),

    // Care team. :who is "me" (the signed-in patient; members for progress and their own goal) or a hospital patient id (care team).
    r('GET', '/api/care/reference', () => service.careReference(), { public: true }),
    r('GET', '/api/care/unread', ({ user }) => service.unreadCount(user)),
    r('GET', '/api/care/inbox', ({ user }) => service.inbox(user)),
    r('GET', '/api/care/attention', ({ user }) => service.careAttention(user)),
    r('GET', '/api/providers', ({ user }) => service.listProviders(user)),
    r('GET', '/api/providers/:id', ({ user, params }) => service.getProviderProfile(user, params.id)),
    r('PATCH', '/api/providers/:id', ({ user, params, body }) => service.updateProviderProfile(user, params.id, body)),
    r('GET', '/api/care/:who/team', ({ user, params }) => service.getCareTeam(user, params.who)),
    r('POST', '/api/care/:who/team', ({ user, params, body }) => service.addToCareTeam(user, params.who, body)),
    r('DELETE', '/api/care/:who/team/:userId', ({ user, params }) => service.removeFromCareTeam(user, params.who, params.userId)),
    r('GET', '/api/care/:who/progress', ({ user, params }) => service.getProgress(user, params.who)),
    r('GET', '/api/care/:who/wins', ({ user, params }) => service.getWins(user, params.who)),
    r('GET', '/api/care/:who/goals', ({ user, params }) => service.getGoals(user, params.who)),
    r('POST', '/api/care/:who/goals', ({ user, params, body }) => service.setGoals(user, params.who, body)),
    r('GET', '/api/care/:who/notes', ({ user, params }) => service.listNotes(user, params.who)),
    r('POST', '/api/care/:who/notes', ({ user, params, body }) => service.addNote(user, params.who, body)),
    r('DELETE', '/api/care/:who/notes/:id', ({ user, params }) => service.deleteNote(user, params.who, params.id)),
    r('GET', '/api/care/:who/checkins', ({ user, params }) => service.listCheckins(user, params.who)),
    r('POST', '/api/care/:who/checkins', ({ user, params, body }) => service.saveCheckin(user, params.who, body)),
    r('GET', '/api/care/:who/messages', ({ user, params }) => service.listMessages(user, params.who)),
    r('POST', '/api/care/:who/messages', ({ user, params, body }) => service.sendMessage(user, params.who, body)),
    r('POST', '/api/care/:who/messages/read', ({ user, params }) => service.markRead(user, params.who)),
    r('POST', '/api/care/:who/diary-view', ({ user, params }) => service.recordDiaryView(user, params.who)),

    r('GET', '/api/admin/staff', ({ user }) => service.listStaff(user)),
    r('POST', '/api/admin/staff/:id', ({ user, params, body }) => service.decideStaff(user, params.id, body)),
  ];
}

/** Match a request against a route table. Returns { route, params } or null. */
export function matchRoute(routes, method, pathname) {
  for (const route of routes) {
    if (route.method !== method) continue;
    const a = route.path.split('/');
    const b = pathname.replace(/\/+$/, '').split('/');
    if (a.length !== b.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < a.length; i++) {
      if (a[i].startsWith(':')) {
        try { params[a[i].slice(1)] = decodeURIComponent(b[i]); } catch { ok = false; break; }
      } else if (a[i] !== b[i]) { ok = false; break; }
    }
    if (ok) return { route, params };
  }
  return null;
}

export function errorBody(err) {
  // Duck-typed as well, so errors from a different module copy (dev reloads) keep their status.
  if (err instanceof ServiceError || (err && Number.isInteger(err.status) && typeof err.code === 'string' && err.status < 600)) return { status: err.status, body: { error: { code: err.code, message: err.message, ...(err.details ?? {}) } } };
  return { status: 500, body: { error: { code: 'server_error', message: 'Something went wrong on our side. Please try again.' } } };
}

export const PASSWORD_RULE = 'Use at least 8 characters, including a letter and a number.';
export const USERNAME_RULE = '3–20 characters: letters, numbers, dots or underscores, starting with a letter.';
const USERNAME_RE = /^[A-Za-z][A-Za-z0-9._]{2,19}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate account fields. Only the fields present in `input` are checked,
 * unless listed in `require`. Returns cleaned values and field-level errors.
 */
export function validateAccount(input, { require = [] } = {}) {
  const errors = {};
  const has = (k) => input[k] !== undefined || require.includes(k);
  const username = String(input.username ?? '').trim();
  const email = String(input.email ?? '').trim().toLowerCase().slice(0, 120);
  if (has('username')) {
    if (!username) errors.username = 'Please choose a username.';
    else if (!USERNAME_RE.test(username)) errors.username = `Usernames use ${USERNAME_RULE.charAt(0).toLowerCase()}${USERNAME_RULE.slice(1)}`;
  }
  if (has('email')) {
    if (!email) errors.email = 'Please enter your email address.';
    else if (!EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address, for example name@example.com.';
  }
  if (has('password')) {
    const pw = String(input.password ?? '');
    if (!pw) errors.password = 'Please choose a password.';
    else if (!(pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw))) errors.password = PASSWORD_RULE;
    else if (pw.length > 128) errors.password = 'Passwords can be at most 128 characters.';
  }
  if (has('confirmPassword') && String(input.confirmPassword ?? '') !== String(input.password ?? '')) {
    errors.confirmPassword = 'The two passwords do not match.';
  }
  return { username, email, errors };
}

/** A login identifier is an email when it contains "@", otherwise a username. */
export const isEmailIdentifier = (id) => String(id ?? '').includes('@');
