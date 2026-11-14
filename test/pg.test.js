// Postgres store tests. They need an empty, disposable database:
//   TEST_DATABASE_URL=postgres://user:pass@localhost:5432/mizan_test npm test
// Every table in that database's public schema is dropped first.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { ensureSchema, createPgStore } from '../domain/pg-store.js';
import { weekStart } from '../domain/care-service.js';
import { createService } from '../domain/service.js';
import { seedHealthDemo } from '../domain/health-demo.js';
import { seedCatalog, seedHospitalDemo, linkDemoAccounts, DEMO_ACCOUNTS } from '../domain/demo-data.js';
import { addDays } from '../domain/dates.js';

const url = process.env.TEST_DATABASE_URL;
const skip = url ? false : 'set TEST_DATABASE_URL to a disposable Postgres database to run the Postgres tests';
let pool;

// The parts of better-auth's tables the domain reads and writes.
const AUTH_TABLES = `
CREATE TABLE "user" ("id" text PRIMARY KEY, "name" text NOT NULL, "email" text NOT NULL UNIQUE, "emailVerified" boolean NOT NULL DEFAULT false, "image" text,
  "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, "username" text UNIQUE, "displayUsername" text,
  "role" text, "status" text, "patientId" text, "requestedRole" text, "requestNote" text, "decidedBy" text, "decidedAt" text, "decisionNote" text, "isDemo" boolean);
CREATE TABLE "session" ("id" text PRIMARY KEY, "expiresAt" timestamptz NOT NULL, "token" text NOT NULL UNIQUE, "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamptz NOT NULL, "ipAddress" text, "userAgent" text, "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE);`;

const admin = { id: 'u-admin', role: 'admin', status: 'active', name: 'Demo Admin', username: 'admin.demo' };
const staff = { id: 'u-staff', role: 'staff', status: 'active', name: 'Demo Healthcare Provider', username: 'staff.demo' };

/** Everything the domain can read, for comparing what was written with what is loaded back. */
function dump(repo) {
  const patients = repo.listPatients();
  return {
    users: repo.listUsers(), patients, entries: repo.listEntries(), intake: repo.listIntake(), requests: repo.listRequests(),
    audit: patients.map((p) => repo.listAudit({ patientId: p.id, limit: 40 })), menuAudit: repo.listAudit({ scope: 'menu.', limit: 15 }),
    catalog: repo.getCatalogData(), menu: repo.getMenu(), health: repo.listHealth(),
    providerProfiles: repo.listProviderProfiles(), careTeam: repo.listCareTeam(), messages: repo.listMessages(),
    alerts: patients.map((p) => repo.listCareTeam({ patientId: p.id }).map((m) => repo.getMessageAlert(p.id, m.userId))),
  };
}

before(async () => {
  if (skip) return;
  pool = new pg.Pool({ connectionString: url, max: 6 });
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await pool.query(AUTH_TABLES);
  for (const a of DEMO_ACCOUNTS) {
    await pool.query(`INSERT INTO "user" (id, name, email, username, "displayUsername", role, status, "isDemo") VALUES ($1,$2,$3,$4,$4,$5,'active',true)`,
      [a.role === 'admin' ? 'u-admin' : a.role === 'staff' ? 'u-staff' : `u-${a.username}`, a.name, a.email, a.username, a.role]);
  }
  const client = await pool.connect();
  try { await ensureSchema(client); } finally { client.release(); }
});
after(async () => { await pool?.end(); });

test('schema and reference data are created once', { skip }, async () => {
  const { rows } = await pool.query('SELECT (SELECT COUNT(*)::int FROM SfctDishes) AS sfct, (SELECT COUNT(*)::int FROM DietCategories) AS diets');
  assert.equal(rows[0].sfct, 130, 'SFDA SFCT library loaded');
  assert.ok(rows[0].diets > 0);
  const client = await pool.connect();
  try { await ensureSchema(client); } finally { client.release(); } // second start: no error, nothing duplicated
  const again = await pool.query('SELECT COUNT(*)::int AS n FROM SfctDishes');
  assert.equal(again.rows[0].n, 130);
});

test('the seeded hospital loads back exactly as it was written', { skip }, async () => {
  const store = createPgStore(pool);
  const written = await store.write((repo) => {
    seedCatalog(repo, new Date().toISOString());
    const service = createService({ repo });
    const patientIds = seedHospitalDemo({ repo, service, today: service.today() });
    linkDemoAccounts(repo, patientIds);
    seedHealthDemo({ repo, service, today: service.today(), patientIds });
    return dump(repo);
  });
  assert.ok(written.patients.length >= 10 && written.entries.length > 50 && written.intake.length > 50, 'demo hospital seeded');
  assert.ok(written.health.some((r) => r.owner.startsWith('m:')) && written.health.some((r) => r.owner.startsWith('p:')), 'member and patient health records seeded');
  const loaded = dump(await store.read());
  assert.deepEqual(loaded, written);
  assert.ok(loaded.users.find((u) => u.username === 'noura.1001').patientId, 'demo patient account linked');
});

test('workflow changes persist and match the values returned at the time', { skip }, async () => {
  const store = createPgStore(pool);
  const results = await store.write((repo) => {
    const service = createService({ repo });
    const p = repo.listPatients().find((x) => x.status === 'admitted' && !x.dietOrder.npo);
    const date = addDays(service.today(), 2); // the demo hospital has meals planned for today and tomorrow
    const plan = service.getDayPlan(staff, p.id, { date });
    const period = plan.periods.find((x) => !x.entry && x.screening?.eligible?.length);
    const out = { patientId: p.id };
    if (period) out.offer = service.offerOptions(staff, p.id, { date, period: period.period, items: period.screening.eligible.slice(0, 2).map((e) => e.id) });
    out.request = service.createRequest(admin, p.id, { type: 'assistance', message: 'Please help me open the tray.' });
    out.discharged = service.dischargePatient(staff, repo.listPatients().find((x) => x.status === 'admitted' && x.id !== p.id).id, { note: 'Home.' });
    out.meal = service.setAvailability(staff, repo.getCatalogData().meals[0].id, { available: false, reason: 'Out of stock' });
    return { ...out, dump: dump(repo) };
  });
  assert.ok(results.offer?.entry, 'meal options were offered');
  const loaded = dump(await store.read());
  assert.deepEqual(loaded, results.dump);
  assert.ok(loaded.entries.some((e) => e.id === results.offer.entry.id && e.status === 'offered'));
  assert.ok(loaded.requests.some((r) => r.message === 'Please help me open the tray.'));
  assert.equal(loaded.catalog.meals[0].available, false);
});

test('a failed operation saves nothing', { skip }, async () => {
  const store = createPgStore(pool);
  const before = dump(await store.read());
  await assert.rejects(store.write((repo) => {
    const service = createService({ repo });
    service.createRequest(admin, repo.listPatients().find((x) => x.status === 'admitted').id, { type: 'assistance', message: 'Should not be saved.' });
    throw new Error('boom');
  }), /boom/);
  assert.deepEqual(dump(await store.read()), before);
});

test('two sign-ups with the same link code: only one claims it', { skip }, async () => {
  const store = createPgStore(pool);
  const code = await store.write((repo) => {
    const service = createService({ repo });
    const p = repo.listPatients().find((x) => x.status === 'admitted' && !repo.listUsersByPatient(x.id).length);
    return service.createLinkCode(admin, p.id).code;
  });
  const claim = () => store.write((repo) => createService({ repo }).claimLinkCode(code));
  const outcomes = await Promise.allSettled([claim(), claim(), claim()]);
  assert.equal(outcomes.filter((o) => o.status === 'fulfilled').length, 1);
});

test('a menu change made by another server instance is seen after it is saved', { skip }, async () => {
  const a = createPgStore(pool);
  const b = createPgStore(pool);
  const meal = (await a.read()).getCatalogData().meals[1];
  await b.write((repo) => createService({ repo }).setAvailability(staff, meal.id, { available: false, reason: 'Supplier delay' }));
  const seen = (await a.read()).getCatalogData().meals.find((m) => m.id === meal.id);
  assert.equal(seen.available, false);
  assert.equal(seen.unavailableReason, 'Supplier delay');
});

test('read-only requests refuse to change data', { skip }, async () => {
  const repo = await createPgStore(pool).read();
  assert.throws(() => repo.addAudit({ at: new Date().toISOString(), actorRole: 'system', actorName: 'x', action: 'x', detail: 'x' }), /read-only/);
});

test('resetting the demonstration hospital empties and re-seeds it', { skip }, async () => {
  const store = createPgStore(pool);
  await pool.query(`INSERT INTO AuditLog (id, at, actor_role, actor_name, action, detail) VALUES (999999, '2020-01-01T00:00:00.000Z', 'system', 'x', 'old.entry', 'old')`);
  const written = await store.write((repo) => {
    repo.clearHospitalData();
    seedCatalog(repo, new Date().toISOString());
    const service = createService({ repo });
    service.reloadCatalog();
    linkDemoAccounts(repo, seedHospitalDemo({ repo, service, today: service.today() }));
    return dump(repo);
  });
  assert.deepEqual(dump(await store.read()), written);
  const old = await pool.query('SELECT COUNT(*)::int AS n FROM AuditLog WHERE id = 999999');
  assert.equal(old.rows[0].n, 0, 'audit rows outside the snapshot window are removed too');
});

test('dishes calculated from ingredients are stored as such, and older databases are fixed on start-up', { skip }, async () => {
  const { rows } = await pool.query(`SELECT nutrition_source FROM Dishes WHERE id = 'red-lentil-soup'`);
  assert.equal(rows[0]?.nutrition_source, 'ingredients');
  // Simulate a database written by the earlier version.
  await pool.query(`UPDATE Dishes SET nutrition_source = 'none' WHERE id = 'red-lentil-soup'`);
  await pool.query(`DELETE FROM Meta WHERE key IN ('migration_ingredient_nutrition', 'reference_hash')`);
  const client = await pool.connect();
  try { await ensureSchema(client); } finally { client.release(); }
  const again = await pool.query(`SELECT nutrition_source FROM Dishes WHERE id = 'red-lentil-soup'`);
  assert.equal(again.rows[0].nutrition_source, 'ingredients');
  const repo = await createPgStore(pool).read();
  const soup = createService({ repo }).catalog().byId['red-lentil-soup'];
  assert.ok(soup.nutrition.perServing.kcal > 0, 'the soup has calories after loading from Postgres');
});

test('care-team data round-trips: profiles, care teams, goals, notes, check-ins, messages and alerts', { skip }, async () => {
  const store = createPgStore(pool);
  const noura = { id: 'u-noura.1001', role: 'patient', status: 'active', name: 'Noura' };
  const alerts = [];
  const written = await store.write((repo) => {
    const service = createService({ repo, notify: (a) => alerts.push(a) });
    const pid = repo.listPatients().find((p) => p.demoId === 'MZ-1004').id;
    const p1 = repo.listPatients().find((p) => p.demoId === 'MZ-1001').id;
    noura.patientId = p1;
    service.updateProviderProfile(staff, 'me', { specialty: 'nurse', bio: 'Ward nurse.' });
    for (const m of repo.listCareTeam({ patientId: pid })) repo.removeCareTeam(pid, m.userId);
    repo.addCareTeam({ patientId: pid, userId: 'u-staff', addedAt: new Date().toISOString(), addedBy: 'test' });
    service.addToCareTeam(admin, pid, { userId: 'u-admin' });
    service.removeFromCareTeam(admin, pid, 'u-staff');
    const goals = service.setGoals(staff, pid, { targetWeight: 80, targetDate: addDays(service.today(), 30), steps: 6000, limits: { systolicMax: 140 } });
    const note = service.addNote(staff, pid, { body: 'Team only (pg)', visibility: 'team' });
    service.saveCheckin(noura, 'me', { hunger: 2, energy: 3, mood: 4 });
    const sent = service.sendMessage(noura, 'me', { body: 'Hello from the database test' });
    service.markRead({ ...staff, lang: 'ar' }, p1);
    repo.saveMessageAlert({ patientId: p1, userId: 'u-staff', lang: 'ar', lastAlertAt: '2026-01-01T00:00:00.000Z' });
    return { pid, p1, goals, note, sent, dump: dump(repo) };
  });
  const loaded = dump(await store.read());
  assert.deepEqual(loaded, written.dump);
  assert.equal(loaded.providerProfiles.find((p) => p.userId === 'u-staff').specialty, 'nurse');
  assert.deepEqual(loaded.careTeam.filter((m) => m.patientId === written.pid).map((m) => m.userId), ['u-admin']);
  assert.ok(loaded.health.some((r) => r.kind === 'goal' && r.targetWeight === 80 && r.limits.systolicMax === 140));
  assert.ok(loaded.health.some((r) => r.kind === 'note' && r.visibility === 'team'));
  assert.ok(loaded.health.some((r) => r.kind === 'checkin' && r.date === weekStart(addDays(written.goals.goal.targetDate, -30))));
  const msg = loaded.messages.find((m) => m.body === 'Hello from the database test');
  assert.ok(msg && msg.readByTeamAt, 'marked read by the team');
  const r = await store.read();
  assert.equal(r.getMessageAlert(written.p1, 'u-staff').lang, 'ar');
  // Deleting an account removes its profile and care-team places; deleting a patient removes their conversation.
  await store.write((repo) => { repo.deleteUserCareData('u-staff'); repo.deletePatient(written.p1); });
  const after = await store.read();
  assert.equal(after.getProviderProfile('u-staff'), null);
  assert.equal(after.listCareTeam({ userId: 'u-staff' }).length, 0);
  assert.equal(after.listMessages({ patientId: written.p1 }).length, 0);
  const { rows } = await pool.query('SELECT (SELECT COUNT(*)::int FROM Messages WHERE patient_id = $1) AS m, (SELECT COUNT(*)::int FROM CareTeam WHERE user_id = $2) AS c', [Number(written.p1), 'u-staff']);
  assert.deepEqual(rows[0], { m: 0, c: 0 });
});

test('migrations are idempotent and upgrade an older health-records table', { skip }, async () => {
  const client = await pool.connect();
  try {
    await client.query('DROP SCHEMA IF EXISTS mig_up CASCADE; CREATE SCHEMA mig_up; SET search_path TO mig_up');
    await client.query(`CREATE TABLE Meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
    await client.query(`CREATE TABLE HealthRecords (id INTEGER PRIMARY KEY, owner TEXT NOT NULL, kind TEXT NOT NULL CHECK (kind IN ('profile','assessment','reading','food','custom-food','home-plan')), date TEXT, data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`);
    await client.query(`INSERT INTO HealthRecords VALUES (1, 'm:x', 'reading', '2026-01-01', '{}', 'x', 'x')`);
    await ensureSchema(client);
    await ensureSchema(client);
    await client.query(`INSERT INTO HealthRecords VALUES (2, 'p:1', 'goal', NULL, '{}', 'x', 'x'), (3, 'p:1', 'note', NULL, '{}', 'x', 'x'), (4, 'p:1', 'checkin', NULL, '{}', 'x', 'x')`);
    await assert.rejects(client.query(`INSERT INTO HealthRecords VALUES (5, 'p:1', 'nonsense', NULL, '{}', 'x', 'x')`));
    const { rows } = await client.query(`SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'mig_up' AND table_name IN ('providerprofiles','careteam','messages','messagealerts')`);
    assert.equal(rows[0].n, 4);
    assert.equal((await client.query('SELECT COUNT(*)::int AS n FROM HealthRecords')).rows[0].n, 4, 'existing rows kept');
  } finally {
    await client.query('SET search_path TO public; DROP SCHEMA IF EXISTS mig_up CASCADE').catch(() => {});
    client.release();
  }
});
