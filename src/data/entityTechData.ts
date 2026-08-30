import { 
  BookEntity, 
  ManuscriptEntity, 
  MediaEntity, 
  EnhancedAuthor, 
  EnhancedCategory, 
  EnhancedTag,
  EnhancedPublisher
} from '../types';

export const INITIAL_AUTHORS: EnhancedAuthor[] = [
  {
    id: 1,
    name: 'ابن خلدون (عبد الرحمن بن محمد)',
    bio: 'مؤرخ وفيلسوف وعالم اجتماع عربي أندلسي، مؤسس علم الاجتماع الحديث وصاحب المقدمة الشهيرة.',
    death_year: '808 هـ / 1406 م',
    nationality: 'أندلسي / تونسي',
    books_count: 3,
  },
  {
    id: 2,
    name: 'أبو عبد الله محمد بن إدريس الشافعي',
    bio: 'ثالث الأئمة الأربعة، صاحب كتاب الأم والرسالة، ومؤسس المذهب الشافعي وعلم أصول الفقه.',
    death_year: '204 هـ / 820 م',
    nationality: 'قرشي / غزة',
    books_count: 5,
  },
  {
    id: 3,
    name: 'ابن رشد الحفيد (أبو الوليد)',
    bio: 'فيلسوف وفقيه وطبيب وقاضي أندلسي، صاحب كتاب بداية المجتهد وفصل المقال.',
    death_year: '595 هـ / 1198 م',
    nationality: 'أندلسي / قرطبة',
    books_count: 4,
  }
];

export const INITIAL_CATEGORIES: EnhancedCategory[] = [
  { id: 1, name: 'فقه وأصول', slug: 'fiqh-usul', color: 'emerald', icon: 'BookOpen' },
  { id: 2, name: 'تاريخ وحضارة', slug: 'history', color: 'amber', icon: 'Landmark' },
  { id: 3, name: 'مخطوطات نادرة', slug: 'manuscripts', color: 'indigo', icon: 'Scroll' },
  { id: 4, name: 'صوتيات وشروح', slug: 'audio-lectures', color: 'purple', icon: 'Headphones' },
  { id: 5, name: 'علوم القرآن والحديث', slug: 'quran-hadith', color: 'cyan', icon: 'Sparkles' },
];

export const INITIAL_TAGS: EnhancedTag[] = [
  { id: 1, name: 'تحقيق علمي', slug: 'tahqeeq' },
  { id: 2, name: 'نسخة فريدة', slug: 'unique-copy' },
  { id: 3, name: 'مقروء ومسموع', slug: 'audio-synced' },
  { id: 4, name: 'هوامش ومقارنات', slug: 'annotated' },
];

export const INITIAL_PUBLISHERS: EnhancedPublisher[] = [
  { id: 1, name: 'دار المعارف', country: 'مصر', city: 'القاهرة' },
  { id: 2, name: 'دار ابن حزم', country: 'لبنان', city: 'بيروت' },
  { id: 3, name: 'مكتبة الملك فهد الوطنية', country: 'السعودية', city: 'الرياض' },
];

export const INITIAL_BOOKS: BookEntity[] = [
  {
    id: 101,
    title: 'مقدمة ابن خلدون (النسخة المحققة الموثقة)',
    author: 'ابن خلدون (عبد الرحمن بن محمد)',
    category: 'تاريخ وحضارة',
    publisher: 'دار المعارف',
    edition_number: 3,
    total_pages: 480,
    audio_sync_id: 301,
    manuscript_ref_id: 201,
    footnotes: [
      {
        id: 'fn-1',
        number: 1,
        type: 'tahqeeq',
        content: 'في النسخة الظاهرية بدمشق: "بسم الله الرحمن الرحيم وبه نستعين، قال الشيخ الإمام العلامة..." وزاد في الهامش مقابلة مع نسخة طوب قابي رقم 2441.',
        pageNumber: 1,
      },
      {
        id: 'fn-2',
        number: 2,
        type: 'lugha',
        content: 'العمران البشري: مصطلح خلدوني فريد يقصد به الاجتماع الإنساني وما ينتج عنه من نظم ومدن وصنائع ومعارف.',
        pageNumber: 2,
      },
      {
        id: 'fn-3',
        number: 3,
        type: 'takhreej',
        content: 'مستنبط من حديث: "إن الله يبعث لهذه الأمة على رأس كل مائة سنة من يجدد لها دينها" أخرجه أبو داود برقم (4291).',
        pageNumber: 4,
      }
    ],
    poetry_verses: [
      {
        id: 'pv-1',
        shatrA: 'وإذا رأيتَ المرءَ يَجبي مالَهُ',
        shatrB: 'مِن غَيرِ حَقٍّ فاعْلَمَنَّ زَوالَهُ',
        bahr: 'البحر الكامل',
        rawiy: 'اللام'
      },
      {
        id: 'pv-2',
        shatrA: 'والظُّلْمُ يَسْلُبُ مِن قُلوبِ رِجالِها',
        shatrB: 'عَزْمَ النُّفوسِ وَيَقْطَعُ الآمالا',
        bahr: 'البحر البسيط',
        rawiy: 'اللام الممدودة'
      }
    ],
    quran_citations: [
      {
        id: 'qc-1',
        surahNumber: 13,
        surahName: 'الرعد',
        ayahNumber: 11,
        textUthmani: 'إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ',
        translation: 'Indeed, Allah will not change the condition of a people until they change what is in themselves.'
      }
    ],
    content_markdown: `# الباب الأول: في العمران البشري على الجملة

## الفصل الأول: في أن الاجتماع الإنساني ضروري

اعلم أن الإنسان قد فُطر على نحو لا يستقل بتحصيل حاجاته ومعاشه وحده دون التعاون مع بني جنسه. فالواحد من البشر لا يقدر على تحصيل قوته يومه إلا بالاستعانة بطائفة من الصناعات؛ من طحن وخبز ونسج وحراسة وغيرها. 

ولما كان العدوان طبيعة في البشر بحكم الغضبية والشهوية، احتاط الاجتماع بوجود وازع وحاكم يقمع المعتدي ويقيم الميزان بالقسط:

> [!NOTE]
> هذا المبدأ الخلدوني هو الأساس الأولي لقيام الدولة وسلطة القانون، حيث ينبني العمران على العدل والأمن واستقرار الصنائع.

وكما جاء في محكم التنزيل:
*(إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ)* [سورة الرعد: 11]

### شواهد من ديوان الحكمة العمرانية:
- وإذا رأيتَ المرءَ يَجبي مالَهُ ... مِن غَيرِ حَقٍّ فاعْلَمَنَّ زَوالَهُ
- والظُّلْمُ يَسْلُبُ مِن قُلوبِ رِجالِها ... عَزْمَ النُّفوسِ وَيَقْطَعُ الآمالا

وقد دل الاستقراء على أن الدول تمر بأطوار طبيعية كأطوار الكائن الحي: طور التأسيس، ثم طور الاستبداد والاستقرار، ثم طور الفراغ والدعة، ثم طور الانحطاط والاضمحلال.`
  }
];

export const INITIAL_MANUSCRIPTS: ManuscriptEntity[] = [
  {
    id: 201,
    title: 'مخطوطة كتاب العبر وديوان المبتدأ والخبر (نسخة الخزانة التونسية المؤرخة)',
    author: 'عبد الرحمن بن خلدون المغربي',
    copier_name: 'محمد بن يحيى الغرناطي',
    copy_year_hijri: '796 هـ',
    library_name: 'دار الكتب الوطنية التونسية / خزانة المخطوطات النادرة',
    call_number: 'MS-ARAB-796-KH',
    total_pages: 12,
    status: 'verified',
    versions_count: 5,
    pages: [
      {
        id: 1,
        page_number: 1,
        image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
        thumbnail_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80',
        transcription: 'بسم الله الرحمن الرحيم وصلى الله على سيدنا محمد وآله وصحبه وسلم تسليماً. يقول العبد الفقير إلى رحمة ربه الغني بلطفه عبد الرحمن بن محمد بن خلدون الحضرمي وفقه الله ولطف به...',
        notes_count: 4,
        confidence_score: 98.5
      },
      {
        id: 2,
        page_number: 2,
        image_url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
        thumbnail_url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=300&q=80',
        transcription: 'أما بعد حمد الله الذي جعل التاريخ عبرة للأولين وتبصرة للآخرين، وميز بني آدم بالعقل والنطق وفضلهم على سائر المخلوقين...',
        notes_count: 2,
        confidence_score: 96.2
      },
      {
        id: 3,
        page_number: 3,
        image_url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80',
        thumbnail_url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=300&q=80',
        transcription: 'فإن فن التاريخ من الفنون التي تتداولها الأمم والأجيال، وتشد إليها الركائب والآمال، وتسمو إلى معرفته السوقة والأغفال...',
        notes_count: 3,
        confidence_score: 97.8
      }
    ]
  }
];

export const INITIAL_MEDIA: MediaEntity[] = [
  {
    id: 301,
    title: 'شرح صوتي متزامن: الفصل الأول من مقدمة ابن خلدون (العمران البشري)',
    type: 'audio',
    duration: 320, // seconds
    speaker: 'أ. د. كمال عبد العزيز التلمساني',
    media_url: 'https://assets.mixkit.co/music/preview/mixkit-classical-piano-warmth-1049.mp3',
    waveform_data: [12, 34, 55, 78, 65, 80, 45, 90, 100, 60, 40, 75, 85, 95, 45, 30, 60, 80, 50, 70, 90, 100, 80, 60, 40],
    segments: [
      {
        id: 1,
        title: 'المقدمة والتعريف بالمسألة العمرانية',
        start_time: 0,
        end_time: 45,
        text_transcript: 'نبدأ بحول الله تعالى قراءة وتحقيق الباب الأول من كتاب العبر، حيث يضع ابن خلدون النواة الأولى لنظرية الاجتماع الإنساني.',
        speaker: 'المحاضر'
      },
      {
        id: 2,
        title: 'شرح ضرورة التعاون البشري في تحصيل القوت',
        start_time: 46,
        end_time: 140,
        text_transcript: 'يوضح المصنف أن قدرة الفرد الواحد قاصرة عن تحصيل قوته لولا تضافر الصنائع من زراعة وطحن وحياكة وحماية.',
        speaker: 'المحاضر'
      },
      {
        id: 3,
        title: 'تأصيل مفهوم الوازع والسلطة السياسية',
        start_time: 141,
        end_time: 250,
        text_transcript: 'هنا يربط ابن خلدون بين الحاجة للاجتماع وبين ضرورة وجود الحاكم والوازع لمنع تغلب القوي على الضعيف.',
        speaker: 'المحاضر'
      },
      {
        id: 4,
        title: 'خاتمة الفصل والشواهد القرآنية والأدبية',
        start_time: 251,
        end_time: 320,
        text_transcript: 'يختم الفصل بالاستشهاد بالآية الكريمة وبيتي الشعر في تحذير الحكام من الجور وكساد الأسواق.',
        speaker: 'المحاضر'
      }
    ]
  }
];
