// Sentences built with values (numbers, names, dates) cannot be looked up as exact
// text. Each pattern matches an English sentence and gives its Arabic template:
// $1, $2… are the captured parts; {t:$1} translates a captured part too.
//
// Most of these come from the domain layer (domain/engine.js, workflow.js,
// service.js, menu-admin.js, patient.js, indicators.js, accounts.js). The first
// matching pattern wins, so specific patterns are listed before general ones.
// Captured names (meals, ingredients, periods, portions, statuses) are looked up
// in the dictionary with {t:$n}; a list of several names stays as written.

/** Build an anchored pattern from raw text, so backslashes need no doubling. */
const re = (parts: TemplateStringsArray, ...subs: string[]) => new RegExp(`^${String.raw(parts, ...subs)}$`);

const PERIOD = '(breakfast|lunch|dinner|snack)';
const PORTION = '(small|regular|large)';
const NUM = '([\\d,.]+)';
const DATE = '(\\d{4}-\\d{2}-\\d{2})';
const SOURCE = '(MOH and SFDA salt guidance|MOH/SFDA default for this diet|diet order)';
const ALLERGEN = '(cereals containing gluten|crustaceans|molluscs|eggs|fish|peanuts|soy|milk|tree nuts|celery|mustard|sesame|lupin|sulphites)';
const STATUS = '(options offered|patient choice submitted|confirmed by nutrition team|prepared|delivered|on hold: needs review|cancelled)';

const out: [RegExp, string][] = [];
const add = (r: RegExp, ar: string) => out.push([r, ar]);

// ---------------------------------------------------------------- engine: nutrient limits per portion
for (const [en, ar] of [['Sodium', 'الصوديوم'], ['Potassium', 'البوتاسيوم'], ['Phosphorus', 'الفوسفور']]) {
  add(new RegExp(`^${en} ${NUM} mg in the ${PORTION} portion is above the ${PERIOD} limit of ${NUM} mg \\((\\d+)% of ${NUM} mg/day, ${SOURCE}\\)\\.( No permitted portion meets this limit\\.)?$`),
    `${ar} في الحصة بحجم {t:$2}: $1 ملجم، وهذا أعلى من حد {t:$3} البالغ $4 ملجم ($5% من $6 ملجم يوميًا، {t:$7}).{t:$8}`);
  add(new RegExp(`^${en} ${NUM} mg in the ${PORTION} portion is within the ${PERIOD} limit of ${NUM} mg \\((\\d+)% of ${NUM} mg/day, ${SOURCE}\\)\\.$`),
    `${ar} في الحصة بحجم {t:$2}: $1 ملجم، ضمن حد {t:$3} البالغ $4 ملجم ($5% من $6 ملجم يوميًا، {t:$7}).`);
}
add(re`Total carbohydrate ${NUM} g in the ${PORTION} portion is above the ${PERIOD} limit of ${NUM} g \(one-third of ${NUM} g per meal, diet order\)\.( No permitted portion meets this limit\.)?`,
  'إجمالي الكربوهيدرات في الحصة بحجم {t:$2}: $1 جم، وهذا أعلى من حد {t:$3} البالغ $4 جم (ثلث $5 جم لكل وجبة، الأمر الغذائي).{t:$6}');
add(re`Total carbohydrate ${NUM} g in the ${PORTION} portion is above the ${PERIOD} limit of ${NUM} g \(${NUM} g per meal, diet order\)\.( No permitted portion meets this limit\.)?`,
  'إجمالي الكربوهيدرات في الحصة بحجم {t:$2}: $1 جم، وهذا أعلى من حد {t:$3} البالغ $4 جم ($5 جم لكل وجبة، الأمر الغذائي).{t:$6}');
add(re`Total carbohydrate ${NUM} g in the ${PORTION} portion is within the ${PERIOD} limit of ${NUM} g \(one-third of ${NUM} g per meal, diet order\)\.`,
  'إجمالي الكربوهيدرات في الحصة بحجم {t:$2}: $1 جم، ضمن حد {t:$3} البالغ $4 جم (ثلث $5 جم لكل وجبة، الأمر الغذائي).');
add(re`Total carbohydrate ${NUM} g in the ${PORTION} portion is within the ${PERIOD} limit of ${NUM} g \(${NUM} g per meal, diet order\)\.`,
  'إجمالي الكربوهيدرات في الحصة بحجم {t:$2}: $1 جم، ضمن حد {t:$3} البالغ $4 جم ($5 جم لكل وجبة، الأمر الغذائي).');

// ---------------------------------------------------------------- engine: portion suggestion
for (const [en, ar] of [['Small', 'الصغيرة'], ['Regular', 'العادية'], ['Large', 'الكبيرة']]) {
  add(new RegExp(`^${en} portion suggested because a ${PORTION} portion (is not permitted by the diet order|is not offered for this meal|does not meet the diet limits)\\.$`),
    `نقترح الحصة ${ar} لأن الحصة بحجم {t:$1} {t:$2}.`);
  add(new RegExp(`^${en} portion suggested because (.+)\\.$`), `نقترح الحصة ${ar} لأن {t:$1}.`);
}

// ---------------------------------------------------------------- engine: exclusions, reviews, checks
add(re`Contains lactose \((.+)\)\. The patient has lactose intolerance\.`, 'يحتوي على اللاكتوز ({t:$1}). لدى المريض عدم تحمّل اللاكتوز.');
add(re`Contains gluten \((.+)\)\. The patient has gluten sensitivity\.`, 'يحتوي على الغلوتين ({t:$1}). لدى المريض حساسية الغلوتين.');
add(re`Contains added sugar \((.+)\)\. MOH advises people with diabetes not to add sugar to food\.`, 'يحتوي على سكر مضاف ({t:$1}). توصي وزارة الصحة مرضى السكري بعدم إضافة السكر إلى الطعام.');
add(re`Contains ${ALLERGEN} \((.+)\)\. The patient has a confirmed allergy to (.+)\.`, 'يحتوي على {t:$1} ({t:$2}). لدى المريض حساسية مؤكدة من {t:$3}.');
add(re`Contains (.+)\. The patient has a confirmed allergy to (.+)\.`, 'يحتوي على {t:$1}. لدى المريض حساسية مؤكدة من {t:$2}.');
add(re`Contains (.+)\. The patient has an intolerance to (.+)\.`, 'يحتوي على {t:$1}. لدى المريض عدم تحمّل لـ{t:$2}.');
add(re`Contains (.+), which the care team has excluded\.`, 'يحتوي على {t:$1}، وقد استبعده الفريق الطبي.');
add(re`Contains (.+), which the patient dislikes\.`, 'يحتوي على {t:$1}، وهو مما لا يحبه المريض.');
add(re`Contains none of the patient’s disliked ingredients \((.+)\)\.`, 'لا يحتوي على أي مكوّن لا يحبه المريض ({t:$1}).');
add(re`(.+) may contain (.+) through cross-contact or varying product formulations\. This cannot be ruled out with the available data\.`,
  '{t:$1} قد يحتوي على {t:$2} بسبب التلامس المتبادل أو اختلاف تركيبات المنتجات. لا يمكن استبعاد ذلك بالبيانات المتاحة.');
add(re`No ingredient lists (.+) and no (.+) cross-contact risk is recorded\.`, 'لا يوجد مكوّن يذكر {t:$1}، ولا يوجد خطر تلامس متبادل مسجّل مع {t:$2}.');
add(re`(.+) is not an ingredient\.`, '{t:$1} ليس من المكونات.');
add(re`Allergy “(.+)” could not be matched to the ingredient database, so this meal cannot be screened for it\.`, 'تعذّرت مطابقة الحساسية “$1” مع قاعدة بيانات المكونات، لذا لا يمكن فحص هذه الوجبة بالنسبة لها.');
add(re`Intolerance “(.+)” could not be matched to the ingredient database\.`, 'تعذّرت مطابقة عدم التحمّل “$1” مع قاعدة بيانات المكونات.');
add(re`The patient reported a possible allergy to (.+?) on ${DATE}, which an admin has not reviewed yet\. This meal contains or may contain (.+?) \((.+)\)\.`,
  'أبلغ المريض بتاريخ $2 عن حساسية محتملة من {t:$1}، ولم يراجعها المشرف بعد. هذه الوجبة تحتوي أو قد تحتوي على {t:$3} ({t:$4}).');
add(re`The patient reported a possible allergy to (.+?), which an admin has not reviewed yet\. This meal contains or may contain (.+?) \((.+)\)\.`,
  'أبلغ المريض عن حساسية محتملة من {t:$1}، ولم يراجعها المشرف بعد. هذه الوجبة تحتوي أو قد تحتوي على {t:$2} ({t:$3}).');
add(re`Not vegan: contains (.+)\.`, 'غير نباتي صرف: يحتوي على {t:$1}.');
add(re`Not vegetarian: contains (.+)\.`, 'غير نباتي: يحتوي على {t:$1}.');
add(re`Not gluten-free: contains (.+)\.`, 'غير خالٍ من الغلوتين: يحتوي على {t:$1}.');
add(re`Not lactose-free: contains (.+)\.`, 'غير خالٍ من اللاكتوز: يحتوي على {t:$1}.');
add(re`(.+) may carry gluten through cross-contact, which a coeliac gluten-free diet cannot accept\.`, '{t:$1} قد يحمل الغلوتين بسبب التلامس المتبادل، وهذا لا تقبله الحمية الخالية من الغلوتين لمرضى السيلياك.');
add(re`The dietary information for this meal \(ingredients, allergens or nutrition source\) was changed by (.+) and has not been verified by an admin yet\.`,
  'تغيّرت المعلومات الغذائية لهذه الوجبة (المكونات أو مسببات الحساسية أو مصدر القيم الغذائية) بواسطة $1، ولم يتحقق منها المشرف بعد.');
add(re`The dietary information for this meal \(ingredients, allergens or nutrition source\) was changed and has not been verified by an admin yet\.`,
  'تغيّرت المعلومات الغذائية لهذه الوجبة (المكونات أو مسببات الحساسية أو مصدر القيم الغذائية) ولم يتحقق منها المشرف بعد.');
add(re`Texture-modified diet \((.+)\)\. This menu item has no recorded IDDSI level, so the admin must confirm it can be prepared at this level\.`,
  'حمية معدّلة القوام ({t:$1}). هذا الصنف ليس له مستوى IDDSI مسجّل، لذا يجب أن يؤكد المشرف إمكانية تحضيره بهذا المستوى.');
add(re`The optional (.+) is left out by the kitchen\.`, 'يحذف المطبخ المكوّن الاختياري: {t:$1}.');
add(re`This meal is only available as (.+), which the diet order does not permit\.`, 'هذه الوجبة متاحة فقط بحجم {t:$1}، والأمر الغذائي لا يسمح بذلك.');
add(re`The (.+) cannot be checked: none of this meal’s dishes has nutrient values \(SFDA Saudi Food Composition Tables or calculated from ingredients\)\. Values are never estimated\.`,
  'لا يمكن فحص {t:$1}: لا يوجد طبق في هذه الوجبة له قيم غذائية (من جداول تركيب الأغذية السعودية أو محسوبة من المكونات). القيم لا تُقدَّر أبدًا.');
add(re`The (.+) cannot be checked: this dish has no nutrient values \(SFDA Saudi Food Composition Tables or calculated from ingredients\)\. Values are never estimated\.`,
  'لا يمكن فحص {t:$1}: هذا الطبق ليس له قيم غذائية (من جداول تركيب الأغذية السعودية أو محسوبة من المكونات). القيم لا تُقدَّر أبدًا.');
add(re`The (.+) cannot be checked: no value for (.+)\. Values are never estimated\.`, 'لا يمكن فحص {t:$1}: لا توجد قيمة لـ{t:$2}. القيم لا تُقدَّر أبدًا.');
add(re`(.+) provide (\d+)% of the meal’s energy, above the (\d+)% limit\.`, '{t:$1} توفّر $2% من طاقة الوجبة، وهذا أعلى من حد $3%.');
add(re`(.+) provide (\d+)% of the meal’s energy \(limit (\d+)%\)\.`, '{t:$1} توفّر $2% من طاقة الوجبة (الحد $3%).');

// ---------------------------------------------------------------- engine: ranking reasons
add(re`Matches the patient’s preferred cuisine: (.+)\.`, 'تناسب المطبخ الذي يفضّله المريض: {t:$1}.');
add(re`Includes foods the patient enjoys: (.+)\.`, 'تحتوي على أطعمة يحبها المريض: {t:$1}.');
add(re`Has an optional ingredient the patient dislikes \((.+)\); ask the kitchen to leave it out\.`, 'تحتوي على مكوّن اختياري لا يحبه المريض ({t:$1})؛ اطلب من المطبخ حذفه.');
add(re`Protein ${NUM} g in the ${PORTION} portion meets the ${NUM} g level preferred for this diet\.`, 'البروتين في الحصة بحجم {t:$2}: $1 جم، وهو يبلغ مستوى $3 جم المفضّل لهذه الحمية.');
add(re`High in fibre by SFDA’s definition: ${NUM} g per 100 kcal \(at least (\d+) g\)\.`, 'غنية بالألياف حسب تعريف الهيئة العامة للغذاء والدواء: $1 جم لكل 100 سعرة (على الأقل $2 جم).');
add(re`Lower in salt: ${NUM} mg sodium, within the ${PERIOD} share of the MOH and SFDA limit of 5 g salt \(2,000 mg sodium\) a day\.`,
  'أقل ملحًا: $1 ملجم صوديوم، ضمن حصة {t:$2} من حد وزارة الصحة والهيئة العامة للغذاء والدواء البالغ 5 جم ملح (2,000 ملجم صوديوم) يوميًا.');
add(re`The patient rated this meal (\d)/5 on ${DATE}\.`, 'قيّم المريض هذه الوجبة $1/5 بتاريخ $2.');
add(re`The patient refused this meal on ${DATE} \(did not like it\)\.`, 'رفض المريض هذه الوجبة بتاريخ $1 (لم تعجبه).');
add(re`The patient rated another (.+) meal highly\.`, 'قيّم المريض وجبة أخرى من المطبخ ال{t:$1} تقييمًا عاليًا.');

// ---------------------------------------------------------------- engine: kitchen instructions and warnings
add(re`Allergy: (.+)\. Prepare and plate separately\.`, 'حساسية: {t:$1}. حضّر الوجبة وقدّمها بشكل منفصل.');
add(re`Intolerance: (.+)\.`, 'عدم تحمّل: {t:$1}.');
add(re`No added sugar: leave out the optional (.+)\.`, 'بدون سكر مضاف: احذف المكوّن الاختياري ({t:$1}).');
add(re`Check labels of: (.+)\.`, 'تحقق من ملصقات: {t:$1}.');
add(re`Packaged ingredients vary by brand\. The kitchen will check the labels of: (.+)\.`, 'المكونات المعبأة تختلف حسب العلامة التجارية. سيتحقق المطبخ من ملصقات: {t:$1}.');
add(re`Use vegetarian-labelled cheese \((.+)\)\.`, 'استخدم جبنًا موسومًا بأنه نباتي ({t:$1}).');
add(re`Leave out the optional (.+)\.`, 'احذف المكوّن الاختياري ({t:$1}).');
add(re`Prepare to (.+)\.`, 'حضّرها وفق {t:$1}.');
add(re`Nutrition totals leave out (.+), which (?:has|have) no nutrient values\. They are not estimated\.`, 'لا تشمل المجاميع الغذائية {t:$1}، لعدم توفر قيم غذائية له. ولا تُقدَّر هذه القيم.');
add(re`The source values do not report (.+); these are not estimated\.`, 'لا تذكر قيم المصدر {t:$1}؛ ولا تُقدَّر هذه القيم.');
add(re`may contain (.+)`, 'قد يحتوي على {t:$1}');
add(re`contains (.+)`, 'يحتوي على {t:$1}');

// ---------------------------------------------------------------- nutrition and catalogue
add(re`(.+) \(no SFCT values\)`, '{t:$1} (لا توجد قيم في جداول تركيب الأغذية السعودية)');
add(re`(.+) \(not reported by the SFCT\)`, '{t:$1} (غير مذكور في جداول تركيب الأغذية السعودية)');
add(re`(.+) \(no USDA value for (.+)\)`, '{t:$1} (لا توجد قيمة USDA لـ{t:$2})');
add(re`(\d+) items, about ${NUM} g`, '$1 أصناف، نحو $2 جم');
add(re`${NUM} kg`, '$1 كجم');
add(re`Prepared to the SFDA Saudi Food Composition Tables standard recipe for (.+) \((.+) region\)\.`, 'محضّر وفق الوصفة القياسية في جداول تركيب الأغذية السعودية لطبق “{t:$1}” (منطقة {t:$2}).');

// ---------------------------------------------------------------- workflow: problems found on re-screening
add(re`(.+?) was marked unavailable by the kitchen \((.+)\)`, '{t:$1}: غير متوفرة حسب المطبخ ($2)');
add(re`(.+?) was marked unavailable by the kitchen`, '{t:$1}: غير متوفرة حسب المطبخ');
add(re`(.+?) was removed from the ${PERIOD} menu for ${DATE}`, '{t:$1}: أُزيلت من قائمة {t:$2} ليوم $3');
add(re`(.+?) no longer passes screening: (.+)`, '{t:$1}: لم تعد تجتاز الفحص: {t:$2}');
add(re`(.+?) now needs admin review: (.+)`, '{t:$1}: أصبحت تحتاج مراجعة المشرف: {t:$2}');
add(re`(.+?) can no longer be served as a ${PORTION} portion \(permitted: (.+)\)`, '{t:$1}: لم يعد ممكنًا تقديمها بحجم {t:$2} (المسموح: {t:$3})');
add(re`(.+?) is no longer on the hospital menu`, '{t:$1}: لم تعد في قائمة المستشفى');
add(re`Re-screened upcoming meals after a change \((.+)\): (\d+) meal periods? affected, (\d+) put on hold\.`, 'أُعيد فحص الوجبات القادمة بعد تغيير ({t:$1}): فترات الوجبات المتأثرة: $2، والمعلّقة: $3.');
add(re`Screening before preparation found a problem`, 'وجد الفحص قبل التجهيز مشكلة');
add(re`Screening before delivery found a problem`, 'وجد الفحص قبل التسليم مشكلة');

// ---------------------------------------------------------------- workflow: kitchen alerts
add(re`STOP: do not deliver (.+)\. It is on hold for the nutrition team\.`, 'توقّف: لا تسلّم {t:$1}. الوجبة معلّقة لدى فريق التغذية.');
add(re`STOP: do not prepare (.+)\. It is on hold for the nutrition team\.`, 'توقّف: لا تجهّز {t:$1}. الوجبة معلّقة لدى فريق التغذية.');
add(re`Cancelled: do not deliver (.+)\. The patient was discharged\.`, 'ملغاة: لا تسلّم {t:$1}. غادر المريض المستشفى.');
add(re`Cancelled: do not prepare (.+)\. The patient was discharged\.`, 'ملغاة: لا تجهّز {t:$1}. غادر المريض المستشفى.');
add(re`Cancelled: do not deliver (.+)\.`, 'ملغاة: لا تسلّم {t:$1}.');
add(re`Cancelled: do not prepare (.+)\.`, 'ملغاة: لا تجهّز {t:$1}.');
add(re`(.+) is cancelled\. New options were offered; a new order will follow once confirmed\.`, 'أُلغيت {t:$1}. عُرضت خيارات جديدة، وسيصل طلب جديد بعد التأكيد.');
add(re`Replaced: prepare (.+) \(${PORTION}\) instead of (.+?)\. (.+) was already prepared: do not deliver it\.`, 'استبدال: جهّز {t:$1} (بحجم {t:$2}) بدلًا من {t:$3}. {t:$4} مجهّزة مسبقًا: لا تسلّمها.');
add(re`Replaced: prepare (.+) \(${PORTION}\) instead of (.+)\.`, 'استبدال: جهّز {t:$1} (بحجم {t:$2}) بدلًا من {t:$3}.');
add(re`Continue: (.+) was reviewed and kept \((.+)\)\.`, 'تابع: رُوجعت {t:$1} وأُبقيت ({t:$2}).');

// ---------------------------------------------------------------- workflow: offers, choices, confirmations
add(re`Cancelled ${PERIOD} on ${DATE} \((.+)\): (.+)\.`, 'أُلغيت فترة {t:$1} بتاريخ $2 ({t:$3}): $4.');
add(re`Cancelled ${PERIOD} on ${DATE}: (.+)\.`, 'أُلغيت فترة {t:$1} بتاريخ $2: $3.');
add(re`Cancelled: (.+)`, 'أُلغيت: {t:$1}');
add(re`Released: the reported allergy was reviewed by (.+) \(request (resolved|declined|open)\) and the meal passes screening\.`, 'أُفرج عنها: راجع $1 الحساسية المُبلَّغ عنها (الطلب: {t:$2}) والوجبة تجتاز الفحص.');
add(re`Released (\d+) meal periods? held for the reported allergy\.`, 'أُفرج عن فترات الوجبات المعلّقة بسبب الحساسية المُبلَّغ عنها: $1.');
add(re`(.+) is marked unavailable by the kitchen \((.+)\)\.`, '{t:$1} غير متوفرة حسب المطبخ ($2).');
add(re`(.+) is marked unavailable by the kitchen\.`, '{t:$1} غير متوفرة حسب المطبخ.');
add(re`(.+) is not on the ${PERIOD} menu for ${DATE}\.`, '{t:$1} ليست في قائمة {t:$2} ليوم $3.');
add(re`(.+) cannot be offered: it conflicts with the patient’s diet order, allergies or restrictions\.`, 'لا يمكن عرض {t:$1}: تتعارض مع الأمر الغذائي للمريض أو حساسيته أو قيوده.');
add(re`(.+) needs admin review before it can be offered or confirmed\.`, '{t:$1} تحتاج مراجعة المشرف قبل عرضها أو تأكيدها.');
add(re`Add a review note for (.+) explaining why it is suitable\.`, 'أضف ملاحظة مراجعة لـ{t:$1} توضح لماذا هي مناسبة.');
add(re`This ${PERIOD} is already ${STATUS}\. Use “Replace meal” to change it\.`, 'حالة {t:$1} الآن: {t:$2}. لتغييرها استخدم “استبدل الوجبة”.');
add(re`This ${PERIOD} is already ${STATUS}\. To change it, ask for a different meal\.`, 'حالة {t:$1} الآن: {t:$2}. لتغييرها، اطلب وجبة أخرى.');
add(re`New options offered: (.+)\.`, 'عُرضت خيارات جديدة: {t:$1}.');
add(re`New options were offered: (.+)\.`, 'عُرضت خيارات جديدة: {t:$1}.');
add(re`Offered (\d+) options? for ${PERIOD} on ${DATE}: (.+)\.`, 'عُرض $1 من الخيارات لفترة {t:$2} بتاريخ $3: {t:$4}.');
add(re`(\d+) options? needs? admin review; none were offered automatically\.`, 'خيارات تحتاج مراجعة المشرف: $1؛ ولم يُعرض أي منها تلقائيًا.');
add(re`(.+) \(top eligible options\)`, '{t:$1} (أفضل الخيارات المناسبة)');
add(re`Offered the top eligible options for (\d+) meal periods? from ${DATE}; (\d+) flagged for the team\.`, 'عُرضت أفضل الخيارات المناسبة لـ$1 من فترات الوجبات ابتداءً من $2؛ ونُبّه الفريق إلى $3.');
add(re`Offered the top eligible options for (\d+) meal periods? from ${DATE}\.`, 'عُرضت أفضل الخيارات المناسبة لـ$1 من فترات الوجبات ابتداءً من $2.');
add(re`A ${PORTION} portion is not available for this meal and diet order\. Choose (.+)\.`, 'الحصة بحجم {t:$1} غير متاحة لهذه الوجبة والأمر الغذائي. اختر {t:$2}.');
add(re`(.+) no longer passes screening and cannot be chosen\.`, '{t:$1} لم تعد تجتاز الفحص ولا يمكن اختيارها.');
add(re`(.+) now needs admin review before it can be chosen\.`, '{t:$1} أصبحت تحتاج مراجعة المشرف قبل اختيارها.');
add(re`Patient chose (.+) \(${PORTION}\) for ${PERIOD} on ${DATE}\.`, 'اختار المريض {t:$1} (بحجم {t:$2}) لفترة {t:$3} بتاريخ $4.');
add(re`Recorded the patient’s choice: (.+) \(${PORTION}\) for ${PERIOD} on ${DATE}\.`, 'سُجّل اختيار المريض: {t:$1} (بحجم {t:$2}) لفترة {t:$3} بتاريخ $4.');
add(re`Replaced with (.+) \(${PORTION}\): (.+)`, 'استُبدلت بـ{t:$1} (بحجم {t:$2}): $3');
add(re`Replaced with (.+) \(${PORTION}\)`, 'استُبدلت بـ{t:$1} (بحجم {t:$2})');
add(re`Replaced (.+?) with (.+?): (.+)`, 'استُبدلت {t:$1} بـ{t:$2}: $3');
add(re`Replaced (.+) with (.+)`, 'استُبدلت {t:$1} بـ{t:$2}');
for (const [suffixEn, suffixAr] of [[' directly after admin review', ' مباشرة بعد مراجعة المشرف'], [' directly', ' مباشرة'], [' after admin review', ' بعد مراجعة المشرف'], ['', '']]) {
  add(new RegExp(`^Replaced and confirmed (.+) \\(${PORTION}\\) for ${PERIOD} on ${DATE}${suffixEn}\\.$`), `استُبدلت وأُكّدت {t:$1} (بحجم {t:$2}) لفترة {t:$3} بتاريخ $4${suffixAr}.`);
  add(new RegExp(`^Confirmed (.+) \\(${PORTION}\\) for ${PERIOD} on ${DATE}${suffixEn}\\.$`), `أُكّدت {t:$1} (بحجم {t:$2}) لفترة {t:$3} بتاريخ $4${suffixAr}.`);
}
add(re`Confirmed (.+)\.`, 'أُكّدت {t:$1}.');
add(re`Kept after admin review: (.+)`, 'أُبقيت بعد مراجعة المشرف: $1');
add(re`Kept: (.+) passes screening again \((.+)\)\.`, 'أُبقيت: {t:$1} تجتاز الفحص من جديد ($2).');
add(re`Kept: (.+) passes screening again\.`, 'أُبقيت: {t:$1} تجتاز الفحص من جديد.');
add(re`Kept the held meal for ${PERIOD} on ${DATE}: (.+)\.`, 'أُبقيت الوجبة المعلّقة لفترة {t:$1} بتاريخ $2: $3.');
add(re`Kept the held meal for ${PERIOD} on ${DATE}\.`, 'أُبقيت الوجبة المعلّقة لفترة {t:$1} بتاريخ $2.');
add(re`Marked changes as reviewed for ${PERIOD} on ${DATE}: (.+)\.`, 'سُجّلت مراجعة التغييرات لفترة {t:$1} بتاريخ $2: $3.');
add(re`Marked changes as reviewed for ${PERIOD} on ${DATE}\.`, 'سُجّلت مراجعة التغييرات لفترة {t:$1} بتاريخ $2.');
add(re`Only confirmed meals can be marked prepared \(this one is: (.+)\)\.`, 'لا يُسجَّل التجهيز إلا للوجبات المؤكدة (حالة هذه الوجبة: {t:$1}).');
add(re`Mark the meal as prepared before it is delivered \(this one is: (.+)\)\.`, 'سجّل تجهيز الوجبة قبل التسليم (حالة هذه الوجبة: {t:$1}).');
add(re`(.+) \(${PORTION}\) for ${PERIOD} on ${DATE} marked prepared\.`, '{t:$1} (بحجم {t:$2}) لفترة {t:$3} بتاريخ $4: سُجّلت مجهّزة.');
add(re`(.+) \(${PORTION}\) for ${PERIOD} on ${DATE} marked delivered\.`, '{t:$1} (بحجم {t:$2}) لفترة {t:$3} بتاريخ $4: سُجّلت مسلّمة.');
add(re`Back to ${STATUS}`, 'أُعيدت إلى: {t:$1}');
add(re`Undid “(.+)” for ${PERIOD} on ${DATE}\.`, 'تم التراجع عن “{t:$1}” لفترة {t:$2} بتاريخ $3.');
add(re`Already acknowledged by (.+)\.`, 'سبق أن أكّد $1 الاستلام.');
add(re`This meal was cancelled: (.+)`, 'أُلغيت هذه الوجبة: {t:$1}');
add(re`Admin review note: (.+)`, 'ملاحظة مراجعة المشرف: $1');
add(re`Diet order note: (.+)`, 'ملاحظة الأمر الغذائي: $1');

// ---------------------------------------------------------------- service: patients, flags, profile changes
add(re`(.+) was discharged on ${DATE}\. (.+) can no longer be planned\. Readmit the patient first if they are back on the ward\.`, 'غادر $1 المستشفى بتاريخ $2. لم يعد ممكنًا تخطيط {t:$3}. إذا عاد المريض إلى الجناح فأعد تنويمه أولًا.');
add(re`(.+) was discharged\. (.+) can no longer be planned\. Readmit the patient first if they are back on the ward\.`, 'غادر $1 المستشفى. لم يعد ممكنًا تخطيط {t:$2}. إذا عاد المريض إلى الجناح فأعد تنويمه أولًا.');
add(re`(.+) is too far in the past\.`, '{t:$1}: التاريخ قديم جدًا.');
add(re`(.+) is too far ahead\.`, '{t:$1}: التاريخ بعيد جدًا.');
add(re`(.+) \(not coded\)`, '{t:$1} (غير مرمّز)');
add(re`No meal on the menu passes screening for (.+)\.`, 'لا توجد وجبة في القائمة تجتاز الفحص لـ{t:$1}.');
add(re`Options for (.+) need admin review\.`, 'خيارات {t:$1} تحتاج مراجعة المشرف.');
add(re`(\d+) meals? on hold`, 'وجبات معلّقة: $1');
add(re`(\d+) pending requests?`, 'طلبات معلّقة: $1');
add(re`Created the nutrition profile for (.+) and admitted the patient\.`, 'أُنشئ ملف التغذية لـ$1 وسُجّل تنويم المريض.');
add(re`Diet added: (.+)`, 'أُضيفت حمية: {t:$1}');
add(re`Diet removed: (.+)`, 'أُزيلت حمية: {t:$1}');
add(re`Texture level: (.+)`, 'مستوى القوام: {t:$1}');
add(re`(Sodium|Potassium|Phosphorus|Carbohydrate) limit: not set`, 'حد {t:$1}: غير محدد');
add(re`(Sodium|Potassium|Phosphorus|Carbohydrate) limit: ${NUM} (mg per day|g per meal)`, 'حد {t:$1}: $2 {t:$3}');
add(re`Permitted portions: (.+)`, 'الحصص المسموح بها: {t:$1}');
add(re`Allergy added: (.+)`, 'أُضيفت حساسية: {t:$1}');
add(re`Allergy removed: (.+)`, 'أُزيلت حساسية: {t:$1}');
add(re`Ingredient allergy added: (.+)`, 'أُضيفت حساسية من مكوّن: {t:$1}');
add(re`Ingredient allergy removed: (.+)`, 'أُزيلت حساسية من مكوّن: {t:$1}');
add(re`Allergy status: (.+)`, 'حالة الحساسية: {t:$1}');
add(re`Uncoded allergy noted: (.+)`, 'سُجّلت حساسية غير مرمّزة: $1');
add(re`Intolerance added: (.+)`, 'أُضيف عدم تحمّل: {t:$1}');
add(re`Intolerance removed: (.+)`, 'أُزيل عدم تحمّل: {t:$1}');
add(re`Excluded by the care team: (.+)`, 'استبعده الفريق الطبي: {t:$1}');
add(re`Exclusion removed: (.+)`, 'أُزيل الاستبعاد: {t:$1}');
add(re`Updated (patient details|diet order, allergies and restrictions|food preferences)( \(by the patient\))?: (.+)\.`, 'حُدّثت {t:$1}{t:$2}: {t:$3}.');
add(re`Updated (patient details|diet order, allergies and restrictions|food preferences)( \(by the patient\))?\.`, 'حُدّثت {t:$1}{t:$2}.');
add(re`(.+) is already recorded as discharged\.`, 'خروج $1 من المستشفى مسجّل بالفعل.');
add(re`Patient discharged on ${DATE} \((.+)\)\.`, 'غادر المريض المستشفى بتاريخ $1 ($2).');
add(re`Patient discharged on ${DATE}\.`, 'غادر المريض المستشفى بتاريخ $1.');
add(re`Closed because you were discharged on ${DATE}\.`, 'أُغلق لأنك غادرت المستشفى بتاريخ $1.');
add(re`(.+) is already admitted\.`, '$1 منوّم بالفعل.');
add(re`Readmitted to (.+), bed (.+)\. An admin should review the diet order and allergies before meals are planned\.`, 'أُعيد تنويمه في {t:$1}، سرير $2. يجب أن يراجع المشرف الأمر الغذائي والحساسية قبل تخطيط الوجبات.');
add(re`Type (.+) to confirm the permanent deletion\.`, 'اكتب $1 لتأكيد الحذف النهائي.');
add(re`Type (.+) exactly\.`, 'اكتب $1 بالضبط.');
add(re`Permanently deleted the record (.+) with its meals, intake records and requests\.`, 'حُذف السجل $1 نهائيًا مع وجباته وسجلات الأكل وطلباته.');
add(re`Personal account @(.+) linked to this profile\.`, 'رُبط الحساب الشخصي @$1 بهذا الملف.');
add(re`Removed the link to (\d+) personal accounts?\. The account itself and the hospital record are kept\.`, 'أُزيل الربط مع الحسابات الشخصية ($1). الحساب نفسه وسجل المستشفى محفوظان.');
for (const [wasteEn, wasteAr] of [['; ([\\d,.]+) g weighed waste', '؛ الهدر الموزون $W جم'], ['', '']]) {
  for (const [appEn, appAr] of [['; current appetite updated', '؛ وحُدّثت الشهية الحالية'], ['', '']]) {
    const tail = `${wasteEn}${appEn}\\.$`;
    add(new RegExp(`^(Staff observation|Provider observation|Patient report) for ${PERIOD} on ${DATE}: accepted, (.+) eaten${tail}`), `{t:$1} لفترة {t:$2} بتاريخ $3: مقبولة، الكمية المأكولة: {t:$4}${wasteAr.replace('$W', '$5')}${appAr}.`);
    add(new RegExp(`^(Staff observation|Provider observation|Patient report) for ${PERIOD} on ${DATE}: refused${tail}`), `{t:$1} لفترة {t:$2} بتاريخ $3: مرفوضة${wasteAr.replace('$W', '$4')}${appAr}.`);
  }
}
add(re`Recorded discharge on ${DATE} \((.+)\)\. Past meals, intake and requests are kept\.`, 'سُجّل الخروج بتاريخ $1 ($2). الوجبات السابقة وكميات الأكل والطلبات محفوظة.');
add(re`Recorded discharge on ${DATE}( \(.+\))?\. (\d+) upcoming meal periods? (?:was|were) cancelled; (\d+) pending requests? closed\. Past meals, intake and requests are kept\.`, 'سُجّل الخروج بتاريخ $1$2. فترات الوجبات القادمة الملغاة: $3، والطلبات المعلّقة المقفلة: $4. الوجبات السابقة وكميات الأكل والطلبات محفوظة.');
add(re`Recorded discharge on ${DATE}( \(.+\))?\. (\d+) upcoming meal periods? (?:was|were) cancelled\. Past meals, intake and requests are kept\.`, 'سُجّل الخروج بتاريخ $1$2. فترات الوجبات القادمة الملغاة: $3. الوجبات السابقة وكميات الأكل والطلبات محفوظة.');
add(re`accepted, (.+) eaten`, 'مقبولة، الكمية المأكولة: {t:$1}');
add(re`(.+) has been discharged\.`, '$1 غادر المستشفى.');

// ---------------------------------------------------------------- service: requests
const REQ = '(Ask for a different meal|Ask to change my meal schedule|Ask the nutrition team for help|Report a change to my allergies or diet)';
add(new RegExp(`^${REQ} \\(possible (.+) allergy\\)( \\(from the patient\\))?\\.$`), '{t:$1} (حساسية محتملة من {t:$2}){t:$3}.');
add(new RegExp(`^${REQ}( \\(from the patient\\))?\\.$`), '{t:$1}{t:$2}.');
add(re`Patient reported a possible (.+) allergy \(pending admin review\)`, 'أبلغ المريض عن حساسية محتملة من {t:$1} (بانتظار مراجعة المشرف)');
add(re`This request was already resolved by (.+)\.`, 'سبق أن عالج $1 هذا الطلب.');
add(re`This request was already declined by (.+)\.`, 'سبق أن رفض $1 هذا الطلب.');
add(new RegExp(`^Resolved: ${REQ}\\.$`), 'تمت المعالجة: {t:$1}.');
add(new RegExp(`^Declined: ${REQ}\\.$`), 'مرفوض: {t:$1}.');

// ---------------------------------------------------------------- service and accounts: staff access
add(re`Approved staff access for @(\S+) as (.+)\.`, 'تمت الموافقة على صلاحية الموظف @$1 بدور {t:$2}.');
add(re`Changed @(\S+) from (.+) to (.+)\.`, 'تغيّر دور @$1 من {t:$2} إلى {t:$3}.');
add(re`Declined staff access for @(\S+)\.`, 'رُفض طلب صلاحية @$1.');
add(re`Deactivated @(\S+)\.`, 'تم إيقاف @$1.');
add(re`Reactivated @(\S+)\.`, 'تمت إعادة تفعيل @$1.');
add(re`@(\S+) asked for staff access as (.+)\.`, 'طلب @$1 صلاحية موظف بدور {t:$2}.');
add(re`Approved provider access for @(\S+) as (.+)\.`, 'تمت الموافقة على صلاحية مقدّم الرعاية @$1 بدور {t:$2}.');
add(re`Declined provider access for @(\S+)\.`, 'رُفض طلب صلاحية @$1.');
add(re`@(\S+) asked for provider access as (.+)\.`, 'طلب @$1 صلاحية مقدّم رعاية بدور {t:$2}.');

// ---------------------------------------------------------------- care team (domain/care-service.js)
add(re`Added (.+) to the care team\.`, 'أُضيف $1 إلى فريق الرعاية.');
add(re`Removed (.+) from the care team\.`, 'أُزيل $1 من فريق الرعاية.');
add(re`(.+) is already on this care team\.`, '$1 موجود بالفعل في فريق الرعاية هذا.');
add(re`Updated the healthcare provider profile of (.+) \((.+)\)\.`, 'حُدّث ملف مقدّم الرعاية الصحية $1 ({t:$2}).');
add(re`Updated the healthcare provider profile of (.+)\.`, 'حُدّث ملف مقدّم الرعاية الصحية $1.');
add(re`Set goals: (.+)\.`, 'حُدّدت الأهداف: {t:$1}.');
add(re`(target weight|daily steps|water|daily calories|daily carbs|fasting blood sugar, highest|blood pressure, upper number, highest|blood pressure, lower number, highest) ([\d.,]+) (kg|steps|cups|kcal|g|mg/dL|mmHg)`, '{t:$1} $2 {t:$3}');
add(re`Keep the bio to (\d+) characters or fewer\.`, 'اجعل النبذة $1 حرفًا أو أقل.');
add(re`Keep the note to (\d+) characters or fewer\.`, 'اجعل الملاحظة $1 حرفًا أو أقل.');
add(re`Keep the message to (\d+) characters or fewer\.`, 'اجعل الرسالة $1 حرفًا أو أقل.');

// ---------------------------------------------------------------- menu management
add(re`Ingredient (.+) allergen or diet data changed`, 'تغيّرت بيانات الحساسية أو الحمية للمكوّن {t:$1}');
add(re`Allergen or diet data of (.+) changed`, 'تغيّرت بيانات الحساسية أو الحمية لـ{t:$1}');
add(re`Updated ingredient (.+); (\d+) meals? need verification\.`, 'حُدّث المكوّن {t:$1}؛ الوجبات التي تحتاج تحققًا: $2.');
add(re`Added ingredient (.+); (\d+) meals? need verification\.`, 'أُضيف المكوّن {t:$1}؛ الوجبات التي تحتاج تحققًا: $2.');
add(re`Updated ingredient (.+)\.`, 'حُدّث المكوّن {t:$1}.');
add(re`Added ingredient (.+)\.`, 'أُضيف المكوّن {t:$1}.');
add(re`Dish (.+) changed \(ingredients, portion or nutrition source\)`, 'تغيّر الطبق {t:$1} (المكونات أو الحصة أو مصدر القيم الغذائية)');
add(re`Dish (.+) changed`, 'تغيّر الطبق {t:$1}');
add(re`Updated dish (.+) \(version (\d+)\), nutrition from SFCT “(.+)”\.`, 'حُدّث الطبق {t:$1} (الإصدار $2)، والقيم الغذائية من جداول تركيب الأغذية السعودية “{t:$3}”.');
add(re`Added dish (.+) \(version (\d+)\), nutrition from SFCT “(.+)”\.`, 'أُضيف الطبق {t:$1} (الإصدار $2)، والقيم الغذائية من جداول تركيب الأغذية السعودية “{t:$3}”.');
add(re`Updated dish (.+) \(version (\d+)\), no SFCT nutrition link\.`, 'حُدّث الطبق {t:$1} (الإصدار $2)، بدون ربط بقيم جداول تركيب الأغذية السعودية.');
add(re`Added dish (.+) \(version (\d+)\), no SFCT nutrition link\.`, 'أُضيف الطبق {t:$1} (الإصدار $2)، بدون ربط بقيم جداول تركيب الأغذية السعودية.');
add(re`Meal (.+) changed \(components or portions\)`, 'تغيّرت الوجبة {t:$1} (المكونات أو الحصص)');
add(re`Updated meal (.+) \(version (\d+), complete meal of (\d+) dishes\); dietary information (verified|pending admin verification)\.`, 'حُدّثت الوجبة {t:$1} (الإصدار $2، وجبة كاملة من $3 أطباق)؛ المعلومات الغذائية: {t:$4}.');
add(re`Added meal (.+) \(version (\d+), complete meal of (\d+) dishes\); dietary information (verified|pending admin verification)\.`, 'أُضيفت الوجبة {t:$1} (الإصدار $2، وجبة كاملة من $3 أطباق)؛ المعلومات الغذائية: {t:$4}.');
add(re`Updated meal (.+) \(version (\d+), individual dish\); dietary information (verified|pending admin verification)\.`, 'حُدّثت الوجبة {t:$1} (الإصدار $2، طبق مفرد)؛ المعلومات الغذائية: {t:$3}.');
add(re`Added meal (.+) \(version (\d+), individual dish\); dietary information (verified|pending admin verification)\.`, 'أُضيفت الوجبة {t:$1} (الإصدار $2، طبق مفرد)؛ المعلومات الغذائية: {t:$3}.');
add(re`(.+) is already available\.`, '{t:$1} متوفرة بالفعل.');
add(re`(.+) is already unavailable\.`, '{t:$1} غير متوفرة بالفعل.');
add(re`(.+) is already verified\.`, 'سبق التحقق من {t:$1}.');
add(re`(.+) marked unavailable: (.+)`, '{t:$1} أصبحت غير متوفرة: $2');
add(re`Verified the dietary information of (.+): (.+)\.`, 'تم التحقق من المعلومات الغذائية لـ{t:$1}: $2.');
add(re`(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) ${PERIOD} in the 7-day cycle`, '{t:$2} يوم {t:$1} في دورة الأيام السبعة');
add(re`${PERIOD} on ${DATE} \(back to the cycle\)`, '{t:$1} بتاريخ $2 (عودة إلى الدورة)');
add(re`${PERIOD} on ${DATE}`, '{t:$1} بتاريخ $2');
add(re`Menu changed: (.+)`, 'تغيّرت القائمة: {t:$1}');

// ---------------------------------------------------------------- patient profile
add(re`(.+) must be between (\d+) and (\d+) (mg per day|g per meal)\.`, 'يجب أن يكون {t:$1} بين $2 و$3 {t:$4}.');
add(re`(.+) conflicts with a recorded allergy or restriction, so it will always be excluded even though it is a favourite\.`, '{t:$1} يتعارض مع حساسية أو قيد مسجّل، لذا سيُستبعد دائمًا حتى لو كان مفضّلًا.');
add(re`Discharged on ${DATE}\. No meals are planned; past records are kept read-only\.`, 'غادر المستشفى بتاريخ $1. لا توجد وجبات مخططة؛ والسجلات السابقة محفوظة للاطلاع فقط.');
add(re`The patient reported a possible (.+) allergy on ${DATE}\. Meals containing it need admin review until the report is resolved\.`, 'أبلغ المريض بتاريخ $2 عن حساسية محتملة من {t:$1}. الوجبات التي تحتوي عليه تحتاج مراجعة المشرف حتى يُحسم البلاغ.');
add(re`The patient reported a possible (.+) allergy\. Meals containing it need admin review until the report is resolved\.`, 'أبلغ المريض عن حساسية محتملة من {t:$1}. الوجبات التي تحتوي عليه تحتاج مراجعة المشرف حتى يُحسم البلاغ.');
add(re`Allergy recorded as free text \((.+)\) cannot be screened automatically\.`, 'الحساسية المسجّلة كنص حر ($1) لا يمكن فحصها تلقائيًا.');
add(re`Intolerance recorded as free text \((.+)\) cannot be screened automatically\.`, 'عدم التحمّل المسجّل كنص حر ($1) لا يمكن فحصه تلقائيًا.');
add(re`Texture-modified diet \((.+)\): menu items need admin review and kitchen preparation at this level\.`, 'حمية معدّلة القوام ({t:$1}): أصناف القائمة تحتاج مراجعة المشرف وتحضيرًا في المطبخ بهذا المستوى.');
add(re`(.+) is no longer offered\. (.+)`, '{t:$1} لم يعد متاحًا. {t:$2}');

// ---------------------------------------------------------------- intake indicators
add(re`(\d+) of the last (\d+) recorded meals were refused\.`, 'رُفضت $1 من آخر $2 وجبات مسجّلة.');
add(re`(\d+) of the last (\d+) recorded meals were recorded as none or some eaten\.`, '$1 من آخر $2 وجبات مسجّلة سُجّلت بأنه لم يُؤكل منها شيء أو أُكل القليل.');

// ---------------------------------------------------------------- portions, nutrition method, change notes
add(re`it matches (?:the patient’s|your) preferred ${PORTION} portion`, 'تناسب حصتك المفضّلة ({t:$1})');
add(re`(?:the patient’s|your) appetite is reduced`, 'الشهية قليلة');
add(re`Laboratory-analysed values from the SFDA Saudi Food Composition Tables for (.+?); values calculated from recipe ingredients with USDA FoodData Central data for (.+) \(not laboratory-analysed\)\. Values are added across the components\.`,
  'قيم محلّلة مخبريًا من جداول تركيب الأغذية السعودية الصادرة عن الهيئة العامة للغذاء والدواء لـ{t:$1}، وقيم محسوبة من مكونات الوصفة ببيانات USDA FoodData Central لـ{t:$2} (ليست محلّلة مخبريًا). تُجمع القيم لكل مكونات الوجبة.');
add(re`Values calculated from recipe ingredients with USDA FoodData Central data for (.+) \(not laboratory-analysed\)\. Values are added across the components\.`,
  'قيم محسوبة من مكونات الوصفة ببيانات USDA FoodData Central لـ{t:$1} (ليست محلّلة مخبريًا). تُجمع القيم لكل مكونات الوجبة.');
add(re`Values calculated from recipe ingredients with USDA FoodData Central data \(not laboratory-analysed\)\.`,
  'قيم محسوبة من مكونات الوصفة ببيانات USDA FoodData Central (ليست محلّلة مخبريًا).');
add(re`values calculated from recipe ingredients with USDA FoodData Central data for (.+) \(not laboratory-analysed\)`,
  'قيم محسوبة من مكونات الوصفة ببيانات USDA FoodData Central لـ{t:$1} (ليست محلّلة مخبريًا)');
add(re`Laboratory-analysed values from the SFDA Saudi Food Composition Tables for (.+)\. Values are added across the components\.`, 'قيم محلّلة مخبريًا من جداول تركيب الأغذية السعودية الصادرة عن الهيئة العامة للغذاء والدواء لـ {t:$1}. تُجمع القيم لكل مكونات الوجبة.');
add(re`Laboratory-analysed values from the SFDA Saudi Food Composition Tables for (.+)\.`, 'قيم محلّلة مخبريًا من جداول تركيب الأغذية السعودية الصادرة عن الهيئة العامة للغذاء والدواء لـ {t:$1}.');
add(re`(.+) marked unavailable \((.+)\)`, '{t:$1}: أصبحت غير متوفرة ($2)');
add(re`(.+) marked unavailable`, '{t:$1}: أصبحت غير متوفرة');

// ---------------------------------------------------------------- care team: goal ranges ("Enter 30–300 kg.")
add(re`Enter ([\d,.]+)–([\d,.]+) (kg|steps|cups|kcal|g|mg/dL|mmHg)\.`, 'أدخل من $1 إلى $2 {t:$3}.');

// ---------------------------------------------------------------- last: short generic forms
add(re`(.+) allergy`, 'حساسية {t:$1}');

export const PATTERNS: [RegExp, string][] = out;
