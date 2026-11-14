// Synthetic care-team data for the demonstration: provider profiles, care teams,
// goals, notes, weekly check-ins and a short conversation. Everything is fictional
// and generated relative to today. Called at the end of seedHealthDemo().

import { addDays } from './dates.js';
import { weekStart } from './care-service.js';

const at = (date, time) => `${date}T${time}:00.000Z`;

export function seedCareDemo({ repo, today, patientIds = {} }) {
  const staffUser = repo.getUserByUsername('staff.demo');
  const adminUser = repo.getUserByUsername('admin.demo');
  const stampNow = new Date().toISOString();
  const ago = (d) => addDays(today, -d);

  // ---- provider profiles (the shared demo accounts)
  if (staffUser) repo.saveProviderProfile({ userId: staffUser.id, specialty: 'dietitian', bio: 'Clinical dietitian. I help with portions, diabetes-friendly meals and eating well at home.', updatedAt: stampNow, updatedBy: 'Mizan' });
  if (adminUser) repo.saveProviderProfile({ userId: adminUser.id, specialty: 'physician', bio: 'Internal medicine. I review diet orders, allergies and care plans with the team.', updatedAt: stampNow, updatedBy: 'Mizan' });

  // ---- care teams: the demo dietitian follows most patients; the demo physician two of them
  const team = (demoId, user, daysAgo) => {
    const pid = patientIds[demoId];
    if (pid && user) repo.addCareTeam({ patientId: pid, userId: user.id, addedAt: at(ago(daysAgo), '08:00'), addedBy: 'Demo Admin' });
  };
  for (const id of ['MZ-1001', 'MZ-1002', 'MZ-1003', 'MZ-1004', 'MZ-1005', 'MZ-1006', 'MZ-1009']) team(id, staffUser, 5);
  team('MZ-1001', adminUser, 5);
  team('MZ-1002', adminUser, 5);

  const by = (u, role) => ({ setBy: u?.name ?? (role === 'admin' ? 'Demo Admin' : 'Dr. Turki Al-Mutairi'), setById: u?.id ?? null, setByRole: role });
  const note = (pid, u, role, daysAgo, time, visibility, body) => repo.addHealth({
    owner: `p:${pid}`, kind: 'note', date: ago(daysAgo), body, visibility, authorId: u?.id ?? null, authorName: u?.name ?? 'Dr. Turki Al-Mutairi', authorRole: role, createdAt: at(ago(daysAgo), time),
  });

  // ---- Noura (MZ-1001): obesity, type 2 diabetes, high blood pressure
  const n = patientIds['MZ-1001'];
  if (n) {
    repo.addHealth({
      owner: `p:${n}`, kind: 'goal', date: null, targetWeight: 88, targetDate: addDays(today, 84), steps: 5000, water: 8, kcal: 1500, carbs: 180,
      limits: { glucoseFastingMax: 130, systolicMax: 140, diastolicMax: 90 }, ...by(staffUser, 'staff'), setAt: at(ago(6), '09:00'), createdAt: at(ago(6), '09:00'),
    });
    note(n, staffUser, 'staff', 2, '10:15', 'patient', 'Great start this week, Noura: you logged your food every day. At your next visit we will look at your lunch portions together.');
    note(n, staffUser, 'staff', 1, '14:40', 'team', 'Fasting blood sugar was above the limit we set twice this week. To discuss with the physician at the next review.');
    [[21, 2, 3, 3], [14, 3, 3, 4], [7, 3, 4, 4]].forEach(([d, hunger, energy, mood]) => {
      const w = weekStart(ago(d));
      repo.addHealth({ owner: `p:${n}`, kind: 'checkin', date: w, hunger, energy, mood, createdAt: at(addDays(w, 1), '19:00') });
    });
    const send = (u, role, name, daysAgo, time, body, read) => {
      // The newest message is from half an hour ago, so it never shows a time in the future.
      const when = time ? at(ago(daysAgo), time) : new Date(Date.now() - 30 * 60e3).toISOString();
      return repo.addMessage({
        patientId: n, senderUserId: u?.id ?? null, senderRole: role, senderName: name, body, createdAt: when,
        readByPatientAt: role === 'patient' || read ? when : null, readByTeamAt: role !== 'patient' || read ? when : null,
      });
    };
    const nouraUser = repo.listUsersByPatient(n)[0];
    send(staffUser, 'staff', staffUser?.name ?? 'Dr. Turki Al-Mutairi', 3, '09:30', 'Hello Noura, I’m your dietitian. You can message me here about your meals, your goals or anything that worries you about food.', true);
    send(nouraUser, 'patient', nouraUser?.name ?? 'Noura', 2, '18:05', 'Thank you. Is it fine to have laban with my dinner?', true);
    send(staffUser, 'staff', staffUser?.name ?? 'Dr. Turki Al-Mutairi', 2, '19:20', 'Thanks for asking. Please log it with your dinner, and we will go through your evening meals together at your next visit.', true);
    send(nouraUser, 'patient', nouraUser?.name ?? 'Noura', 0, null, 'My fasting sugar was a bit high this morning. Should I change my breakfast?', false);
  }

  // ---- Fahad (MZ-1002): obesity, high blood pressure, heart disease
  const f = patientIds['MZ-1002'];
  if (f) {
    repo.addHealth({ owner: `p:${f}`, kind: 'goal', date: null, targetWeight: 95, steps: 4000, water: 8, limits: { systolicMax: 140, diastolicMax: 90 }, ...by(adminUser, 'admin'), setAt: at(ago(5), '10:00'), createdAt: at(ago(5), '10:00') });
    note(f, adminUser, 'admin', 1, '11:00', 'patient', 'Fahad, well done for logging your drinks this week. Let us talk about them at your next review.');
  }

  // ---- Khalid (MZ-1004): after surgery, high-protein diet
  const k = patientIds['MZ-1004'];
  if (k) note(k, staffUser, 'staff', 1, '12:30', 'patient', 'Khalid, your care team has updated your meal plan. Tell us if the portions feel too small or too big.');
}
