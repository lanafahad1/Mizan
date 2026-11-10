// Saudi Ministry of Health, "Calorie Guide for Weight Loss, 1,200–2,200
// calories" (دليل السعرات الحرارية لخفض الوزن), Live Well (عش بصحة) programme.
// Arabic PDF linked from the MOH Food and Nutrition page "Food Calorie
// Calculator for Weight Loss". Transcribed by the CareBite team from the
// published pages; nothing is added or estimated. Values marked null are not
// stated by MOH.
//
// The exchange (البدائل) values are MOH's average values for each food group
// portion, not laboratory values for each single food.

export const MOH_GUIDE_META = {
  title: 'Calorie Guide for Weight Loss, 1,200–2,200 calories',
  titleAr: 'دليل السعرات الحرارية لخفض الوزن ٢٢٠٠-١٢٠٠ سعرة حرارية',
  publisher: 'Ministry of Health (MOH), Saudi Arabia · Live Well programme',
  url: 'https://www.moh.gov.sa/HealthAwareness/EducationalContent/Food-and-Nutrition/Documents/Food-Calorie-Calculator.pdf',
  page: 'https://www.moh.gov.sa/en/HealthAwareness/EducationalContent/Food-and-Nutrition/Pages/Food-Calorie-Calculator.aspx',
  audience: 'For adults (the Ministry of Health page says this section is for ages 15 and up).',
};

/** One portion (exchange) of each food group, as stated by MOH. */
export const EXCHANGE_GROUPS = [
  { id: 'milk', label: 'Milk (low fat)', labelAr: 'الحليب (قليل الدسم)', kcal: 120, carbs: 12, protein: 8, fat: 5 },
  { id: 'starch', label: 'Starches', labelAr: 'النشويات', kcal: 80, carbs: 15, protein: 3, fat: null },
  { id: 'protein', label: 'Protein', labelAr: 'البروتين', kcal: 75, carbs: null, protein: 7, fat: 5 },
  { id: 'vegetables', label: 'Vegetables', labelAr: 'الخضروات', kcal: 25, carbs: 5, protein: 2, fat: null },
  { id: 'fruit', label: 'Fruit', labelAr: 'الفواكه', kcal: 60, carbs: 15, protein: null, fat: null },
  { id: 'fat', label: 'Fats', labelAr: 'الدهون', kcal: 45, carbs: null, protein: null, fat: 5 },
];
export const FREE_FOOD_KCAL = 20; // "less than 20 calories per portion"

/**
 * Exchange list. `counts` gives the exchanges one portion provides when MOH says
 * a food counts in two groups (beans and lentils; peanut butter).
 */
export const EXCHANGE_FOODS = [
  // Milk
  { id: 'milk-low-fat', group: 'milk', name: 'Milk (low fat)', nameAr: 'حليب', portion: '1 cup', portionAr: 'كوب واحد' },
  { id: 'laban-low-fat', group: 'milk', name: 'Laban (low fat)', nameAr: 'لبن', portion: '1 cup', portionAr: 'كوب واحد' },
  { id: 'yogurt-low-fat', group: 'milk', name: 'Yogurt (low fat)', nameAr: 'زبادي', portion: '1 cup', portionAr: 'كوب واحد' },
  { id: 'milk-powder', group: 'milk', name: 'Powdered milk', nameAr: 'حليب مجفف', portion: '1 tablespoon', portionAr: 'ملعقة طعام' },
  // Starches
  { id: 'rice-cooked', group: 'starch', name: 'Rice, cooked', nameAr: 'أرز (مطبوخ)', portion: '⅓ cup', portionAr: '⅓ كوب' },
  { id: 'pasta-cooked', group: 'starch', name: 'Pasta, cooked', nameAr: 'معكرونة (مطبوخ)', portion: '½ cup', portionAr: '½ كوب' },
  { id: 'arabic-bread', group: 'starch', name: 'Arabic flat bread', nameAr: 'خبز عربي مفرود', portion: '¼ loaf', portionAr: '¼ حبة' },
  { id: 'toast', group: 'starch', name: 'Toast', nameAr: 'توست', portion: '1 slice', portionAr: 'شريحة واحدة' },
  { id: 'samoli', group: 'starch', name: 'Samoli bread', nameAr: 'صامولي', portion: '½ roll', portionAr: 'نص حبة' },
  { id: 'beans-lentils-cooked', group: 'starch', name: 'Fava beans or lentils, cooked', nameAr: 'فول أو عدس (مطبوخ)', portion: '⅓ cup', portionAr: '⅓ كوب', counts: { starch: 1, protein: 1 }, note: 'Counts as 1 starch and 1 protein portion.' },
  { id: 'breakfast-cereal', group: 'starch', name: 'Breakfast cereal (dry)', nameAr: 'حبوب إفطار (غير مطبوخة)', portion: '¾ cup', portionAr: '¾ كوب' },
  { id: 'oats-dry', group: 'starch', name: 'Oats (dry)', nameAr: 'حبوب الشوفان (غير مطبوخة)', portion: '¼ cup', portionAr: '¼ كوب' },
  { id: 'potato', group: 'starch', name: 'Potato', nameAr: 'بطاطس', portion: '1 small', portionAr: 'حبة صغيرة' },
  { id: 'corn', group: 'starch', name: 'Corn', nameAr: 'ذرة', portion: '½ cup', portionAr: '½ كوب' },
  { id: 'pumpkin', group: 'starch', name: 'Pumpkin', nameAr: 'قرع', portion: '¼ cup', portionAr: '¼ كوب' },
  { id: 'peas', group: 'starch', name: 'Peas', nameAr: 'بازلاء', portion: '½ cup', portionAr: '½ كوب' },
  { id: 'shabura', group: 'starch', name: 'Shabura (rusk)', nameAr: 'شابورة', portion: '2 slices', portionAr: 'شريحتين' },
  { id: 'popcorn-plain', group: 'starch', name: 'Popcorn (no fat or salt)', nameAr: 'فشار (مطبوخ خالي من الدهن والملح)', portion: '3 cups', portionAr: '3 أكواب' },
  { id: 'biscuits-unsweetened', group: 'starch', name: 'Unsweetened biscuits', nameAr: 'بسكويت غير محلى', portion: '3 small', portionAr: '3 حبات صغيرة الحجم' },
  // Protein
  { id: 'lean-meat', group: 'protein', name: 'Lean meat, skinless chicken or fish', nameAr: 'لحم خالي من الدهون أو دجاج منزوع الجلد أو سمك', portion: '30 g', portionAr: '30 جم', grams: 30 },
  { id: 'tuna-water', group: 'protein', name: 'Tuna canned in water', nameAr: 'سمك تونة معلبة بالماء', portion: '¼ cup', portionAr: '¼ كوب' },
  { id: 'egg', group: 'protein', name: 'Egg', nameAr: 'بيض', portion: '1 egg', portionAr: 'بيضة واحدة' },
  { id: 'white-cheese', group: 'protein', name: 'White cheese', nameAr: 'جبنة بيضاء', portion: '30 g', portionAr: '30 جم', grams: 30 },
  { id: 'peanut-butter', group: 'protein', name: 'Peanut butter', nameAr: 'زبدة الفول السوداني', portion: '1 tablespoon', portionAr: 'ملعقة طعام واحدة', counts: { protein: 1, fat: 1 }, note: 'Counts as 1 protein and 1 fat portion.' },
  // Vegetables (potato, pumpkin, corn, peas and carrots count as starches)
  { id: 'vegetables-fresh', group: 'vegetables', name: 'Vegetables, fresh (salad)', nameAr: 'خضار طازج', portion: '1 cup', portionAr: 'كوب واحد' },
  { id: 'vegetables-cooked', group: 'vegetables', name: 'Vegetables, cooked', nameAr: 'خضار مطبوخ', portion: '½ cup', portionAr: '½ كوب' },
  // Fruit
  { id: 'apple-orange-pear', group: 'fruit', name: 'Apple, orange or pear', nameAr: 'تفاح أو برتقال أو كمثرى', portion: '1 medium', portionAr: 'حبة واحدة متوسطة الحجم' },
  { id: 'banana', group: 'fruit', name: 'Banana', nameAr: 'موزة متوسطة الحجم', portion: '½ medium', portionAr: '½ حبة' },
  { id: 'watermelon', group: 'fruit', name: 'Watermelon', nameAr: 'بطيخ', portion: '1¼ cups', portionAr: '1 و ¼ كوب' },
  { id: 'cantaloupe', group: 'fruit', name: 'Cantaloupe', nameAr: 'شمام', portion: '1 cup', portionAr: 'كوب واحد' },
  { id: 'pineapple', group: 'fruit', name: 'Pineapple', nameAr: 'أناناس', portion: '¾ cup', portionAr: '¾ كوب' },
  { id: 'dates', group: 'fruit', name: 'Dates', nameAr: 'تمر', portion: '3 dates', portionAr: '3 حبات' },
  { id: 'strawberries', group: 'fruit', name: 'Strawberries', nameAr: 'فراولة', portion: '1¼ cups', portionAr: '1 و ¼ كوب' },
  { id: 'grapes', group: 'fruit', name: 'Grapes', nameAr: 'عنب', portion: '15 grapes', portionAr: '15 حبة' },
  { id: 'cherries', group: 'fruit', name: 'Cherries', nameAr: 'كرز', portion: '12 cherries', portionAr: '12 حبة' },
  { id: 'mango', group: 'fruit', name: 'Mango', nameAr: 'مانجو', portion: '½ mango', portionAr: '½ حبة' },
  { id: 'figs', group: 'fruit', name: 'Figs', nameAr: 'تين', portion: '2 figs', portionAr: 'حبتين' },
  { id: 'pomegranate', group: 'fruit', name: 'Pomegranate', nameAr: 'رمان', portion: '½ cup', portionAr: '½ كوب' },
  { id: 'berries', group: 'fruit', name: 'Berries (mulberries)', nameAr: 'توت', portion: '¾ cup', portionAr: '¾ كوب' },
  { id: 'fruit-juice', group: 'fruit', name: 'Fruit juice', nameAr: 'عصير فواكه', portion: '½ cup', portionAr: '½ كوب' },
  // Fats
  { id: 'nuts-raw', group: 'fat', name: 'Raw unsalted nuts (6 almonds, 10 peanuts or 12 pistachios)', nameAr: 'مكسرات نيئة غير مملحة', portion: '6 almonds · 10 peanuts · 12 pistachios', portionAr: '6 حبات لوز أو 10 حبات فول سوداني أو 12 حبة فستق' },
  { id: 'vegetable-oil', group: 'fat', name: 'Olive, corn or sunflower oil', nameAr: 'زيت الزيتون أو زيت الذرة أو زيت دوار الشمس', portion: '1 teaspoon', portionAr: 'ملعقة شاي واحدة' },
  { id: 'olives', group: 'fat', name: 'Olives', nameAr: 'زيتون', portion: '5 large or 10 small', portionAr: '5 حبات زيتون كبير أو 10 حبات زيتون صغير' },
  { id: 'avocado', group: 'fat', name: 'Avocado', nameAr: 'أفوكادو', portion: '⅛ avocado', portionAr: '⅛ حبة' },
];

/** "Free" foods: under 20 kcal a portion. */
export const FREE_FOODS = [
  { name: 'Coffee or tea (no milk or sugar)', nameAr: 'قهوة أو شاي (بدون حليب أو سكر)' },
  { name: 'Vinegar', nameAr: 'خل' }, { name: 'Lemon', nameAr: 'ليمون' }, { name: 'Mustard', nameAr: 'خردل' },
  { name: 'Herbs', nameAr: 'أعشاب' }, { name: 'Pepper', nameAr: 'فلفل' }, { name: 'Garlic', nameAr: 'ثوم' }, { name: 'Mint', nameAr: 'نعناع' },
  { name: 'Spices', nameAr: 'توابل متنوعة' }, { name: 'Leafy greens (watercress, parsley, spinach)', nameAr: 'الخضروات الورقية كالجرجير والبقدونس والسبانخ' },
];

/** Healthy plate shares (MOH "الطبق الصحي"); dairy is shown beside the plate. */
export const HEALTHY_PLATE = [
  { group: 'vegetables', label: 'Vegetables', share: 30 },
  { group: 'grains', label: 'Grains', share: 25 },
  { group: 'protein', label: 'Protein', share: 25 },
  { group: 'fruit', label: 'Fruit', share: 20 },
  { group: 'milk', label: 'Milk', share: null },
];

// Daily meal plans. `day` = exchanges per day as printed at the top of each plan;
// `meals` = the plan's example table: [group, exchanges, example].
const L = (group, n, example, exampleAr) => ({ group, n, example, exampleAr });
const BREAKFAST_A = [L('starch', 2, '½ Arabic flat bread', '½ خبز عربي مفرود'), L('milk', 1, '1 cup milk', 'واحد كوب حليب'), L('protein', 1, '30 g white cheese', '30 جم جبنة بيضاء'), L('vegetables', 1, 'Tomato, cucumber or carrot', 'طماطم أو خيار أو جزر'), L('fat', 1, '5 large olives', '5 حبات زيتون كبير')];
const BREAKFAST_B = (cheeseN, cheese, cheeseAr) => [L('starch', 3, '¾ Arabic flat bread', '¾ خبز عربي مفرود'), L('milk', 1, '1 cup milk', 'واحد كوب حليب'), L('protein', cheeseN, cheese, cheeseAr), L('vegetables', 1, 'Tomato, cucumber or carrot', 'طماطم أو خيار أو جزر'), L('fat', 1, '5 large olives', '5 حبات زيتون كبير')];
const APPLE = L('fruit', 1, '1 apple', 'حبة تفاح');
const SHABURA = L('starch', 1, '2 slices shabura', 'شريحتين شابورة');
const DATES = L('fruit', 1, '3 dates', '3 حبات تمر');
const POPCORN = (n) => L('starch', n, `${n * 3} cups popcorn`, `${n * 3} أكواب فشار`);
const LUNCH = ({ rice, chicken, veg }) => [
  rice === 2 ? L('starch', 2, '⅔ cup rice', '⅔ كوب أرز') : L('starch', 3, '1 cup rice', 'واحد كوب أرز'),
  L('milk', 1, '1 cup laban', 'واحد كوب لبن'),
  L('protein', chicken, `${chicken * 30} g chicken`, `${chicken * 30} جم دجاج`),
  veg === 2 ? L('vegetables', 2, '1 cup cooked vegetables', 'واحد كوب خضار مطبوخ') : L('vegetables', 1, '½ cup cooked vegetables', '½ كوب خضار مطبوخ'),
];
const OIL = L('fat', 1, '1 teaspoon olive oil', 'واحد ملعقة شاي زيت زيتون');
const DINNER = ({ eggs = 1, banana = false, oil = false }) => [
  L('starch', 2, '1 samoli roll', 'حبة واحدة صامولي'), L('vegetables', 1, '1 cup salad', 'واحد كوب سلطة'),
  L('protein', eggs, eggs === 2 ? '2 eggs' : '1 egg', eggs === 2 ? 'بيضتان' : 'بيضة واحدة'),
  ...(banana ? [L('fruit', 1, '½ medium banana', '½ حبة موزة متوسطة')] : []), ...(oil ? [OIL] : []),
];

export const MOH_MEAL_PLANS = [
  { kcal: 1200, day: { milk: 2, vegetables: 4, fruit: 2, starch: 6, protein: 3, fat: 1 },
    meals: { breakfast: BREAKFAST_A, snack1: [APPLE], lunch: LUNCH({ rice: 2, chicken: 1, veg: 2 }), snack2: [DATES], dinner: DINNER({}) } },
  { kcal: 1300, day: { milk: 2, vegetables: 3, fruit: 2, starch: 7, protein: 3, fat: 2 },
    meals: { breakfast: BREAKFAST_A, snack1: [APPLE], lunch: [...LUNCH({ rice: 3, chicken: 1, veg: 2 }).map((l) => (l.group === 'vegetables' ? L('vegetables', 1, '1 cup cooked vegetables', 'واحد كوب خضار مطبوخ') : l)), OIL], snack2: [DATES], dinner: DINNER({}) } },
  { kcal: 1400, day: { milk: 2, vegetables: 4, fruit: 2, starch: 8, protein: 3, fat: 2 },
    meals: { breakfast: BREAKFAST_A, snack1: [APPLE], lunch: [...LUNCH({ rice: 3, chicken: 1, veg: 2 }), OIL], snack2: [POPCORN(1), DATES], dinner: DINNER({}) } },
  { kcal: 1500, day: { milk: 2, vegetables: 3, fruit: 3, starch: 8, protein: 4, fat: 2 },
    meals: { breakfast: BREAKFAST_A, snack1: [APPLE], lunch: [...LUNCH({ rice: 3, chicken: 2, veg: 1 }), OIL], snack2: [POPCORN(1), DATES], dinner: DINNER({ banana: true }) } },
  { kcal: 1600, day: { milk: 2, vegetables: 3, fruit: 3, starch: 9, protein: 4, fat: 2 },
    meals: { breakfast: BREAKFAST_A, snack1: [SHABURA, APPLE], lunch: [...LUNCH({ rice: 3, chicken: 2, veg: 1 }), OIL], snack2: [POPCORN(1), DATES], dinner: DINNER({ banana: true }) } },
  { kcal: 1700, day: { milk: 2, vegetables: 4, fruit: 3, starch: 9, protein: 5, fat: 2 },
    meals: { breakfast: BREAKFAST_A, snack1: [SHABURA, APPLE], lunch: [...LUNCH({ rice: 3, chicken: 3, veg: 2 }), OIL], snack2: [POPCORN(1), DATES], dinner: DINNER({ banana: true }) } },
  { kcal: 1800, day: { milk: 2, vegetables: 3, fruit: 3, starch: 10, protein: 5, fat: 3 },
    meals: { breakfast: BREAKFAST_B(1, '30 g white cheese', '30 جم جبنة بيضاء'), snack1: [SHABURA, APPLE], lunch: [...LUNCH({ rice: 3, chicken: 3, veg: 1 }), OIL], snack2: [POPCORN(1), DATES], dinner: DINNER({ banana: true, oil: true }) } },
  { kcal: 1900, day: { milk: 2, vegetables: 4, fruit: 3, starch: 10, protein: 6, fat: 3 },
    meals: { breakfast: BREAKFAST_B(2, '60 g white cheese', '60 جم جبنة بيضاء'), snack1: [SHABURA, APPLE], lunch: [...LUNCH({ rice: 3, chicken: 3, veg: 2 }), OIL], snack2: [POPCORN(1), DATES], dinner: DINNER({ banana: true, oil: true }) } },
  { kcal: 2000, day: { milk: 2, vegetables: 3, fruit: 3, starch: 11, protein: 7, fat: 2 },
    meals: { breakfast: BREAKFAST_B(2, '60 g white cheese', '60 جم جبنة بيضاء'), snack1: [SHABURA, APPLE], lunch: [...LUNCH({ rice: 3, chicken: 3, veg: 1 }), OIL], snack2: [POPCORN(2), DATES], dinner: DINNER({ eggs: 2, banana: true }) } },
  { kcal: 2200, day: { milk: 2, vegetables: 4, fruit: 3, starch: 11, protein: 9, fat: 3 },
    note: 'As printed: the daily row says 9 protein portions; the meal table adds up to 8.',
    meals: { breakfast: BREAKFAST_B(3, '90 g white cheese', '90 جم جبنة بيضاء'), snack1: [SHABURA, APPLE], lunch: [...LUNCH({ rice: 3, chicken: 3, veg: 2 }), OIL], snack2: [POPCORN(2), DATES], dinner: DINNER({ eggs: 2, banana: true, oil: true }) } },
];
export const PLAN_RULES = [
  'Eat the portions set for each day, with no extra portions, so your total matches the plan.',
  'You can swap a portion for another food from the portion guide, as long as each meal keeps the same number of portions.',
];

/** MOH waist circumference: disease risk rises at these values. */
export const WAIST_RISK = {
  male: { increased: 94, high: 102 },
  female: { increased: 80, high: 88 },
};

/** Reading the nutrition label (MOH "steps to read the nutrition label"). */
export const LABEL_GUIDE = {
  servingNote: 'Start with the serving size: the label values are for one serving, not the whole pack.',
  kcalPerServing: [{ kcal: 40, label: 'Low' }, { kcal: 100, label: 'Moderate' }, { kcal: 400, label: 'High' }],
  dailyValue: { low: 5, high: 20 }, // % daily value: 5% or less is low, 20% or more is high
  limit: ['Total fat', 'Saturated fat', 'Trans fat', 'Cholesterol', 'Sodium', 'Added sugar'],
  getEnough: ['Fibre', 'Vitamins', 'Calcium', 'Iron'],
};

/** Household measures (MOH "measurement standards"). */
export const MEASURES = [
  { name: 'Standard cup', ml: 240, note: '= 16 tablespoons' },
  { name: 'Tablespoon', ml: 15, note: '= 3 teaspoons' },
  { name: 'Teaspoon', ml: 5, note: '≈ 5 g' },
  { name: '2 tablespoons', ml: 30, note: '≈ 30 g' },
];

/** Physical activity for adults 18–64 (MOH). */
export const ACTIVITY_GUIDE = [
  '150 minutes a week of moderate activity (walking, swimming, cycling), or 75 minutes of vigorous activity (running, sports, stair climbing), or a mix.',
  'Muscle-strengthening exercise for the major muscle groups 2–3 times a week.',
  'For weight loss, alongside a healthy diet: aerobic activity such as brisk walking for 250–300 minutes a week, plus resistance exercise.',
  'Build up gradually. People with heart risk factors (smoking, high cholesterol, high blood pressure, type 2 diabetes or obesity) should consult a doctor before vigorous activity.',
  'Sit less and break up long periods of sitting.',
];

/** Healthy lifestyle recipe for weight loss in adults (MOH). */
export const LIFESTYLE_TIPS = [
  { area: 'food', text: 'Aim for 3 portions of vegetables a day (each is ½ cup cooked or 1 cup of salad).' },
  { area: 'food', text: 'Aim for 2 portions of fresh fruit a day (each is 1 medium fruit).' },
  { area: 'food', text: 'Have no more than 2 portions of low-fat or fat-free milk, laban or yogurt a day (1 cup each).' },
  { area: 'food', text: 'Choose lean meat, remove skin and fat, avoid frying, and eat fish at least twice a week.' },
  { area: 'food', text: 'Pick whole grains for extra fibre, like whole-wheat bread, bulgur and brown rice.' },
  { area: 'food', text: 'Limit added sugar in drinks and food to no more than 6 teaspoons a day.' },
  { area: 'food', text: 'Swap sugary and fizzy drinks for water or unsweetened natural juice, and sweets for vegetables and fresh fruit.' },
  { area: 'food', text: 'Enjoy raw nuts in moderation (about a handful).' },
  { area: 'food', text: 'Avoid saturated and trans fats; use olive or canola oil instead of coconut or palm oil.' },
  { area: 'food', text: 'Drink 6–8 cups of water a day.' },
  { area: 'food', text: 'Know your daily calorie needs, and check the nutrition label on packaged foods.' },
  { area: 'activity', text: 'Walk 60–90 minutes a day on at least 5 days a week to lose weight.' },
  { area: 'activity', text: 'Warm up for 5–10 minutes before activity and cool down for 5–10 minutes after.' },
  { area: 'activity', text: 'Limit sitting, TV and video games to no more than 2 hours a day.' },
  { area: 'activity', text: 'Aim for more than 7,500 steps a day: park a little further away and take the stairs.' },
  { area: 'sleep', text: 'Sleep 7–9 hours a day and avoid caffeine before bed.' },
  { area: 'habits', text: 'Weigh yourself once a week after you wake up, on the same day, with the same scale and clothes.' },
  { area: 'habits', text: 'Lose weight slowly and steadily: half a kilogram to one kilogram a week.' },
  { area: 'habits', text: 'Use less salt and add flavour with lemon and spices instead. Go easy on sauces, and use less oil and saturated fat when cooking.' },
];

export const SLEEP_TIPS = [
  'Adults are advised to sleep 7–8 hours a night; sleeping under 7 hours is linked with a higher BMI.',
  'Keep fixed sleep times every day.',
  'Avoid heavy meals before sleep.',
  'Make your room comfortable and quiet.',
  'Keep daytime naps short.',
  'Put screens away 30 minutes before sleep.',
];

/** Nutrition values for one exchange food portion: the sum of its group exchanges (null = not stated by MOH). */
export function exchangeNutrients(food) {
  const counts = food.counts ?? { [food.group]: 1 };
  const out = { kcal: 0, carbs: 0, protein: 0, fat: 0 };
  const stated = { kcal: true, carbs: true, protein: true, fat: true };
  for (const [g, n] of Object.entries(counts)) {
    const grp = EXCHANGE_GROUPS.find((x) => x.id === g);
    for (const k of Object.keys(out)) {
      if (grp[k] == null) stated[k] = stated[k] && false;
      else out[k] += grp[k] * n;
    }
  }
  // A macro MOH does not state for a group is treated as "not stated" only when no group in the food states it.
  for (const k of Object.keys(out)) if (!stated[k] && out[k] === 0) out[k] = null;
  return out;
}

/** The MOH plan whose calorie level is nearest to a target (ties go to the lower plan). */
export function nearestPlan(kcal) {
  if (!Number.isFinite(Number(kcal))) return null;
  return [...MOH_MEAL_PLANS].sort((a, b) => Math.abs(a.kcal - kcal) - Math.abs(b.kcal - kcal) || a.kcal - b.kcal)[0];
}
