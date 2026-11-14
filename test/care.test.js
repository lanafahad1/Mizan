// Care team features: provider profiles, care teams, goals, notes, weekly check-ins,
// messages with email alerts, "My progress" and the "Needs attention" list.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryRepo } from '../domain/memory-repo.js';
import { createService } from '../domain/service.js';
import { seedCatalog, seedHospitalDemo } from '../domain/demo-data.js';
import { seedHealthDemo } from '../domain/health-demo.js';
import { weekStart, isRealEmail, NOTE_MAX, MESSAGE_MAX } from '../domain/care-service.js';
import { addDays } from '../domain/dates.js';

let repo; let service; let ids; let today; let alerts; let clock;
let staff; let admin; let otherStaff; let member; let noura; let khalid;
const status = (fn) => { try { fn(); return 200; } catch (e) { return e.status ?? 500; } };
const act = (u) => ({ id: u.id, role: u.role, name: u.name, status: 'active', patientId: u.patientId ?? null });

beforeEach(() => {
  repo = createMemoryRepo();
  seedCatalog(repo, new Date().toISOString());
  clock = new Date();
  alerts = [];
  service = createService({ repo, now: () => clock, notify: (a) => alerts.push(a) });
  today = service.today();
  ids = seedHospitalDemo({ repo, service, today });
  // Accounts: real addresses (alerts may go there), a demo account and a member.
  staff = act(repo.createUser({ username: 'huda.rd', name: 'Huda', email: 'huda@hospital.sa', role: 'staff', status: 'active' }));
  otherStaff = act(repo.createUser({ username: 'omar.rn', name: 'Omar', email: 'omar@hospital.sa', role: 'staff', status: 'active' }));
  admin = act(repo.createUser({ username: 'admin.x', name: 'Admin X', email: 'admin@hospital.sa', role: 'admin', status: 'active' }));
  member = act(repo.createUser({ username: 'mona.m', name: 'Mona', email: 'mona@mail.sa', role: 'member', status: 'active' }));
  noura = act(repo.createUser({ username: 'noura.p', name: 'Noura', email: 'noura@mail.sa', role: 'patient', status: 'active', patientId: ids['MZ-1001'] }));
  khalid = act(repo.createUser({ username: 'khalid.p', name: 'Khalid', email: 'khalid@mizan.test', role: 'patient', status: 'active', patientId: ids['MZ-1004'] }));
});

test('weeks run Saturday to Friday; reserved test domains are not real addresses', () => {
  assert.equal(weekStart('2026-11-14'), '2026-11-14'); // a Saturday
  assert.equal(weekStart('2026-11-20'), '2026-11-14'); // Friday
  assert.equal(weekStart('2026-11-21'), '2026-11-21'); // next Saturday
  assert.equal(weekStart('2026-11-15'), '2026-11-14'); // Sunday
  assert.ok(isRealEmail('a@hospital.sa'));
  for (const e of ['a@mizan.test', 'b@x.local', 'c@example.com', 'd@thing.example', 'nope', '']) assert.ok(!isRealEmail(e), e);
});

test('provider profiles: the provider edits their own, an admin edits anyone, validated', () => {
  const p = service.updateProviderProfile(staff, 'me', { specialty: 'dietitian', bio: '  Clinical   dietitian. ' });
  assert.equal(p.specialtyLabel, 'Dietitian');
  assert.equal(p.bio, 'Clinical dietitian.');
  assert.equal(status(() => service.updateProviderProfile(staff, 'me', { bio: 'x'.repeat(161) })), 422);
  assert.equal(status(() => service.updateProviderProfile(staff, 'me', { specialty: 'surgeon' })), 422);
  assert.equal(status(() => service.updateProviderProfile(staff, otherStaff.id, { specialty: 'nurse' })), 403);
  assert.equal(service.updateProviderProfile(admin, otherStaff.id, { specialty: 'nurse' }).specialtyLabel, 'Nurse');
  assert.equal(status(() => service.updateProviderProfile(admin, member.id, { specialty: 'nurse' })), 404, 'members are not providers');
  for (const who of [noura, member]) assert.equal(status(() => service.updateProviderProfile(who, 'me', { specialty: 'nurse' })), 403);
  assert.deepEqual(service.listProviders(staff).map((x) => x.name), ['Admin X', 'Huda', 'Omar']);
});

test('only an admin assigns the care team; the patient sees names and specialties', () => {
  service.updateProviderProfile(staff, 'me', { specialty: 'dietitian' });
  assert.equal(status(() => service.addToCareTeam(staff, ids['MZ-1001'], { userId: staff.id })), 403);
  service.addToCareTeam(admin, ids['MZ-1001'], { userId: staff.id });
  assert.equal(status(() => service.addToCareTeam(admin, ids['MZ-1001'], { userId: staff.id })), 409);
  assert.equal(status(() => service.addToCareTeam(admin, ids['MZ-1001'], { userId: member.id })), 422, 'a member cannot join a care team');
  const mine = service.getCareTeam(noura, 'me');
  assert.deepEqual(mine.team.map((m) => [m.name, m.specialtyLabel]), [['Huda', 'Dietitian']]);
  assert.equal(status(() => service.getCareTeam(noura, ids['MZ-1004'])), 403, 'a patient cannot open another care team');
  assert.equal(status(() => service.getCareTeam(member, ids['MZ-1001'])), 403);
  service.removeFromCareTeam(admin, ids['MZ-1001'], staff.id);
  assert.equal(service.getCareTeam(noura, 'me').team.length, 0);
});

test('notes: providers write them; care-team-only notes never reach the patient', () => {
  const pid = ids['MZ-1001'];
  service.addNote(staff, pid, { body: 'Try half a cup of rice at lunch.', visibility: 'patient' });
  service.addNote(staff, pid, { body: 'Discuss fasting sugar with the physician.', visibility: 'team' });
  assert.equal(status(() => service.addNote(staff, pid, { body: 'x'.repeat(NOTE_MAX + 1), visibility: 'patient' })), 422);
  assert.equal(status(() => service.addNote(staff, pid, { body: 'Hi', visibility: 'everyone' })), 422);
  assert.equal(status(() => service.addNote(noura, 'me', { body: 'Hi', visibility: 'patient' })), 403, 'patients do not write notes');
  const team = service.listNotes(otherStaff, pid).notes;
  assert.equal(team.length, 2, 'any provider reads every note');
  const own = service.listNotes(noura, 'me').notes;
  assert.deepEqual(own.map((n) => n.body), ['Try half a cup of rice at lunch.']);
  assert.equal(own[0].author.name, 'Huda');
  assert.equal(status(() => service.listNotes(noura, ids['MZ-1004'])), 403);
  assert.equal(status(() => service.listNotes(member, pid)), 403);
  // The patient's data export leaves out care-team-only notes too.
  const exp = service.exportData(noura, { username: 'noura.p', email: 'noura@mail.sa', role: 'patient', createdAt: today });
  assert.ok(!JSON.stringify(exp).includes('physician'), 'team-only note not exported');
  assert.ok(JSON.stringify(exp).includes('half a cup of rice'));
  // Only the author or an admin deletes a note.
  const id = team.find((n) => n.visibility === 'team').id;
  assert.equal(status(() => service.deleteNote(otherStaff, pid, id)), 403);
  service.deleteNote(admin, pid, id);
  assert.equal(service.listNotes(staff, pid).notes.length, 1);
});

test('goals: the care team types them (nothing automatic); patients see them; members set only their own weight goal', () => {
  const pid = ids['MZ-1001'];
  assert.equal(status(() => service.setGoals(noura, 'me', { targetWeight: 80 })), 403, 'a patient cannot set their own goals');
  assert.equal(status(() => service.setGoals(staff, pid, { targetWeight: 10 })), 422);
  assert.equal(status(() => service.setGoals(staff, pid, { targetWeight: 85, targetDate: addDays(today, -1) })), 422);
  assert.equal(status(() => service.setGoals(staff, pid, { limits: { systolicMax: 120, diastolicMax: 130 } })), 422);
  service.addReading(staff, pid, { type: 'weight', value: 92, date: today });
  const g = service.setGoals(staff, pid, { targetWeight: 85, steps: 5000, water: 8, kcal: 1500, carbs: 180, limits: { glucoseFastingMax: 130 } });
  assert.deepEqual(Object.keys(g.goal).filter((k) => !k.startsWith('set')).sort(), ['carbs', 'kcal', 'limits', 'steps', 'targetWeight', 'water']);
  assert.equal(g.progress.weight.toGo, 7);
  const seen = service.getGoals(noura, 'me');
  assert.equal(seen.goal.targetWeight, 85);
  assert.equal(seen.goal.setBy, 'Huda');
  // Calories and carbs from the goals are the patient's diary targets.
  assert.equal(service.getDiary(noura, 'me').targets.kcal, 1500);
  assert.equal(service.getWeek(noura, 'me').target, 1500);
  // Members: their own target weight only; other fields are ignored, and no hospital role reaches it.
  const m = service.setGoals(member, 'me', { targetWeight: 70, steps: 9000 });
  assert.deepEqual([m.goal.targetWeight, m.goal.steps], [70, undefined]);
  assert.equal(status(() => service.getGoals(staff, `m:${member.id}`)), 404);
  assert.equal(status(() => service.getGoals(member, pid)), 403);
});

test('weekly check-in: once a week, can be changed that week, the team reads it over time', () => {
  const pid = ids['MZ-1001'];
  assert.equal(status(() => service.saveCheckin(noura, 'me', { hunger: 3, energy: 6, mood: 2 })), 422);
  service.saveCheckin(noura, 'me', { hunger: 3, energy: 4, mood: 2 });
  const again = service.saveCheckin(noura, 'me', { hunger: 4, energy: 4, mood: 3 });
  assert.equal(again.history.length, 1, 'answering again the same week replaces the answers');
  assert.deepEqual([again.thisWeek.hunger, again.thisWeek.mood], [4, 3]);
  assert.equal(again.thisWeek.weekStart, weekStart(today));
  assert.equal(status(() => service.saveCheckin(staff, pid, { hunger: 3, energy: 3, mood: 3 })), 403, 'only the patient answers');
  assert.equal(service.listCheckins(staff, pid).thisWeek.energy, 4);
  // Next week starts a new check-in.
  clock = new Date(clock.getTime() + 7 * 86400e3);
  service.saveCheckin(noura, 'me', { hunger: 5, energy: 5, mood: 5 });
  assert.equal(service.listCheckins(staff, pid).history.length, 2);
  assert.equal(status(() => service.listCheckins(member, 'me')), 403, 'members have no check-in');
});

test('messages: one conversation per patient, unread counts both ways, marked read when opened', () => {
  const pid = ids['MZ-1001'];
  service.addToCareTeam(admin, pid, { userId: staff.id });
  assert.equal(status(() => service.sendMessage(noura, 'me', { body: '   ' })), 422);
  assert.equal(status(() => service.sendMessage(noura, 'me', { body: 'x'.repeat(MESSAGE_MAX + 1) })), 422);
  service.sendMessage(noura, 'me', { body: 'Can I have laban with dinner?' });
  assert.equal(service.unreadCount(staff).count, 1);
  assert.equal(service.unreadCount(otherStaff).count, 1, 'any provider of the hospital can read and reply');
  assert.equal(service.unreadCount(noura).count, 0);
  const inbox = service.inbox(staff).conversations;
  assert.deepEqual([inbox[0].demoId, inbox[0].unread, inbox[0].onMyTeam], ['MZ-1001', 1, true]);
  assert.equal(service.inbox(otherStaff).conversations[0].onMyTeam, false);
  service.markRead(otherStaff, pid);
  assert.equal(service.unreadCount(staff).count, 0);
  service.sendMessage(otherStaff, pid, { body: 'Yes, a small cup.' });
  assert.equal(service.unreadCount(noura).count, 1);
  const thread = service.listMessages(noura, 'me');
  assert.deepEqual(thread.messages.map((m) => m.from), ['patient', 'team'], 'oldest first, newest at the bottom');
  assert.equal(thread.unread, 1);
  service.markRead(noura, 'me');
  assert.equal(service.unreadCount(noura).count, 0);
  // Patients reach only their own conversation; members and other patients reach none.
  assert.equal(status(() => service.listMessages(noura, ids['MZ-1004'])), 403);
  assert.equal(status(() => service.sendMessage(khalid, ids['MZ-1001'], { body: 'hi' })), 403);
  assert.equal(status(() => service.listMessages(member, pid)), 403);
  assert.equal(status(() => service.listMessages(member, 'me')), 403);
  assert.equal(status(() => service.inbox(noura)), 403);
  assert.equal(service.listMessages(khalid, 'me').messages.length, 0);
});

test('email alerts: no message text, at most one an hour per conversation and recipient, never to demo or test addresses', () => {
  const pid = ids['MZ-1001'];
  service.addToCareTeam(admin, pid, { userId: staff.id });
  service.addToCareTeam(admin, pid, { userId: otherStaff.id });
  const demoUser = act(repo.createUser({ username: 'demo.p', name: 'Demo', email: 'demo@hospital.sa', role: 'staff', status: 'active', isDemo: true }));
  service.addToCareTeam(admin, pid, { userId: demoUser.id });
  service.sendMessage(noura, 'me', { body: 'My sugar was 190 this morning' });
  assert.deepEqual(alerts.map((a) => a.to).sort(), ['huda@hospital.sa', 'omar@hospital.sa'], 'the care team gets an alert; the demo account does not');
  assert.ok(alerts.every((a) => a.kind === 'team' && a.demoId === 'MZ-1001' && a.path === `/patients/${pid}?tab=messages`));
  assert.ok(!JSON.stringify(alerts).includes('190'), 'the alert never carries the message text');
  // A second message within the hour: no new alert.
  clock = new Date(clock.getTime() + 20 * 60e3);
  service.sendMessage(noura, 'me', { body: 'And now 180' });
  assert.equal(alerts.length, 2);
  // After an hour, one more each.
  clock = new Date(clock.getTime() + 61 * 60e3);
  service.sendMessage(noura, 'me', { body: 'Still high' });
  assert.equal(alerts.length, 4);
  // The provider replies: the patient gets one, in the language they last used in the conversation.
  service.markRead({ ...noura, lang: 'ar' }, 'me');
  service.sendMessage(staff, pid, { body: 'Please call the ward.' });
  const toPatient = alerts.filter((a) => a.kind === 'patient');
  assert.deepEqual(toPatient.map((a) => [a.to, a.lang, a.path]), [['noura@mail.sa', 'ar', '/my-messages']]);
  // A patient with a reserved test address (the demo patients) gets no email.
  service.sendMessage(staff, ids['MZ-1004'], { body: 'Hello Khalid' });
  assert.ok(!alerts.some((a) => a.to === 'khalid@mizan.test'));
  // Without a notify function nothing is queued.
  const quiet = createService({ repo, now: () => new Date(clock.getTime() + 3 * 3600e3) });
  assert.equal(quiet.sendMessage(staff, pid, { body: 'Another' }).alerts, 0);
});

test('My progress: members see only their own data; patients see goals, check-ins and their streak', () => {
  service.addReading(member, 'me', { type: 'weight', value: 80, date: addDays(today, -7) });
  service.addReading(member, 'me', { type: 'weight', value: 79, date: today });
  const f = service.findFoods(member, { q: 'dates' })[0];
  for (const d of [0, 1, 2]) service.addDiaryEntry(member, 'me', { date: addDays(today, -d), meal: 'snack', foodId: f.id });
  const mine = service.getProgress(member, 'me');
  assert.equal(mine.kind, 'member');
  assert.deepEqual(mine.weights.map((w) => w.value), [80, 79]);
  assert.equal(mine.streak, 3);
  assert.equal(mine.checkins, undefined);
  assert.equal(status(() => service.getProgress(staff, `m:${member.id}`)), 404, 'no hospital role addresses a member');
  assert.equal(status(() => service.getProgress(admin, member.id)), 404);
  const other = act(repo.createUser({ username: 'x.m', name: 'X', email: 'x@mail.sa', role: 'member', status: 'active' }));
  assert.equal(service.getProgress(other, 'me').weights.length, 0, 'another member sees an empty space of their own');
  const p = service.getProgress(noura, 'me');
  assert.equal(p.kind, 'patient');
  assert.ok(p.checkins && p.week);
  assert.equal(service.getProgress(staff, ids['MZ-1001']).patient.demoId, 'MZ-1001');
  assert.equal(status(() => service.getProgress(noura, ids['MZ-1004'])), 403);
});

test('Needs attention: only the listed rules, with the provider’s own limits', () => {
  const pid = ids['MZ-1001'];
  const row = () => service.careAttention(staff).patients.find((r) => r.id === pid);
  const codes = () => (row()?.reasons ?? []).map((r) => r.code);
  // No limits set: a high reading alone never appears.
  service.addReading(staff, pid, { type: 'glucose', value: 200, context: 'fasting', date: today });
  service.addReading(staff, pid, { type: 'bp', value: 160, value2: 100, date: today });
  assert.ok(!codes().includes('glucose') && !codes().includes('bp'));
  service.setGoals(staff, pid, { limits: { glucoseFastingMax: 130, systolicMax: 140 } });
  assert.ok(codes().includes('glucose') && codes().includes('bp'));
  assert.equal(row().reasons.find((r) => r.code === 'glucose').max, 130);
  // A reading in mmol/L is compared in mg/dL (6 mmol/L = 108 mg/dL, under the limit).
  service.addReading(staff, pid, { type: 'glucose', value: 6, unit: 'mmol/L', context: 'fasting', date: today });
  assert.ok(!codes().includes('glucose'));
  // Unread patient messages, and a missed check-in for a patient with an account.
  service.sendMessage(noura, 'me', { body: 'Hello' });
  assert.equal(row().reasons.find((r) => r.code === 'messages').n, 1);
  assert.ok(codes().includes('checkin'));
  service.saveCheckin(noura, 'me', { hunger: 3, energy: 3, mood: 3 });
  assert.ok(!codes().includes('checkin'));
  // No weight for 14 days and no food for 3 days (only once the stay is that long).
  const p = repo.getPatient(pid);
  repo.updatePatient(pid, { ...p, admittedOn: addDays(today, -30) });
  for (const r of repo.listHealth({ owner: `p:${pid}`, kind: 'reading' }).filter((x) => x.type === 'weight')) repo.deleteHealth(r.id);
  service.addReading(staff, pid, { type: 'weight', value: 92, date: addDays(today, -15) });
  assert.ok(codes().includes('no-weight'));
  service.addReading(staff, pid, { type: 'weight', value: 91, date: today });
  assert.ok(!codes().includes('no-weight'));
  for (const r of repo.listIntake({ patientId: pid })) if (r.date >= addDays(today, -2)) repo.saveIntake({ ...r, date: addDays(today, -10) });
  for (const r of repo.listHealth({ owner: `p:${pid}`, kind: 'food' })) repo.deleteHealth(r.id);
  const hasRecent = repo.listIntake({ patientId: pid, from: addDays(today, -2) }).length > 0;
  if (!hasRecent) assert.ok(codes().includes('no-food'));
  // Members never appear; patients and members cannot see the list.
  assert.equal(status(() => service.careAttention(noura)), 403);
  assert.equal(status(() => service.careAttention(member)), 403);
  assert.ok(service.careAttention(admin).patients.every((r) => r.demoId?.startsWith('MZ-')));
});

test('a provider opening a patient’s diary is recorded once a day', () => {
  const pid = ids['MZ-1001'];
  assert.equal(service.recordDiaryView(staff, pid).recorded, true);
  assert.equal(service.recordDiaryView(staff, pid).recorded, false);
  assert.equal(service.recordDiaryView(otherStaff, pid).recorded, true, 'each provider once a day');
  assert.equal(repo.listAudit({ patientId: pid }).filter((a) => a.action === 'health.diary-view').length, 2);
  assert.equal(status(() => service.recordDiaryView(noura, ids['MZ-1004'])), 403);
});

test('the demo seeds care-team data and clearing the hospital removes it', () => {
  const r2 = createMemoryRepo();
  seedCatalog(r2, new Date().toISOString());
  const s2 = createService({ repo: r2 });
  const staffUser = r2.createUser({ username: 'staff.demo', name: 'Dr. Turki Al-Mutairi', email: 'staff@mizan.test', role: 'staff', status: 'active', isDemo: true });
  r2.createUser({ username: 'admin.demo', name: 'Demo Admin', email: 'admin@mizan.test', role: 'admin', status: 'active', isDemo: true });
  const pids = seedHospitalDemo({ repo: r2, service: s2, today: s2.today() });
  seedHealthDemo({ repo: r2, service: s2, today: s2.today(), patientIds: pids });
  assert.equal(r2.getProviderProfile(staffUser.id).specialty, 'dietitian');
  assert.ok(r2.listCareTeam({ userId: staffUser.id }).length >= 5);
  assert.ok(r2.listMessages({ patientId: pids['MZ-1001'] }).length >= 2);
  const st = { id: staffUser.id, role: 'staff', name: staffUser.name, status: 'active' };
  const att = s2.careAttention(st).patients.find((r) => r.demoId === 'MZ-1001');
  assert.ok(att.reasons.some((r) => r.code === 'glucose'), 'seeded fasting sugar is above the seeded limit');
  r2.clearHospitalData();
  assert.equal(r2.listMessages({}).length + r2.listCareTeam({}).length, 0);
  assert.ok(r2.getProviderProfile(staffUser.id), 'provider profiles belong to the account and stay');
});
