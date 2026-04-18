/**
 * seed-blog-settings.mjs
 * Creates 10 blog posts + site settings + hero quote
 */
import { createRequire } from "module";
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// ─── Blog Posts ───────────────────────────────────────────────────────────────
const POSTS = [
  {
    slug: "photography-as-a-language",
    titleAr: "التصوير لغة لا تحتاج ترجمة",
    titleEn: "Photography: A Language That Needs No Translation",
    contentAr: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "حين تتكلم الصورة" }] },
        { type: "paragraph", content: [{ type: "text", text: "منذ أن حملت أول كاميرا بيديّ، أدركت أن هناك عوالم لا يصفها الكلام. الضوء الذي يسقط على جدار طيني قديم، أو ابتسامة طفل لم يدرك أنك تنظر إليه — هذه اللحظات تحمل ثقلاً لا تستطيع الكلمات حمله." }] },
        { type: "paragraph", content: [{ type: "text", text: "التصوير لغة عالمية لا تعرف حدوداً. صورة التقطتها في الرياض تحرك مشاعر شخص في طوكيو لم يزر المملكة يوماً. هذا هو السحر الحقيقي للصورة — أنها تتجاوز الجغرافيا والتاريخ واللغة لتصل مباشرة إلى القلب." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "ما الذي تقوله صورتك؟" }] },
        { type: "paragraph", content: [{ type: "text", text: "كل مصور يحمل رؤية خاصة للعالم. بعضهم يرى الجمال في التناسق الهندسي، وآخرون في الفوضى الإنسانية. أنا أجد نفسي مشدوداً إلى اللحظات التي يلتقي فيها الماضي والحاضر — حين يقف رجل عجوز أمام بنايات شاهقة، أو حين تحتضن النخلة القديمة الفجر الجديد." }] },
        { type: "paragraph", content: [{ type: "text", text: "ما الذي تريد أن تقوله لصورتك؟ هذا السؤال يجب أن يسبق كل ضغطة على الزر." }] },
      ],
    },
    contentEn: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "When the Image Speaks" }] },
        { type: "paragraph", content: [{ type: "text", text: "Since I first held a camera, I realized there are worlds that words cannot describe. The light falling on an old mud wall, or a child's smile unaware of your lens — these moments carry a weight that language cannot bear." }] },
        { type: "paragraph", content: [{ type: "text", text: "Photography is a universal language that knows no borders. An image captured in Riyadh moves the heart of someone in Tokyo who has never visited Saudi Arabia. That is the true magic of photography — it transcends geography, history, and language to speak directly to the soul." }] },
      ],
    },
    status: "published",
    publishedAt: new Date("2025-01-15"),
  },
  {
    slug: "aerial-photography-riyadh",
    titleAr: "الرياض من السماء — مدينة تكتب مستقبلها",
    titleEn: "Riyadh from the Sky — A City Writing Its Future",
    contentAr: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "أول طيران" }] },
        { type: "paragraph", content: [{ type: "text", text: "أتذكر أول مرة أقلعت فيها الطائرة المسيّرة فوق الرياض. كان الفجر لا يزال يتلمس طريقه بين الأبراج، والمدينة نائمة تحتي وكأنها تستعد لجولة أخرى من الخلق." }] },
        { type: "paragraph", content: [{ type: "text", text: "التصوير الجوي يغيّر كل شيء. الشوارع التي تبدو مزدحمة من الأرض تصبح خطوطاً هندسية أنيقة. والمباني الضخمة تتحول إلى مكعبات صغيرة في لوحة أكبر منها جميعاً." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "الرياض المتحولة" }] },
        { type: "paragraph", content: [{ type: "text", text: "ما يذهلني في الرياض الجوية هو الطبقات الزمنية المتراكمة. في صورة واحدة تجد أحياء قديمة بجوار أبراج الزجاج، ومشاريع قيد الإنشاء تحكي قصة مدينة لا تتوقف عن الحلم والبناء." }] },
        { type: "paragraph", content: [{ type: "text", text: "كل رحلة جوية تعلمني شيئاً جديداً — أن الجمال لا يختبئ بعيداً، بل هو في كل مكان، لكنه أحياناً يحتاج إلى ارتفاع مختلف لترى." }] },
      ],
    },
    contentEn: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "First Flight" }] },
        { type: "paragraph", content: [{ type: "text", text: "I remember the first time my drone lifted above Riyadh. Dawn was still finding its way between the towers, and the city lay sleeping beneath me as if preparing for another round of creation." }] },
        { type: "paragraph", content: [{ type: "text", text: "Aerial photography changes everything. Streets that seem crowded from the ground become elegant geometric lines. Massive buildings transform into small cubes in a canvas larger than all of them." }] },
      ],
    },
    status: "published",
    publishedAt: new Date("2025-02-03"),
  },
  {
    slug: "portrait-of-othman-taha",
    titleAr: "عثمان طه — حين يُصبح المصور شاهداً على التاريخ",
    titleEn: "Othman Taha — When the Photographer Becomes a Witness to History",
    contentAr: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "قبل أن أضغط على الزر، وقفت أمام رجل صغير الحجم عظيم الأثر. عثمان طه — الرجل الذي خطّ المصحف الذي يتلوه أكثر من مليار مسلم حول العالم — يجلس أمامي بهدوء من يعرف أن عمله أكبر من أي وصف." }] },
        { type: "paragraph", content: [{ type: "text", text: "في تلك اللحظة تذكرت لماذا أهوى البورتريه. ليس لأسجّل ملامح وجه، بل لأحتجز روح حياة كاملة في لقطة واحدة. كانت يداه — يدا الرجل الذي أمسكت بالقلم وكتبت ما لم يستطع أحد أن يكتبه بنفس الدقة والجمال — مسنودة بهدوء أمامه." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "البورتريه كشهادة" }] },
        { type: "paragraph", content: [{ type: "text", text: "هذا هو الفرق بين البورتريه العادي وذاك الذي يدوم. الأول يسجل شكلاً، والثاني يحمل قصة. حين تنظر إلى صورة عثمان طه لا ترى وجهاً فحسب — ترى عقوداً من الصبر والإتقان والإيمان." }] },
      ],
    },
    contentEn: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Before I pressed the shutter, I stood before a small man of immeasurable impact. Othman Taha — the man who calligraphed the Quran read by over a billion Muslims — sat before me with the calm of one who knows his work exceeds any description." }] },
        { type: "paragraph", content: [{ type: "text", text: "This is why I love portrait photography. Not to record facial features, but to imprison the soul of a complete life in a single frame." }] },
      ],
    },
    status: "published",
    publishedAt: new Date("2025-02-20"),
  },
  {
    slug: "family-through-the-lens",
    titleAr: "العائلة عبر العدسة — أقرب الصور إلى القلب",
    titleEn: "Family Through the Lens — The Closest Images to the Heart",
    contentAr: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "الصورة الأولى" }] },
        { type: "paragraph", content: [{ type: "text", text: "كانت أول صورة التقطتها بجدية لأبي. كان يجلس في الظل بعد صلاة العصر، يداه في حضنه ونظرته في مكان آخر. لم أقل له شيئاً، فقط أمسكت الكاميرا وضغطت." }] },
        { type: "paragraph", content: [{ type: "text", text: "اليوم تلك الصورة هي أثمن ما أملك. لا من الناحية الفنية — فالإضاءة ليست مثالية والتأطير بسيط — لكنها تحمل شيئاً لا تستطيع التقنية صنعه: حقيقة لحظة حقيقية لإنسان حقيقي." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "وجوه لا تعرف الكاميرا" }] },
        { type: "paragraph", content: [{ type: "text", text: "أجمل صور العائلة تلك التي يجهل فيها أصحابها وجود الكاميرا. ضحكة الأخ حين يروي نكتة، أو دموع الأم حين تفرح — هذه اللحظات لا تُطلب، فقط تُنتظر بصبر وعين متيقظة." }] },
      ],
    },
    contentEn: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "The First Photograph" }] },
        { type: "paragraph", content: [{ type: "text", text: "The first photograph I took with real intent was of my father. He sat in the shade after afternoon prayer, hands in his lap, gaze somewhere distant. I said nothing, just raised the camera and pressed." }] },
        { type: "paragraph", content: [{ type: "text", text: "Today that photograph is the most precious thing I own. Not technically — the lighting isn't perfect — but it holds something technology cannot manufacture: the truth of a real moment of a real person." }] },
      ],
    },
    status: "published",
    publishedAt: new Date("2025-03-05"),
  },
  {
    slug: "the-golden-hour-secret",
    titleAr: "سر الساعة الذهبية — حين يتحالف الضوء مع المصور",
    titleEn: "The Secret of the Golden Hour — When Light Allies with the Photographer",
    contentAr: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "ساعة بعد الشروق. ساعة قبل الغروب. هذه هي النافذة التي يسعى إليها المصورون بشغف يشبه الهوس. الضوء فيها ذهبي دافئ، ظلاله طويلة وناعمة، والألوان تحمل حرارة لا تجدها في أي وقت آخر من النهار." }] },
        { type: "paragraph", content: [{ type: "text", text: "لكن الساعة الذهبية لا تنتظر. بدأت، وانتهت. المصور الذي لم يستعد جيداً يجد نفسه يطارد ضوءاً رحل. التحضير يعني معرفة الموقع مسبقاً، وتحديد الزاوية، والوصول مبكراً كافياً لترتيب نفسك قبل أن يبدأ العرض." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "كيف أستثمر الذهب" }] },
        { type: "paragraph", content: [{ type: "text", text: "في الرياض، الساعة الذهبية تتقاطع مع المعمار بشكل استثنائي. الحجر الرملي للمباني القديمة يتحول إلى جمر متوهج، وأبراج الزجاج تصبح مرايا تعكس ألوان السماء. هذا هو السبب الذي يجعلني أستيقظ مبكراً كل يوم — لأن الضوء لا يكرر نفسه أبداً." }] },
      ],
    },
    contentEn: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "One hour after sunrise. One hour before sunset. This is the window photographers pursue with near obsession. The light is warm gold, shadows are long and soft, and colors carry a warmth found at no other time of day." }] },
        { type: "paragraph", content: [{ type: "text", text: "But the golden hour doesn't wait. It begins, and it ends. The photographer who didn't prepare finds himself chasing light that has already left. Preparation means knowing your location in advance, choosing your angle, and arriving early enough to settle before the show begins." }] },
      ],
    },
    status: "published",
    publishedAt: new Date("2025-03-18"),
  },
  {
    slug: "travel-with-camera",
    titleAr: "السفر بعين المصور — كيف تحوّل الرحلة إلى قصة مرئية",
    titleEn: "Traveling with a Photographer's Eye — How to Turn a Journey into a Visual Story",
    contentAr: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "السفر عبر عدسة الكاميرا يختلف تماماً عن السفر العادي. المسافر العادي يصل، يرى، يتذكر. المصور يصل، يلاحظ، يتأمل، ثم يُخلّد. كل ركن صغير يصبح مشهداً محتملاً، وكل وجه لاقيته محكيّاً مجهولاً." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "التحضير للرحلة" }] },
        { type: "paragraph", content: [{ type: "text", text: "قبل أي سفر أبحث عن الأماكن التي لا تظهر في كتب السياحة. المقاهي الضيقة، الأسواق الشعبية، الطرق الجانبية التي يسلكها السكان دون المصطافين. هناك تجد الروح الحقيقية لأي مكان." }] },
        { type: "paragraph", content: [{ type: "text", text: "أيضاً أتعلم كلمتين باللغة المحلية: 'شكراً' و'هل يمكنني التصوير؟'. الاحترام يفتح أبواباً لا تستطيع أي كاميرا فتحها وحدها." }] },
      ],
    },
    contentEn: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Traveling through a camera lens is fundamentally different from ordinary travel. The regular traveler arrives, sees, and remembers. The photographer arrives, notices, contemplates, then immortalizes. Every small corner becomes a potential scene, every face encountered an untold story." }] },
        { type: "paragraph", content: [{ type: "text", text: "Before any trip I research the places that don't appear in tourist books. Narrow cafés, popular markets, the side streets that locals use but visitors miss. That is where you find the true soul of any place." }] },
      ],
    },
    status: "published",
    publishedAt: new Date("2025-04-01"),
  },
  {
    slug: "black-and-white-philosophy",
    titleAr: "الأبيض والأسود — فلسفة الاختزال",
    titleEn: "Black and White — The Philosophy of Reduction",
    contentAr: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "حين تسحب اللون من الصورة، تبقى الحقيقة عارية. لا يوجد لون جذاب يشتت الانتباه، ولا دفء مصطنع يُخفي نقصاً في التكوين. الأبيض والأسود اختبار حقيقي للصورة — إن كانت تستحق، ستستحق بدون ألوان." }] },
        { type: "paragraph", content: [{ type: "text", text: "أعمالي الأكثر قرباً من قلبي هي بالأبيض والأسود. لأنها تجبرني على التفكير في الضوء والظل والشكل والنسيج قبل أي شيء آخر. اللون يزيّن، لكن الأبيض والأسود يكشف." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "متى تختار الأبيض والأسود؟" }] },
        { type: "paragraph", content: [{ type: "text", text: "حين تحكم الظلال الصورة. حين تكون العاطفة هي المحور لا اللون. حين تريد للزمن أن يتوقف. حين تصور وجهاً مسناً يحمل تاريخاً لا تستطيع ألوان الدنيا أن تحكيه." }] },
      ],
    },
    contentEn: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "When you strip color from an image, truth stands bare. No attractive color to distract, no artificial warmth to hide a compositional weakness. Black and white is the true test of a photograph — if it deserves to exist, it will deserve existence without color." }] },
        { type: "paragraph", content: [{ type: "text", text: "The works closest to my heart are in black and white. Because they force me to think about light, shadow, form, and texture before anything else. Color decorates, but black and white reveals." }] },
      ],
    },
    status: "published",
    publishedAt: new Date("2025-04-10"),
  },
  {
    slug: "saudi-architecture-eye",
    titleAr: "العمارة السعودية بعين المصور",
    titleEn: "Saudi Architecture Through the Photographer's Eye",
    contentAr: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "المملكة تشهد تحولاً معمارياً غير مسبوق في تاريخها. الأبراج الزجاجية الشاهقة تقف جنباً إلى جنب مع البيوت الطينية الأثرية والمساجد ذات القباب والمآذن الرشيقة. هذا التعايش البصري الفريد هو ما يجعل التصوير المعماري في السعودية تجربة لا تتكرر." }] },
        { type: "paragraph", content: [{ type: "text", text: "أحب أن أجد الزاوية التي تجمع الزمنين في إطار واحد — الجديد والقديم، الحديث والتراثي. هذا التوتر البصري هو قصة المملكة كلها في صورة واحدة." }] },
      ],
    },
    contentEn: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Saudi Arabia is witnessing an architectural transformation unprecedented in its history. Glass towers stand beside ancient mud houses and mosques with elegant domes and minarets. This unique visual coexistence is what makes architectural photography in Saudi Arabia an unrepeatable experience." }] },
      ],
    },
    status: "published",
    publishedAt: new Date("2025-04-14"),
  },
  {
    slug: "patience-of-the-photographer",
    titleAr: "صبر المصور — فن انتظار اللحظة",
    titleEn: "The Patience of the Photographer — The Art of Waiting for the Moment",
    contentAr: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "سألني أحد الأصدقاء ذات يوم: 'كم من الوقت تنتظر قبل أن تلتقط الصورة؟' فكرت قليلاً ثم قلت: 'أحياناً دقائق، وأحياناً سنوات'." }] },
        { type: "paragraph", content: [{ type: "text", text: "الصبر في التصوير ليس مجرد انتظار الضوء المناسب أو مرور الغيوم. هو صبر على التعلم، وعلى الفشل، وعلى إدراك أن الصورة التي تتخيلها لن تأتي في أول محاولة ولا العاشرة. لكنها ستأتي." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "الفشل معلم صادق" }] },
        { type: "paragraph", content: [{ type: "text", text: "أحتفظ بمجلد على حاسوبي اسمه 'صور لم تنجح'. فيه آلاف الصور التي رأيتها واعدة لكنها خذلتني. أعود إليها كل فترة، لأفهم لماذا. وفي كل مرة أجد درساً جديداً أغفلته من قبل." }] },
      ],
    },
    contentEn: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "A friend once asked me: 'How long do you wait before taking a shot?' I thought for a moment, then said: 'Sometimes minutes. Sometimes years.'" }] },
        { type: "paragraph", content: [{ type: "text", text: "Patience in photography isn't just waiting for the right light or the clouds to pass. It's patience with learning, with failure, with understanding that the image you imagine won't come on the first attempt or the tenth. But it will come." }] },
      ],
    },
    status: "published",
    publishedAt: new Date("2025-04-20"),
  },
  {
    slug: "talent-vs-practice",
    titleAr: "الموهبة أم الممارسة — سؤال لا يتوقف",
    titleEn: "Talent or Practice — A Question That Never Stops",
    contentAr: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "كثيراً ما يسألني المبتدئون: 'هل أنت موهوب؟ هل وُلدت بهذه القدرة؟' وإجابتي دائماً تُربكهم: ربما كانت هناك بذرة ما، لكن الشجرة نتيجة آلاف الساعات من العمل لا من الموهبة." }] },
        { type: "paragraph", content: [{ type: "text", text: "صورتي الأولى الجادة كانت سيئة. والثانية أقل سوءاً. والمئة الأولى كلها كانت تعلماً لا إبداعاً. الإبداع جاء لاحقاً، حين صارت التقنية لا تشغل تفكيري فبدأت أفكر في المعنى." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "نصيحة لمن يبدأ" }] },
        { type: "paragraph", content: [{ type: "text", text: "التقط صورة كل يوم. لا تنتظر الإضاءة المثالية والمشهد المثالي والكاميرا المثالية. التقط بما لديك وأين أنت. الكاميرا أداة والأداة تتحسن باستخدامها." }] },
      ],
    },
    contentEn: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Beginners often ask me: 'Are you talented? Were you born with this ability?' My answer always surprises them: perhaps there was some seed, but the tree grew from thousands of hours of work, not from talent." }] },
        { type: "paragraph", content: [{ type: "text", text: "My first serious photograph was bad. The second slightly less so. The first hundred were all learning, not creativity. Creativity came later, when technique no longer occupied my mind and I began to think about meaning." }] },
      ],
    },
    status: "published",
    publishedAt: new Date("2025-05-01"),
  },
];

// ─── Site Settings ────────────────────────────────────────────────────────────
const SETTINGS = {
  id: "main",
  titleAr: "صالح الهذلول | مصوّر",
  titleEn: "Saleh Al-Hathoul | Photographer",
  descriptionAr: "مصور سعودي يوثق المدن والإنسان والطبيعة — نسخ محدودة متاحة للاقتناء",
  descriptionEn: "Saudi photographer documenting cities, people, and nature — limited edition prints available",
  heroQuoteAr: "الصورة الحقيقية لا تُرى بالعين، بل تُحسّ بالقلب",
  heroQuoteEn: "The true photograph is not seen with the eye — it is felt with the heart",
  socialInstagram: "https://instagram.com/salehalhathoul",
  socialX: "https://x.com/salehalhathoul",
};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("📝 Seeding blog posts...\n");

  for (const post of POSTS) {
    const existing = await db.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) {
      console.log(`  ↩️  Exists: ${post.titleEn}`);
      continue;
    }
    await db.blogPost.create({
      data: {
        slug: post.slug,
        titleAr: post.titleAr,
        titleEn: post.titleEn,
        contentAr: post.contentAr,
        contentEn: post.contentEn,
        status: post.status,
        publishedAt: post.publishedAt,
      },
    });
    console.log(`  ✅ ${post.titleEn}`);
  }

  console.log("\n⚙️  Updating site settings...");
  await db.siteSettings.upsert({
    where: { id: "main" },
    create: SETTINGS,
    update: SETTINGS,
  });
  console.log("  ✅ Settings saved");

  const blogCount = await db.blogPost.count();
  console.log(`\n🎉 Done! Blog posts: ${blogCount}`);

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
});
