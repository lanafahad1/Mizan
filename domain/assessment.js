// The Mizan Nutrition & Chronic Disease Assessment: an optional form that
// helps the care team (or a member, for themselves) understand health,
// nutritional needs and food preferences. Every question is optional; most
// offer "Not sure". The form collects information only: it does not diagnose
// conditions or prescribe a diet.
//
// The sections are data, so the web form, the review screen and validation all
// use one definition.

export const ASSESSMENT_NOTE = 'This form helps your care team collect and review your information. It does not diagnose conditions or prescribe a diet on its own.';
export const MEMBER_ASSESSMENT_NOTE = 'This form helps you keep your health information in one place. It does not diagnose conditions or prescribe a diet. For advice, share it with a healthcare professional.';

const YES_NO_UNSURE = [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }, { id: 'not-sure', label: 'Not sure' }];

/** Field types: number, text, textarea, date, choice (one), multi (several). */
export const ASSESSMENT_SECTIONS = [
  {
    id: 'about', title: 'About you', intro: 'A few basics so we can estimate your calories.',
    fields: [
      { id: 'age', label: 'Age', type: 'number', unit: 'years', min: 1, max: 120, step: 1 },
      { id: 'sex', label: 'Sex (the calorie calculator needs this)', type: 'choice', options: [{ id: 'male', label: 'Male' }, { id: 'female', label: 'Female' }] },
      { id: 'language', label: 'Preferred language', type: 'choice', options: [{ id: 'ar', label: 'Arabic' }, { id: 'en', label: 'English' }, { id: 'other', label: 'Other' }], other: 'languageOther' },
    ],
  },
  {
    id: 'body', title: 'Body measurements', intro: 'Add what you know. Measurements taken by staff are the most accurate.',
    fields: [
      { id: 'heightCm', label: 'Height', type: 'number', unit: 'cm', min: 100, max: 250, step: 0.5 },
      { id: 'weightKg', label: 'Current weight', type: 'number', unit: 'kg', min: 20, max: 400, step: 0.1 },
      { id: 'weightDate', label: 'Date the weight was measured', type: 'date' },
      { id: 'waistCm', label: 'Waist circumference, if you know it', type: 'number', unit: 'cm', min: 30, max: 250, step: 0.5 },
      { id: 'measuredBy', label: 'Who took these measurements?', type: 'choice', options: [{ id: 'staff', label: 'Measured by staff' }, { id: 'self', label: 'I measured myself' }] },
      { id: 'weightChange', label: 'Has your weight changed recently without you trying?', type: 'choice', options: YES_NO_UNSURE, details: 'weightChangeDetails' },
    ],
  },
  {
    id: 'health', title: 'Health conditions', intro: 'Only conditions a healthcare professional has diagnosed.',
    fields: [
      {
        id: 'conditions', label: 'Which conditions have you been diagnosed with?', type: 'multi', exclusive: ['none', 'not-sure'],
        options: [
          { id: 'obesity', label: 'Obesity' }, { id: 't2d', label: 'Type 2 diabetes' }, { id: 'other-diabetes', label: 'Other type of diabetes' },
          { id: 'hypertension', label: 'High blood pressure' }, { id: 'cvd', label: 'Cardiovascular (heart) disease' }, { id: 'kidney', label: 'Kidney disease' },
          { id: 'cholesterol', label: 'High cholesterol' }, { id: 'other', label: 'Other' }, { id: 'none', label: 'None known' }, { id: 'not-sure', label: 'Not sure' },
        ],
        other: 'conditionsOther',
      },
      { id: 'prescribedDiet', label: 'Has a healthcare professional given you a diet to follow?', type: 'choice', options: YES_NO_UNSURE, details: 'prescribedDietText' },
      { id: 'medicines', label: 'Medicines or supplements relevant to your care', type: 'textarea', max: 400 },
      { id: 'pregnant', label: 'Are you pregnant or breastfeeding?', type: 'choice', options: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }, { id: 'na', label: 'Not applicable' }] },
    ],
  },
  {
    id: 'food', title: 'Food allergies & needs', intro: 'Telling us about allergies and foods you avoid helps keep your suggestions safe.',
    fields: [
      { id: 'allergies', label: 'Do you have any food allergies?', type: 'choice', options: [{ id: 'yes', label: 'Yes' }, { id: 'nka', label: 'No known allergies' }, { id: 'not-sure', label: 'Not sure' }], details: 'allergyDetails', detailsLabel: 'Food and reaction, if known' },
      { id: 'intolerances', label: 'Food intolerances or other restrictions', type: 'text', max: 200 },
      { id: 'chewing', label: 'Do you have difficulty chewing or swallowing?', type: 'choice', options: YES_NO_UNSURE },
      { id: 'preferFoods', label: 'Foods you prefer', type: 'text', max: 200 },
      { id: 'avoidFoods', label: 'Foods you avoid, and why', type: 'text', max: 200 },
    ],
  },
  {
    id: 'habits', title: 'Eating & activity', intro: 'Tell us about a usual day, so your plan fits your real life.',
    fields: [
      { id: 'mealsPerDay', label: 'Usual number of meals a day', type: 'number', min: 0, max: 10, step: 1 },
      { id: 'snacksDrinks', label: 'Snacks and drinks between meals', type: 'text', max: 200 },
      { id: 'sugaryDrinks', label: 'How often do you have sugary drinks?', type: 'choice', options: [{ id: 'never', label: 'Never' }, { id: 'occasionally', label: 'Occasionally' }, { id: 'most-days', label: 'Most days' }, { id: 'daily', label: 'Daily' }] },
      { id: 'outsideFood', label: 'Do you eat food brought from outside the hospital?', type: 'choice', options: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }, { id: 'na', label: 'Not applicable' }], hospitalOnly: true },
      { id: 'appetite', label: 'How is your appetite at the moment?', type: 'choice', options: [{ id: 'low', label: 'Low' }, { id: 'usual', label: 'Usual' }, { id: 'increased', label: 'Increased' }] },
      {
        id: 'activity', label: 'Usual physical activity', type: 'choice',
        options: [
          { id: 'sedentary', label: 'Little or no exercise' }, { id: 'light', label: '1–3 times a week' }, { id: 'moderate', label: '3–5 times a week' },
          { id: 'very', label: '6–7 times a week' }, { id: 'extra', label: 'Very hard exercise or a physical job' },
        ],
        details: 'activityText', detailsLabel: 'What you do and for how long',
      },
      { id: 'activityRestrictions', label: 'Activity restrictions advised by your care team', type: 'text', max: 200 },
      {
        id: 'barriers', label: 'What makes it hard to follow your nutrition plan?', type: 'multi',
        options: [{ id: 'appetite', label: 'Appetite' }, { id: 'preferences', label: 'Food preferences' }, { id: 'cost', label: 'Cost or availability' }, { id: 'understanding', label: 'Understanding the plan' }, { id: 'other', label: 'Other' }],
        other: 'barriersOther',
      },
    ],
  },
  {
    id: 'goals', title: 'Goals & learning', intro: 'One small goal is enough to start.',
    fields: [
      {
        id: 'helpWith', label: 'What would you most like help with?', type: 'multi',
        options: [
          { id: 'portions', label: 'Understanding portions' }, { id: 'choosing', label: 'Choosing meals that fit my plan' }, { id: 'labels', label: 'Reading food labels' },
          { id: 'weight', label: 'Managing my weight' }, { id: 'home', label: 'Planning meals at home' }, { id: 'other', label: 'Other' },
        ],
        other: 'helpOther',
      },
      { id: 'goal', label: 'One goal I would like to work on', type: 'text', max: 200 },
      { id: 'educationFormat', label: 'How do you like to learn?', type: 'multi', options: [{ id: 'articles', label: 'Short articles' }, { id: 'pictures', label: 'Pictures' }, { id: 'videos', label: 'Videos' }, { id: 'printable', label: 'Printable guide' }] },
    ],
  },
];

/** Care-team review (hospital only; admin). Targets are copied to the diet order when approved. */
export const REVIEW_FIELDS = [
  { id: 'confirmedConditions', label: 'Confirmed conditions and dietary restrictions', type: 'textarea', max: 400 },
  { id: 'kcal', label: 'Daily energy target', type: 'number', unit: 'kcal/day', min: 800, max: 5000, step: 10 },
  { id: 'carbs', label: 'Carbohydrate target', type: 'number', unit: 'g/day', min: 20, max: 600, step: 1 },
  { id: 'sodium', label: 'Sodium limit, if prescribed', type: 'number', unit: 'mg/day', min: 500, max: 5000, step: 10 },
  { id: 'sugar', label: 'Sugar target, if prescribed', type: 'number', unit: 'g/day', min: 0, max: 300, step: 1 },
  { id: 'sugarType', label: 'Sugar target counts', type: 'choice', options: [{ id: 'total', label: 'Total sugar' }, { id: 'added', label: 'Added sugar' }] },
  { id: 'fat', label: 'Fat target, if prescribed', type: 'number', unit: 'g/day', min: 10, max: 300, step: 1 },
  { id: 'otherRequirements', label: 'Other nutritional requirements', type: 'textarea', max: 400 },
  { id: 'education', label: 'Education or discharge plan provided', type: 'textarea', max: 400 },
  { id: 'nextReviewOn', label: 'Next review date', type: 'date' },
];

export const ASSESSMENT_STATUS = [
  { id: 'draft', label: 'Draft', hint: 'Not sent yet. You can come back and finish it later.' },
  { id: 'awaiting-review', label: 'Awaiting review', hint: 'Sent to the care team.' },
  { id: 'more-info', label: 'More information needed', hint: 'The care team asked for more details.' },
  { id: 'approved', label: 'Plan approved', hint: 'The care team reviewed it and set your plan.' },
  { id: 'completed', label: 'Completed', hint: 'Saved to your personal profile.' },
];

const FIELD_INDEX = new Map(ASSESSMENT_SECTIONS.flatMap((s) => s.fields.map((f) => [f.id, f])));
const EXTRA_TEXT = new Set(ASSESSMENT_SECTIONS.flatMap((s) => s.fields.flatMap((f) => [f.other, f.details].filter(Boolean))).concat(['languageOther']));
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Clean and validate answers. Unknown keys are dropped, empty answers removed.
 * Returns { answers, errors } (errors keyed by field id).
 */
export function normalizeFields(input, fields) {
  const out = {};
  const errors = {};
  const src = input && typeof input === 'object' ? input : {};
  const index = fields instanceof Map ? fields : new Map(fields.map((f) => [f.id, f]));
  for (const [key, raw] of Object.entries(src)) {
    const f = index.get(key);
    if (!f) {
      if (EXTRA_TEXT.has(key) && typeof raw === 'string' && raw.trim()) out[key] = raw.trim().slice(0, 200);
      continue;
    }
    if (raw == null || raw === '' || (Array.isArray(raw) && !raw.length)) continue;
    if (f.type === 'number') {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < f.min || n > f.max) errors[key] = `Enter a number between ${f.min} and ${f.max}${f.unit ? ` ${f.unit}` : ''}.`;
      else out[key] = n;
    } else if (f.type === 'date') {
      if (typeof raw !== 'string' || !ISO.test(raw)) errors[key] = 'Choose a date.';
      else out[key] = raw;
    } else if (f.type === 'choice') {
      if (!f.options.some((o) => o.id === raw)) errors[key] = 'Choose one of the options.';
      else out[key] = raw;
    } else if (f.type === 'multi') {
      const list = [...new Set((Array.isArray(raw) ? raw : [raw]).map(String))];
      if (list.some((v) => !f.options.some((o) => o.id === v))) { errors[key] = 'Choose from the options.'; continue; }
      const excl = list.find((v) => f.exclusive?.includes(v));
      out[key] = excl ? [excl] : list;
    } else {
      if (typeof raw !== 'string') { errors[key] = 'Enter text.'; continue; }
      const t = raw.trim().slice(0, f.max ?? 200);
      if (t) out[key] = t;
    }
  }
  return { answers: out, errors };
}

export const normalizeAnswers = (input) => normalizeFields(input, FIELD_INDEX);
export const normalizeReview = (input) => normalizeFields(input, REVIEW_FIELDS);

/** How many questions have an answer (for the progress bar). */
export function answeredCount(answers) {
  return ASSESSMENT_SECTIONS.reduce((n, s) => n + s.fields.filter((f) => answers?.[f.id] != null).length, 0);
}
export const QUESTION_COUNT = ASSESSMENT_SECTIONS.reduce((n, s) => n + s.fields.length, 0);
