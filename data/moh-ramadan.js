// Ramadan tips, taken only from Saudi Ministry of Health pages (each tip names its
// source id in domain/rules.js SOURCES). Mizan adds nothing of its own and gives no
// medication advice: the MOH pages include advice on medicine timing, which Mizan
// deliberately leaves out ("talk to your doctor about your medicines").
// Pages read on 2026-11-14.

/** General tips for anyone fasting (shown in the diary's Ramadan tips card). */
export const RAMADAN_TIPS = [
  { id: 'suhoor-late', text: 'Don’t skip Suhoor, and have it as late as you can.', source: 'MOH-SUHOOR' },
  { id: 'suhoor-plate', text: 'At Suhoor, include vegetables, whole grains such as whole-wheat bread, and protein such as eggs, yogurt, milk or unsalted cheese. High-fibre whole grains like oats keep you full for longer.', source: 'MOH-SUHOOR' },
  { id: 'suhoor-salt', text: 'Go easy on salty foods at Suhoor, such as processed meats, olives, pickles, salty cheese, packaged biscuits, spreads and sauces: they make you thirsty.', source: 'MOH-SUHOOR' },
  { id: 'fluids', text: 'Drink enough fluids between Iftar and Suhoor, spread out over the evening, rather than a lot of water at Suhoor.', source: 'MOH-SUHOOR' },
  { id: 'water-foods', text: 'Foods with a lot of water help too: lettuce, watermelon, strawberries, oranges and pineapple.', source: 'MOH-SUHOOR' },
  { id: 'less-fat', text: 'Limit high-fat foods such as fatty meats, pastries with added fat, butter and margarine.', source: 'MOH-SUHOOR' },
  { id: 'fried', text: 'Fried and fatty foods are common in Ramadan and are harmful to the heart. Plan your meal and sleep times before Ramadan starts.', source: 'MOH-RAMADAN-HEART' },
  { id: 'check-first', text: 'If you have a long-term condition, get a full check with your healthcare provider before you fast. Your food plan and follow-up depend on your own risk.', source: 'MOH-RAMADAN-CHRONIC' },
];

/** Shown when high blood pressure is in the person's conditions. (The page's medicine-timing tips are left out on purpose.) */
export const RAMADAN_BP_TIPS = [
  { id: 'bp', text: 'With high blood pressure: talk to your doctor before you fast, use less salt and include low-fat dairy in your meals.', source: 'MOH-RAMADAN-BP' },
];

/** Diabetes (type 1 or 2 in the person's conditions): information only, with its source. */
export const RAMADAN_DIABETES = {
  source: 'MOH-RAMADAN-DIABETES',
  checks: [
    'Checking your blood sugar does not break the fast.',
    'MOH suggests checking 1–2 times a day at low or moderate risk, and 3–4 times a day at high risk.',
    'Always check after Iftar, and whenever you feel unwell or have symptoms.',
  ],
  breakFast: [
    'Your blood sugar is below 70 mg/dL.',
    'It is 70–90 mg/dL when you check again within an hour.',
    'It is above 300 mg/dL.',
    'You have signs of low or high blood sugar, dehydration or a sudden illness.',
  ],
  doctor: 'Talk to your doctor before Ramadan about fasting and your medicines.',
};

/** Hospital patients: the care team decides. */
export const RAMADAN_PATIENT_NOTE = 'In hospital, your care team decides about fasting and your meals. Ask them before you fast.';
