// Care team features for hospital patients: healthcare provider profiles, care
// teams, goals, notes, weekly check-ins, messages, "My progress" and the
// "Needs attention" list. Members use only "My progress" and their own simple
// weight goal; nothing here ever reads or returns a member's data to a hospital
// role (member records live under 'm:<user id>' and are reached only as 'me').
//
// Storage: goals, notes and check-ins are HealthRecords documents (kinds 'goal',
// 'note', 'checkin'); provider profiles, care teams, messages and email-alert
// bookkeeping have their own tables (domain/pg-store.js).
//
// Email alerts: sending a message queues an alert through `notify` (the server
// sends it after the change is saved). An alert says only that there is a new
// message, never what it says. It goes only to real addresses (no reserved test
// domains, no shared demo accounts), at most once an hour per conversation and
// recipient.

import { addDays, isValidIso, parseIso } from './dates.js';
import { mealOutcomes, intakeFlags } from './indicators.js';
import { ROLES, label } from './constants.js';
import { computeWins } from './wins.js';

export const SPECIALTIES = [
  { id: 'dietitian', label: 'Dietitian' },
  { id: 'physician', label: 'Physician' },
  { id: 'nurse', label: 'Nurse' },
  { id: 'diabetes-educator', label: 'Diabetes educator' },
  { id: 'other', label: 'Other' },
];
export const BIO_MAX = 160;
export const NOTE_MAX = 600;
export const MESSAGE_MAX = 1000;
export const ALERT_EVERY_MS = 60 * 60 * 1000;
export const NOTE_VISIBILITY = [
  { id: 'patient', label: 'The patient can see it' },
  { id: 'team', label: 'Care team only' },
];

/** Goals a healthcare provider can set (only what they type; Mizan never fills in medical targets). */
export const GOAL_FIELDS = [
  { key: 'targetWeight', label: 'Target weight', unit: 'kg', min: 30, max: 300, decimals: 1 },
  { key: 'steps', label: 'Daily steps', unit: 'steps', min: 500, max: 50000, decimals: 0 },
  { key: 'water', label: 'Water', unit: 'cups', min: 1, max: 20, decimals: 0 },
  { key: 'kcal', label: 'Daily calories', unit: 'kcal', min: 800, max: 5000, decimals: 0 },
  { key: 'carbs', label: 'Daily carbs', unit: 'g', min: 20, max: 700, decimals: 0 },
];
/** Optional limits a provider sets for one patient; readings above them appear under "Needs attention". */
export const LIMIT_FIELDS = [
  { key: 'glucoseFastingMax', label: 'Fasting blood sugar, highest', unit: 'mg/dL', min: 60, max: 400 },
  { key: 'systolicMax', label: 'Blood pressure, upper number, highest', unit: 'mmHg', min: 80, max: 250 },
  { key: 'diastolicMax', label: 'Blood pressure, lower number, highest', unit: 'mmHg', min: 40, max: 160 },
];

/** Weekly check-in: three questions answered 1–5 (5 is the best answer). */
export const CHECKIN_QUESTIONS = [
  { id: 'hunger', label: 'Hunger', question: 'How hungry did you feel between meals?', scale: ['Very hungry', 'Often hungry', 'Sometimes hungry', 'Rarely hungry', 'Not hungry'] },
  { id: 'energy', label: 'Energy', question: 'How was your energy?', scale: ['Very low', 'Low', 'Okay', 'Good', 'Very good'] },
  { id: 'mood', label: 'Mood', question: 'How was your mood?', scale: ['Very low', 'Low', 'Okay', 'Good', 'Very good'] },
];

/** First day (Saturday) of the Saudi week (Saturday–Friday) that holds `iso`. */
export function weekStart(iso) {
  return addDays(iso, -((parseIso(iso).getDay() + 1) % 7));
}

/** Reserved, fictional email domains (demo and test accounts) that never get email. */
export const RESERVED_EMAIL = /(\.(test|local|example|invalid|localhost)|(^|\.)example\.(com|org|net))$/i;
export const isRealEmail = (email) => {
  const e = String(email ?? '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && !RESERVED_EMAIL.test(e.split('@')[1] ?? '');
};

const round = (v, d) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);
const GLUCOSE_MMOL_TO_MGDL = 18;

export function createCareService(ctx) {
  const { repo, today, stamp, requirePermission, accessPatient, invalid, deny, notFound, conflict, audit, health, notify, ServiceError } = ctx;

  // ------------------------------------------------------------ who is addressed
  /** A hospital patient's care space: 'me' (the patient) or a patient id (care team). */
  function careSpace(actor, who, { write = false } = {}) {
    if (who === 'me' || who == null) {
      requirePermission(actor, 'care:own');
      if (!actor.patientId) deny('Your account is not linked to a patient record yet.');
      const patient = accessPatient(actor, actor.patientId);
      return { patient, owner: `p:${patient.id}`, self: true };
    }
    if (!/^\d{1,9}$/.test(String(who))) notFound('That patient record does not exist.');
    requirePermission(actor, write ? 'care:write' : 'care:read');
    const patient = accessPatient(actor, who);
    return { patient, owner: `p:${patient.id}`, self: false };
  }
  /** "My progress": a member's or patient's own space ('me'), or a patient for the care team. */
  function progressSpace(actor, who) {
    if (who === 'me' || who == null) {
      requirePermission(actor, 'health:own');
      if (actor.role === 'member') return { kind: 'member', owner: `m:${actor.id}`, patient: null, self: true };
      const sp = careSpace(actor, 'me');
      return { kind: 'patient', ...sp };
    }
    return { kind: 'patient', ...careSpace(actor, who) };
  }
  const isTeamRole = (role) => role === 'staff' || role === 'admin';
  const activeProvider = (u) => Boolean(u && isTeamRole(u.role) && (u.status ?? 'active') === 'active');

  // ------------------------------------------------------------ provider profiles
  function providerView(u) {
    const p = repo.getProviderProfile(u.id);
    return {
      id: u.id, name: u.name, role: u.role, roleLabel: label(ROLES, u.role),
      specialty: p?.specialty ?? null, specialtyLabel: p?.specialty ? label(SPECIALTIES, p.specialty) : null, bio: p?.bio ?? '',
    };
  }
  function cleanProfile(body = {}) {
    const errors = {};
    let specialty = body.specialty == null || body.specialty === '' ? null : String(body.specialty);
    if (specialty && !SPECIALTIES.some((s) => s.id === specialty)) { errors.specialty = 'Choose a specialty from the list.'; specialty = null; }
    const bio = String(body.bio ?? '').replace(/\s+/g, ' ').trim();
    if (bio.length > BIO_MAX) errors.bio = `Keep the bio to ${BIO_MAX} characters or fewer.`;
    if (Object.keys(errors).length) invalid('Check the highlighted fields.', errors);
    return { specialty, bio };
  }
  function getProviderProfile(actor, userId = 'me') {
    if (userId === 'me') { requirePermission(actor, 'provider:profile'); return providerView(repo.getUserById(actor.id) ?? actor); }
    requirePermission(actor, 'staff:manage', 'Only an admin can change another healthcare provider’s profile.');
    const u = repo.getUserById(String(userId));
    if (!u || !isTeamRole(u.role)) throw new ServiceError(404, 'user_not_found', 'That healthcare provider account does not exist.');
    return providerView(u);
  }
  function updateProviderProfile(actor, userId = 'me', body = {}) {
    let u;
    if (userId === 'me') { requirePermission(actor, 'provider:profile'); u = repo.getUserById(actor.id); }
    else {
      requirePermission(actor, 'staff:manage', 'Only an admin can change another healthcare provider’s profile.');
      u = repo.getUserById(String(userId));
      if (!u || !isTeamRole(u.role)) throw new ServiceError(404, 'user_not_found', 'That healthcare provider account does not exist.');
    }
    if (!u) throw new ServiceError(404, 'user_not_found', 'That healthcare provider account does not exist.');
    const { specialty, bio } = cleanProfile(body);
    repo.saveProviderProfile({ userId: u.id, specialty, bio, updatedAt: stamp(), updatedBy: actor.name });
    audit(actor, null, 'provider.profile', `Updated the healthcare provider profile of ${u.name}${specialty ? ` (${label(SPECIALTIES, specialty)})` : ''}.`);
    return providerView(u);
  }
  /** Active healthcare providers and admins (for the care-team picker). */
  function listProviders(actor) {
    requirePermission(actor, 'care:read');
    return repo.listUsers().filter(activeProvider).map(providerView).sort((a, b) => a.name.localeCompare(b.name));
  }

  // ------------------------------------------------------------ care team
  const teamOf = (patientId) => repo.listCareTeam({ patientId }).map((m) => ({ m, u: repo.getUserById(m.userId) })).filter((x) => activeProvider(x.u));
  function getCareTeam(actor, who) {
    const sp = careSpace(actor, who);
    return { patientId: sp.patient.id, team: teamOf(sp.patient.id).map(({ m, u }) => ({ ...providerView(u), addedAt: m.addedAt, ...(sp.self ? {} : { addedBy: m.addedBy }) })) };
  }
  function addToCareTeam(actor, patientId, body = {}) {
    requirePermission(actor, 'care-team:manage', 'Only an admin can change a patient’s care team.');
    const p = accessPatient(actor, patientId);
    const u = repo.getUserById(String(body.userId ?? ''));
    if (!activeProvider(u)) invalid('Choose an active healthcare provider.', { userId: 'Choose an active healthcare provider.' });
    if (repo.listCareTeam({ patientId: p.id }).some((m) => m.userId === u.id)) conflict('already_on_team', `${u.name} is already on this care team.`);
    repo.addCareTeam({ patientId: p.id, userId: u.id, addedAt: stamp(), addedBy: actor.name });
    audit(actor, p.id, 'care.team-add', `Added ${u.name} to the care team.`);
    return getCareTeam(actor, p.id);
  }
  function removeFromCareTeam(actor, patientId, userId) {
    requirePermission(actor, 'care-team:manage', 'Only an admin can change a patient’s care team.');
    const p = accessPatient(actor, patientId);
    const m = repo.listCareTeam({ patientId: p.id }).find((x) => x.userId === String(userId));
    if (!m) notFound('That person is not on this care team.');
    repo.removeCareTeam(p.id, m.userId);
    audit(actor, p.id, 'care.team-remove', `Removed ${repo.getUserById(m.userId)?.name ?? 'a healthcare provider'} from the care team.`);
    return getCareTeam(actor, p.id);
  }

  // ------------------------------------------------------------ goals
  const goalRec = (owner) => repo.listHealth({ owner, kind: 'goal' }).at(-1) ?? null;
  function cleanGoals(body = {}, { member }) {
    const errors = {};
    const out = {};
    const fields = member ? GOAL_FIELDS.filter((f) => f.key === 'targetWeight') : GOAL_FIELDS;
    for (const f of fields) {
      const raw = body[f.key];
      if (raw == null || raw === '') continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < f.min || n > f.max) errors[f.key] = `Enter ${f.min}–${f.max} ${f.unit}.`;
      else out[f.key] = round(n, f.decimals);
    }
    if (body.targetDate != null && body.targetDate !== '') {
      if (!isValidIso(body.targetDate) || body.targetDate < today()) errors.targetDate = 'Choose today or a later date.';
      else if (out.targetWeight == null) errors.targetDate = 'Add a target weight to go with the date.';
      else out.targetDate = body.targetDate;
    }
    if (!member) {
      const limits = {};
      for (const f of LIMIT_FIELDS) {
        const raw = body.limits?.[f.key];
        if (raw == null || raw === '') continue;
        const n = Number(raw);
        if (!Number.isFinite(n) || n < f.min || n > f.max) errors[`limits.${f.key}`] = `Enter ${f.min}–${f.max} ${f.unit}.`;
        else limits[f.key] = Math.round(n);
      }
      if (limits.systolicMax != null && limits.diastolicMax != null && limits.diastolicMax >= limits.systolicMax) errors['limits.diastolicMax'] = 'The lower number must be smaller than the upper number.';
      if (Object.keys(limits).length) out.limits = limits;
    }
    if (Object.keys(errors).length) invalid('Check the highlighted goals.', errors);
    return out;
  }
  /** Set (replace) the goals. Patients: the care team only. Members: their own target weight. */
  function setGoals(actor, who, body = {}) {
    let owner; let patient = null;
    if (who === 'me' || who == null) {
      requirePermission(actor, 'health:own');
      if (actor.role !== 'member') deny('Your care team sets your goals. You can message them if you’d like to talk about them.');
      owner = `m:${actor.id}`;
    } else {
      const sp = careSpace(actor, who, { write: true });
      owner = sp.owner; patient = sp.patient;
    }
    const goals = cleanGoals(body, { member: !patient });
    const old = goalRec(owner);
    const rec = { ...goals, setBy: actor.name, setById: actor.id ?? null, setByRole: actor.role, setAt: stamp() };
    if (!Object.keys(goals).length) { if (old) repo.deleteHealth(old.id); } // every field empty: no goals
    else if (old) repo.updateHealth(old.id, { ...rec, date: null, updatedAt: stamp() });
    else repo.addHealth({ owner, kind: 'goal', date: null, ...rec, createdAt: stamp() });
    if (patient) {
      const parts = [...GOAL_FIELDS.filter((f) => goals[f.key] != null).map((f) => `${f.label.toLowerCase()} ${goals[f.key]} ${f.unit}`), ...LIMIT_FIELDS.filter((f) => goals.limits?.[f.key] != null).map((f) => `${f.label.toLowerCase()} ${goals.limits[f.key]} ${f.unit}`)];
      audit(actor, patient.id, 'care.goals', parts.length ? `Set goals: ${parts.join('; ')}.` : 'Cleared the goals.');
    }
    return getGoals(actor, who);
  }
  /** Goals with today's progress. */
  function goalsView(sp, actor, who) {
    const g = goalRec(sp.owner);
    if (!g) return { goal: null, progress: null };
    const { id: _i, owner: _o, kind: _k, date: _d, createdAt: _c, updatedAt: _u, setById: _s, ...goal } = g;
    const weights = repo.listHealth({ owner: sp.owner, kind: 'reading' }).filter((r) => r.type === 'weight');
    const latest = weights.at(-1) ?? null;
    // The starting point: the last weight on or before the day the goal was set, else the first one after it.
    const setDay = String(g.setAt ?? '').slice(0, 10);
    const start = weights.filter((r) => r.date <= setDay).at(-1) ?? weights[0] ?? null;
    const progress = {};
    if (goal.targetWeight != null) {
      progress.weight = {
        latest: latest?.value ?? null, latestDate: latest?.date ?? null, start: start?.value ?? null, startDate: start?.date ?? null, target: goal.targetWeight,
        toGo: latest ? round(latest.value - goal.targetWeight, 1) : null,
      };
    }
    if (sp.kind !== 'member') {
      const diary = health.getDiary(actor, who, {});
      for (const k of ['steps', 'water']) if (goal[k] != null) progress[k] = { today: diary.daily?.[k] ?? null, goal: goal[k] };
      for (const k of ['kcal', 'carbs']) if (goal[k] != null) progress[k] = { today: diary.totals?.[k] ?? 0, goal: goal[k] };
    }
    return { goal, progress };
  }
  function getGoals(actor, who) {
    const sp = progressSpace(actor, who);
    return { kind: sp.kind, self: sp.self, ...goalsView(sp, actor, who), fields: sp.kind === 'member' ? GOAL_FIELDS.filter((f) => f.key === 'targetWeight') : GOAL_FIELDS, limitFields: sp.kind === 'member' ? [] : LIMIT_FIELDS };
  }

  // ------------------------------------------------------------ notes
  function noteView(n, sp) {
    const u = n.authorId ? repo.getUserById(n.authorId) : null;
    const p = n.authorId ? repo.getProviderProfile(n.authorId) : null;
    return {
      id: n.id, body: n.body, visibility: n.visibility, createdAt: n.createdAt, date: n.date,
      author: { id: sp.self ? undefined : n.authorId, name: u?.name ?? n.authorName, role: n.authorRole, roleLabel: label(ROLES, n.authorRole), specialty: p?.specialty ?? null, specialtyLabel: p?.specialty ? label(SPECIALTIES, p.specialty) : null },
    };
  }
  function listNotes(actor, who) {
    const sp = careSpace(actor, who);
    const notes = repo.listHealth({ owner: sp.owner, kind: 'note' })
      .filter((n) => !sp.self || n.visibility === 'patient')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || Number(b.id) - Number(a.id))
      .map((n) => ({ ...noteView(n, sp), canDelete: !sp.self && (actor.role === 'admin' || n.authorId === actor.id) }));
    return { notes, max: NOTE_MAX };
  }
  function addNote(actor, who, body = {}) {
    const sp = careSpace(actor, who, { write: true });
    if (sp.self) deny();
    const text = String(body.body ?? '').trim();
    const errors = {};
    if (!text) errors.body = 'Write the note first.';
    else if (text.length > NOTE_MAX) errors.body = `Keep the note to ${NOTE_MAX} characters or fewer.`;
    const visibility = NOTE_VISIBILITY.some((v) => v.id === body.visibility) ? body.visibility : null;
    if (!visibility) errors.visibility = 'Choose who can see the note.';
    if (Object.keys(errors).length) invalid('Check the note.', errors);
    const rec = repo.addHealth({ owner: sp.owner, kind: 'note', date: today(), body: text, visibility, authorId: actor.id ?? null, authorName: actor.name, authorRole: actor.role, createdAt: stamp() });
    audit(actor, sp.patient.id, 'care.note', visibility === 'patient' ? 'Wrote a note the patient can see.' : 'Wrote a note for the care team only.');
    return noteView(rec, sp);
  }
  function deleteNote(actor, who, id) {
    const sp = careSpace(actor, who, { write: true });
    const n = repo.getHealth(id);
    if (!n || n.owner !== sp.owner || n.kind !== 'note') notFound('We couldn’t find that note. It may already be deleted.');
    if (actor.role !== 'admin' && n.authorId !== actor.id) deny('Only the person who wrote a note, or an admin, can delete it.');
    repo.deleteHealth(n.id);
    audit(actor, sp.patient.id, 'care.note-delete', 'Deleted a note.');
    return { deleted: true };
  }

  // ------------------------------------------------------------ weekly check-in
  function cleanCheckin(body = {}) {
    const errors = {};
    const out = {};
    for (const q of CHECKIN_QUESTIONS) {
      const n = Number(body[q.id]);
      if (!(Number.isInteger(n) && n >= 1 && n <= 5)) errors[q.id] = 'Choose an answer.';
      else out[q.id] = n;
    }
    if (Object.keys(errors).length) invalid('Answer all three questions.', errors);
    return out;
  }
  const checkinView = (c) => ({ id: c.id, weekStart: c.date, weekEnd: addDays(c.date, 6), hunger: c.hunger, energy: c.energy, mood: c.mood, updatedAt: c.updatedAt ?? c.createdAt });
  /** The patient's answers for this week (Saturday–Friday); answering again the same week replaces them. */
  function saveCheckin(actor, who, body = {}) {
    const sp = careSpace(actor, who);
    if (!sp.self) deny('Only the patient answers their weekly check-in.');
    const answers = cleanCheckin(body);
    const week = weekStart(today());
    const old = repo.listHealth({ owner: sp.owner, kind: 'checkin', date: week }).at(-1);
    const rec = old
      ? repo.updateHealth(old.id, { ...old, ...answers, date: week, updatedAt: stamp() })
      : repo.addHealth({ owner: sp.owner, kind: 'checkin', date: week, ...answers, createdAt: stamp() });
    audit(actor, sp.patient.id, 'care.checkin', old ? 'Changed this week’s check-in.' : 'Answered the weekly check-in.');
    return listCheckins(actor, who, { saved: checkinView(rec) });
  }
  function listCheckins(actor, who, extra = {}) {
    const sp = careSpace(actor, who);
    const week = weekStart(today());
    const all = repo.listHealth({ owner: sp.owner, kind: 'checkin' }).map(checkinView).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
    return { weekStart: week, weekEnd: addDays(week, 6), thisWeek: all.find((c) => c.weekStart === week) ?? null, history: all.slice(0, 26), questions: CHECKIN_QUESTIONS, ...extra };
  }

  // ------------------------------------------------------------ messages
  const unreadFor = (m, side) => (side === 'patient' ? m.senderRole !== 'patient' && !m.readByPatientAt : m.senderRole === 'patient' && !m.readByTeamAt);
  function messageView(m, actor, sp) {
    const team = m.senderRole !== 'patient';
    const p = team && m.senderUserId ? repo.getProviderProfile(m.senderUserId) : null;
    return {
      id: m.id, body: m.body, createdAt: m.createdAt, from: team ? 'team' : 'patient', mine: Boolean(actor.id && m.senderUserId === actor.id),
      sender: { name: m.senderName, role: m.senderRole, roleLabel: label(ROLES, m.senderRole), specialtyLabel: p?.specialty ? label(SPECIALTIES, p.specialty) : null },
      read: team ? Boolean(m.readByPatientAt) : Boolean(m.readByTeamAt),
      ...(sp.self ? {} : { readByPatientAt: m.readByPatientAt ?? null }),
    };
  }
  function listMessages(actor, who) {
    const sp = careSpace(actor, who);
    const side = sp.self ? 'patient' : 'team';
    const all = repo.listMessages({ patientId: sp.patient.id });
    return {
      patient: { id: sp.patient.id, demoId: sp.patient.demoId, name: sp.patient.preferredName || sp.patient.demoId },
      messages: all.slice(-200).map((m) => messageView(m, actor, sp)),
      unread: all.filter((m) => unreadFor(m, side)).length,
      max: MESSAGE_MAX,
    };
  }
  /** Remember the language a person uses in a conversation (for the email alert they may get). */
  function rememberLang(patientId, actor) {
    if (!actor.id || (actor.lang !== 'en' && actor.lang !== 'ar')) return;
    const a = repo.getMessageAlert(patientId, actor.id);
    if (a?.lang !== actor.lang) repo.saveMessageAlert({ patientId, userId: actor.id, lang: actor.lang, lastAlertAt: a?.lastAlertAt ?? null });
  }
  /** Queue at most one email alert per conversation and recipient per hour; never to test domains or demo accounts. */
  function queueAlerts(patient, recipients, kind) {
    if (!notify) return 0;
    let queued = 0;
    const nowMs = new Date(stamp()).getTime();
    for (const u of recipients) {
      if (!u || u.isDemo || !isRealEmail(u.email)) continue;
      const a = repo.getMessageAlert(patient.id, u.id);
      if (a?.lastAlertAt && nowMs - new Date(a.lastAlertAt).getTime() < ALERT_EVERY_MS) continue;
      repo.saveMessageAlert({ patientId: patient.id, userId: u.id, lang: a?.lang ?? null, lastAlertAt: stamp() });
      notify({ type: 'message', kind, to: u.email, name: u.name, lang: a?.lang ?? 'en', demoId: patient.demoId, path: kind === 'patient' ? '/my-messages' : `/patients/${patient.id}?tab=messages` });
      queued += 1;
    }
    return queued;
  }
  function sendMessage(actor, who, body = {}) {
    const sp = careSpace(actor, who, { write: true });
    const text = String(body.body ?? '').replace(/\r\n/g, '\n').trim();
    if (!text) invalid('Write your message first.', { body: 'Write your message first.' });
    if (text.length > MESSAGE_MAX) invalid(`Keep the message to ${MESSAGE_MAX} characters or fewer.`, { body: `Keep the message to ${MESSAGE_MAX} characters or fewer.` });
    const at = stamp();
    const pid = sp.patient.id;
    // Replying means the other side's messages have been read.
    for (const m of repo.listMessages({ patientId: pid })) {
      if (sp.self && unreadFor(m, 'patient')) repo.updateMessage(m.id, { readByPatientAt: at });
      if (!sp.self && unreadFor(m, 'team')) repo.updateMessage(m.id, { readByTeamAt: at });
    }
    const m = repo.addMessage({
      patientId: pid, senderUserId: actor.id ?? null, senderRole: sp.self ? 'patient' : actor.role, senderName: actor.name, body: text, createdAt: at,
      readByPatientAt: sp.self ? at : null, readByTeamAt: sp.self ? null : at,
    });
    rememberLang(pid, actor);
    const recipients = sp.self
      ? teamOf(pid).map((x) => x.u)
      : repo.listUsersByPatient(pid).filter((u) => u.role === 'patient' && (u.status ?? 'active') === 'active');
    const alerts = queueAlerts(sp.patient, recipients, sp.self ? 'team' : 'patient');
    audit(actor, pid, 'care.message', sp.self ? 'The patient sent a message to the care team.' : 'Sent a message to the patient.');
    return { message: messageView(m, actor, sp), alerts };
  }
  function markRead(actor, who) {
    const sp = careSpace(actor, who);
    const at = stamp();
    let n = 0;
    for (const m of repo.listMessages({ patientId: sp.patient.id })) {
      if (unreadFor(m, sp.self ? 'patient' : 'team')) { repo.updateMessage(m.id, sp.self ? { readByPatientAt: at } : { readByTeamAt: at }); n += 1; }
    }
    rememberLang(sp.patient.id, actor);
    return { marked: n, unread: 0 };
  }
  /** Unread messages for the header badge: the patient's own conversation, or every patient conversation for the team. */
  function unreadCount(actor) {
    if (!actor) return { count: 0 };
    if (actor.role === 'patient') {
      if (!actor.patientId) return { count: 0 };
      const sp = careSpace(actor, 'me');
      return { count: repo.listMessages({ patientId: sp.patient.id }).filter((m) => unreadFor(m, 'patient')).length };
    }
    requirePermission(actor, 'care:read');
    const live = new Set(repo.listPatients().map((p) => p.id));
    const unread = repo.listMessages({}).filter((m) => live.has(m.patientId) && unreadFor(m, 'team'));
    return { count: unread.length, conversations: new Set(unread.map((m) => m.patientId)).size };
  }
  /** The team's inbox: one row per patient conversation, unread first, then the latest. */
  function inbox(actor) {
    requirePermission(actor, 'care:read');
    const mine = new Set(repo.listCareTeam({ userId: actor.id }).map((m) => m.patientId));
    const rows = [];
    for (const p of repo.listPatients()) {
      const all = repo.listMessages({ patientId: p.id });
      if (!all.length) continue;
      const last = all.at(-1);
      rows.push({
        patientId: p.id, demoId: p.demoId, name: p.preferredName || p.demoId, status: p.status, onMyTeam: mine.has(p.id),
        unread: all.filter((m) => unreadFor(m, 'team')).length, count: all.length,
        last: { from: last.senderRole === 'patient' ? 'patient' : 'team', senderName: last.senderName, createdAt: last.createdAt, preview: last.body.slice(0, 120) },
      });
    }
    rows.sort((a, b) => Number(b.unread > 0) - Number(a.unread > 0) || b.last.createdAt.localeCompare(a.last.createdAt));
    return { conversations: rows };
  }

  // ------------------------------------------------------------ progress
  /** Dates (YYYY-MM-DD) with any food logged: diary entries, plus hospital meals with an intake record (patients). */
  function loggedDates(sp, from) {
    const set = new Set(repo.listHealth({ owner: sp.owner, kind: 'food', from }).map((e) => e.date));
    if (sp.patient) for (const r of repo.listIntake({ patientId: sp.patient.id, from })) set.add(r.date);
    return set;
  }
  function streakOf(set) {
    let d = today();
    if (!set.has(d)) d = addDays(d, -1); // today may not be logged yet
    let n = 0;
    while (set.has(d) && n < 400) { n += 1; d = addDays(d, -1); }
    return n;
  }
  /**
   * Small wins (domain/wins.js) from the whole history: days with food logged, the
   * daily trackers and (patients) weekly check-ins. Members: their own space only.
   */
  function winsOf(sp) {
    const daily = { water: {}, steps: {}, sleep: {} };
    for (const r of repo.listHealth({ owner: sp.owner, kind: 'reading' })) if (r.type in daily && r.date) daily[r.type][r.date] = r.value;
    const checkins = sp.kind === 'patient' ? repo.listHealth({ owner: sp.owner, kind: 'checkin' }).length : null;
    return computeWins({ loggedDates: [...loggedDates(sp, null)], daily, checkins });
  }
  function getWins(actor, who) {
    return winsOf(progressSpace(actor, who));
  }
  function getProgress(actor, who) {
    const sp = progressSpace(actor, who);
    const from = addDays(today(), -180);
    const readings = repo.listHealth({ owner: sp.owner, kind: 'reading', from });
    const dates = loggedDates(sp, addDays(today(), -60));
    const last30 = [...dates].filter((d) => d > addDays(today(), -30)).length;
    const out = {
      kind: sp.kind, self: sp.self, today: today(),
      ...goalsView(sp, actor, who),
      weights: readings.filter((r) => r.type === 'weight').map((r) => ({ id: r.id, date: r.date, value: r.value, source: r.source })),
      bp: readings.filter((r) => r.type === 'bp' && r.date >= addDays(today(), -90)).map((r) => ({ id: r.id, date: r.date, value: r.value, value2: r.value2 })),
      glucose: readings.filter((r) => r.type === 'glucose' && r.date >= addDays(today(), -90)).map((r) => ({ id: r.id, date: r.date, value: r.value, unit: r.unit, context: r.context ?? null })),
      week: health.getWeek(actor, who, {}),
      streak: streakOf(dates), daysLogged30: last30,
      wins: winsOf(sp),
    };
    if (sp.kind === 'patient') {
      out.patient = { id: sp.patient.id, demoId: sp.patient.demoId, name: sp.patient.preferredName || sp.patient.demoId };
      out.checkins = listCheckins(actor, who);
      if (!sp.self) out.limitFields = LIMIT_FIELDS;
    }
    return out;
  }

  // ------------------------------------------------------------ needs attention (care team only)
  const toMgdl = (r) => (r.unit === 'mmol/L' ? Math.round(r.value * GLUCOSE_MMOL_TO_MGDL) : r.value);
  /** Why each followed patient may need a look. Only the rules below; no thresholds of Mizan's own. */
  function patientReasons(p, { hasAccount }) {
    const reasons = [];
    const owner = `p:${p.id}`;
    const t = today();
    const unread = repo.listMessages({ patientId: p.id }).filter((m) => unreadFor(m, 'team')).length;
    if (unread) reasons.push({ code: 'messages', n: unread });
    const since = p.admittedOn || String(p.createdAt ?? '').slice(0, 10) || t;
    if (!p.dietOrder?.npo || p.status !== 'admitted') {
      const dates = [...loggedDates({ owner, patient: p }, addDays(t, -60))].sort();
      const last = dates.at(-1) ?? null;
      if ((last ?? since) <= addDays(t, -3)) reasons.push({ code: 'no-food', date: last });
    }
    const weights = repo.listHealth({ owner, kind: 'reading' }).filter((r) => r.type === 'weight');
    const lastWeight = weights.at(-1)?.date ?? null;
    if ((lastWeight ?? since) <= addDays(t, -14)) reasons.push({ code: 'no-weight', date: lastWeight });
    if (hasAccount && !repo.listHealth({ owner, kind: 'checkin', date: weekStart(t) }).length) reasons.push({ code: 'checkin', date: weekStart(t) });
    if (p.status === 'admitted') {
      for (const f of intakeFlags(mealOutcomes(repo.listIntake({ patientId: p.id })), t)) reasons.push({ code: f.code === 'INTAKE-REFUSAL' ? 'refusal' : 'low-intake', title: f.title, text: f.text });
    }
    const limits = goalRec(owner)?.limits ?? null;
    if (limits) {
      const recent = repo.listHealth({ owner, kind: 'reading', from: addDays(t, -6) });
      const glucose = recent.filter((r) => r.type === 'glucose' && r.context === 'fasting').at(-1);
      if (glucose && limits.glucoseFastingMax != null && toMgdl(glucose) > limits.glucoseFastingMax) reasons.push({ code: 'glucose', value: toMgdl(glucose), max: limits.glucoseFastingMax, date: glucose.date });
      const bp = recent.filter((r) => r.type === 'bp').at(-1);
      if (bp && ((limits.systolicMax != null && bp.value > limits.systolicMax) || (limits.diastolicMax != null && bp.value2 > limits.diastolicMax))) {
        reasons.push({ code: 'bp', value: bp.value, value2: bp.value2, systolicMax: limits.systolicMax ?? null, diastolicMax: limits.diastolicMax ?? null, date: bp.date });
      }
    }
    return reasons;
  }
  const WEIGHT = { messages: 5, glucose: 4, bp: 4, refusal: 3, 'low-intake': 3, 'no-food': 2, 'no-weight': 1, checkin: 1 };
  function careAttention(actor) {
    requirePermission(actor, 'care:read');
    const mine = new Set(repo.listCareTeam({ userId: actor.id }).map((m) => m.patientId));
    const rows = [];
    for (const p of repo.listPatients()) {
      const hasAccount = repo.listUsersByPatient(p.id).some((u) => u.role === 'patient');
      if (p.status !== 'admitted' && !hasAccount) continue;
      const reasons = patientReasons(p, { hasAccount });
      if (!reasons.length) continue;
      rows.push({ id: p.id, demoId: p.demoId, preferredName: p.preferredName, ward: p.ward, bed: p.bed, status: p.status, onMyTeam: mine.has(p.id), reasons });
    }
    const score = (r) => r.reasons.reduce((s, x) => s + (WEIGHT[x.code] ?? 0), 0);
    rows.sort((a, b) => Number(b.onMyTeam) - Number(a.onMyTeam) || score(b) - score(a) || a.demoId.localeCompare(b.demoId));
    return { patients: rows, myTeam: mine.size };
  }

  // ------------------------------------------------------------ audit of diary views
  /** A provider opened a patient's food diary: recorded at most once a day per provider and patient. */
  function recordDiaryView(actor, who) {
    const sp = careSpace(actor, who);
    if (sp.self) return { recorded: false };
    const day = stamp().slice(0, 10);
    const seen = repo.listAudit({ patientId: sp.patient.id, limit: 50 })
      .some((a) => a.action === 'health.diary-view' && a.at.slice(0, 10) === day && (a.actorId ?? null) === (actor.id ?? null));
    if (seen) return { recorded: false };
    audit(actor, sp.patient.id, 'health.diary-view', 'Viewed the patient’s food diary.');
    return { recorded: true };
  }

  const reference = () => ({ specialties: SPECIALTIES, goalFields: GOAL_FIELDS, limitFields: LIMIT_FIELDS, checkinQuestions: CHECKIN_QUESTIONS, noteVisibility: NOTE_VISIBILITY, noteMax: NOTE_MAX, messageMax: MESSAGE_MAX, bioMax: BIO_MAX });

  return {
    api: {
      getProviderProfile, updateProviderProfile, listProviders,
      getCareTeam, addToCareTeam, removeFromCareTeam,
      getGoals, setGoals,
      listNotes, addNote, deleteNote,
      saveCheckin, listCheckins,
      listMessages, sendMessage, markRead, unreadCount, inbox,
      getProgress, getWins, careAttention, recordDiaryView, careReference: reference,
    },
  };
}
