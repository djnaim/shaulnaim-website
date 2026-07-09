// ============================================================
//  Shaul Naim - live shows (sing-along programs)
//  Content brought over from the Mastik booking site.
//  Each show opens a modal with its full description.
//  To add a show: add an object below (bilingual he / en).
// ============================================================

// Shared production line shown on every show.
window.SHOW_INCLUDES = {
  he: "המופע כולל: שאול שר ומנגן על קלידים ידניים היוצרים מגוון רחב של צלילים וסגנונות מוזיקליים, תכנות ועיבודים מוזיקליים מקוריים, הגברה מקצועית, מסך, מקרן, תוכן מקצועי ומצגת מילים מרהיבה.",
  en: "The show includes: Shaul singing and playing a handheld keytar that creates a wide range of sounds and musical styles, original programming and arrangements, professional sound, a screen, a projector, professional content, and a striking on-screen lyrics presentation."
};

window.SHOWS = [
  {
    slug: "chagei-yisrael",
    icon: "🎊",
    title: "פסיפס מוזיקלי של חגי ישראל",
    titleEn: "A Musical Mosaic of the Israeli Holidays",
    tagline: "לשיר ולהתרגש ביחד עם שאול, בעל קול מלטף ואנרגיה סוחפת, לאורך כל חגי השנה.",
    taglineEn: "Sing and be moved together with Shaul, a caressing voice and sweeping energy, across the whole year of holidays.",
    body: [
      "לכל חג בישראל יופי, עומק וקסם משלו: הסליחות בחודש אלול, ראש השנה, סוכות, שמחת תורה, חנוכה, פורים, ט״ו בשבט, פסח, ל״ג בעומר ושבועות.",
      "לחוות את יופיים של המועדים בחוויה מוזיקלית מרתקת בצוותא, שזורה בשירי חג, קטעי קישור מרתקים וסיפורים קצרים מלאי געגוע.",
      "פסיפס של שיר: מסע התחדשות מוזיקלי מרגש דרך חגי ישראל. לשיר יחד, לחוות יחד, לחגוג יחד!"
    ],
    bodyEn: [
      "Every Israeli holiday has a beauty, depth, and magic of its own: Selichot in Elul, Rosh Hashanah, Sukkot, Simchat Torah, Hanukkah, Purim, Tu BiShvat, Passover, Lag BaOmer, and Shavuot.",
      "Experience the beauty of the festivals in a captivating musical evening together, woven with holiday songs, engaging links, and short, nostalgic stories.",
      "A mosaic of song: a moving musical journey of renewal through the Israeli holidays. Sing together, feel together, celebrate together!"
    ]
  },

  {
    slug: "selichot",
    icon: "🕊️",
    title: "מזמרים ושרים סליחות",
    titleEn: "Singing the Selichot",
    tagline: "מופע מוזיקלי מרגש, פותח את הלב.",
    taglineEn: "A moving, heart-opening musical evening.",
    body: [
      "עם תחילת חודש אלול אנו נכנסים לתקופה מיוחדת בלוח השנה היהודי, ימי הסליחות. ימים אלה מוקדשים לומר סליחות, תפילות המביעות חרטה ובקשה למחילה על עוונותינו, הן כלפי אלוקים והן כלפי בני אדם.",
      "במרכז ימי הסליחות עומד המופע המיוחד 'מזמרים ושרים סליחות', מופע מוזיקלי מרגש ופותח לב, המאפשר לקהל לחוות יחד ערכים של סליחה ומחילה דרך השירים, ואף לשתף בחוויות אישיות.",
      "המופע משלב פיוטי סליחות ממסורות שונות ומגוונות, לצד שירי נשמה ישראליים, שירי תשרי וקלאסיקות עבריות אהובות, המעניקים לו נופך מיוחד ומקורי."
    ],
    bodyEn: [
      "As Elul begins, we enter a special season in the Jewish calendar, the days of Selichot. These days are devoted to reciting selichot, prayers of remorse and a plea for forgiveness, toward God and toward one another.",
      "At the heart of these days stands the special show 'Singing the Selichot', a moving, heart-opening evening that lets the audience experience the values of forgiveness together through song, and even share personal moments.",
      "The show blends Selichot piyutim from many traditions with Israeli soul songs, songs of the Tishrei season, and beloved Hebrew classics that give it a special, original character."
    ]
  },

  {
    slug: "ruach-yam",
    icon: "🌊",
    title: "רוח ים",
    titleEn: "Ruach Yam (Sea Breeze)",
    tagline: "חוויה מוזיקלית מחממת.",
    taglineEn: "A warming musical experience.",
    body: [
      "הצטרפו אלינו לערב של שירה בצוותא, סיפורים וחיבור חברתי. בואו לחוות ערב מיוחד במינו, לחגוג יחד את החיים, את האהבה ואת הקסם של המוזיקה.",
      "בואו לשיר יחד איתנו מגוון רחב של שירים ישראליים אהובים, מכל הזמנים ומכל הסגנונות. הערב ימלא ויחמם אתכם בשמחה והתרוממות רוח, תוך שיתוף סיפורים אישיים וקטעי קישור מרגשים.",
      "הצטרפו אלינו ל'רוח ים', חוויה מוזיקלית מחממת."
    ],
    bodyEn: [
      "Join us for an evening of communal singing, stories, and connection. Come experience a one of a kind evening, celebrating life, love, and the magic of music together.",
      "Sing along with us to a wide range of beloved Israeli songs from every era and every style. The evening will fill and warm you with joy and uplift, alongside personal stories and moving links.",
      "Join us for 'Ruach Yam', a warming musical experience."
    ]
  },

  {
    slug: "yerushalayim",
    icon: "🏛️",
    title: "שירים וסיפורים בין סמטאות ירושלים",
    titleEn: "Songs and Stories in the Alleys of Jerusalem",
    tagline: "הזדמנות ייחודית לחוות את ירושלים דרך הלב: שירה וזמר ישראלי בין סמטאותיה הצרות והקסומות.",
    taglineEn: "A unique chance to experience Jerusalem through the heart: Israeli song among its narrow, magical alleys.",
    body: [
      "אלפי עמודים נכתבו ויכתבו על ירושלים, ועדיין הם מעטים מדי כדי להכיל את יופיה, קדושתה וסיפורה הייחודי. שמותיה הרבים, כמו השירים שנכתבו עליה, מעידים על תכונותיה: עיר התהילה, עיר דוד, עיר השלום, עיר הצדק, בית התפילה, ציון, עיר שחוברה יחדיו.",
      "'שירים וסיפורים בין סמטאות ירושלים' הוא מופע מוזיקלי ייחודי המציע לכם מסע מרגש דרך שירי ירושלים האהובים, סיפורים מרתקים וסמטאות ציוריות.",
      "בואו לחוות את ירושלים דרך צלילים, מילים וטעמים: שירה משותפת של שירי ירושלים האהובים לצד סיפורים מרתקים על העיר."
    ],
    bodyEn: [
      "Thousands of pages have been and will be written about Jerusalem, and still too few to hold its beauty, holiness, and singular story. Its many names, like the songs written about it, speak to all it is: the City of Glory, the City of David, the City of Peace, the City of Justice, the House of Prayer, Zion, the city joined together.",
      "'Songs and Stories in the Alleys of Jerusalem' is a unique musical show offering a moving journey through the beloved songs of Jerusalem, captivating stories, and picturesque alleyways.",
      "Come experience Jerusalem through sound, words, and flavor: singing its most beloved songs together, alongside its captivating stories."
    ]
  },

  {
    slug: "kolot",
    icon: "🎙️",
    title: "הקולות של השירה הישראלית",
    titleEn: "The Voices of Israeli Song",
    tagline: "מסע מוזיקלי מרתק בצוותא.",
    taglineEn: "A captivating musical journey together.",
    body: [
      "השירה הישראלית היא נכס תרבותי ייחודי, המשקף את ההיסטוריה, התרבות והמורשת של עמנו. לאורך השנים התפתחה שירה עשירה ומגוונת, המשלבת סגנונות והשפעות רבים ומבטאת את הקולות הרבים של החברה הישראלית.",
      "'הקולות של השירה הישראלית' הוא מופע מרגש שלוקח את המשתתפים למסע מוזיקלי מרתק דרך מיטב השירים הישראליים מכל הזמנים, במגוון רחב של סגנונות: משירי משוררים ועד שירי לוחמים, משירי אהבה ועד ים תיכוני, מקבלת שבת ועד שירה חסידית."
    ],
    bodyEn: [
      "Israeli song is a unique cultural treasure that reflects the history, culture, and heritage of our people. Over the years it has grown rich and diverse, blending many styles and influences and voicing the many faces of Israeli society.",
      "'The Voices of Israeli Song' is a moving show that takes the audience on a captivating journey through the finest Israeli songs of all time, across a wide range of styles: from poets' songs to soldiers' songs, from love songs to Mediterranean, from Kabbalat Shabbat to Hasidic song."
    ],
    highlights: [
      "מופע מחווה לשיריו של יהורם גאון",
      "שירי משוררים: ערב מרגש לכבוד רחל, לאה גולדברג, חיים חפר, נעמי שמר, שאול טשרניחובסקי, נתן אלתרמן, נחום היימן ועוד",
      "להקות הזמר הים תיכוני משנות ה־70, צלילי העוד וצלילי הכרם",
      "קבלת שבת",
      "ערב של שירה חסידית אותנטית ועוד..."
    ],
    highlightsEn: [
      "A tribute to the songs of Yehoram Gaon",
      "Poets' songs: an evening honoring Rachel, Leah Goldberg, Haim Hefer, Naomi Shemer, Shaul Tchernichovsky, Natan Alterman, Nachum Heiman, and more",
      "The Mediterranean vocal ensembles of the 1970s",
      "Kabbalat Shabbat",
      "An evening of authentic Hasidic song, and more..."
    ]
  },

  {
    slug: "kayitz",
    icon: "☀️",
    title: "חגיגת קיץ ישראלית",
    titleEn: "An Israeli Summer Celebration",
    tagline: "ברוכים הבאים לחגיגת קיץ מוזיקלית ישראלית.",
    taglineEn: "Welcome to an Israeli summer music celebration.",
    body: [
      "הערב אנחנו כאן לחגוג יחד את הקיץ, לשיר יחד את המוזיקה הישראלית ואת האהבה שלנו לשירים שגדלנו עליהם.",
      "הזדמנות נהדרת לתת מקום ללב, לאוורר רגשות של אהבה, געגועים ושמחה, ולאחד אנשים לשיר יחד את מיטב הלהיטים הישראליים מכל הזמנים, בעיבודים מקוריים.",
      "שאול, זמר בעל קול מלטף ומרגש, יוביל אתכם במסע מוזיקלי דרך הקלאסיקות הישראליות האהובות. אז בואו תשחררו והצטרפו אלינו לערב שירה של קיץ ישראלי, שזור בקטעי קישור וסיפורים קצרים מרעננים."
    ],
    bodyEn: [
      "Tonight we are here to celebrate summer together, to sing Israeli music and our love for the songs we grew up on.",
      "A wonderful chance to make room for the heart, to air out feelings of love, longing, and joy, and to bring people together to sing the greatest Israeli hits of all time in original arrangements.",
      "Shaul, a singer with a caressing, stirring voice, will lead you on a musical journey through beloved Israeli classics. So let go and join us for an Israeli summer sing-along, woven with links and short, refreshing stories."
    ]
  },

  {
    slug: "eruim",
    icon: "💐",
    title: "קבלת פנים ואירועים פרטיים ועסקיים",
    titleEn: "Receptions, Private & Corporate Events",
    tagline: "ככה תעשו את זה נכון: הזמינו את שאול למופע שירים ישראלי בקבלת הפנים או האירוע שלכם, והפכו אותו לחוויה מוזיקלית מיוחדת שתרים את האווירה.",
    taglineEn: "Do it right: book Shaul for an Israeli sing-along at your reception or event, and turn it into a special musical experience that lifts the whole room.",
    body: [
      "הדרך המושלמת להעשיר ולציין חתונת זהב, חתונת כסף, חידוש ברית נישואין, ימי הולדת, אירועים עסקיים, כנסים ועוד.",
      "שאול יוביל אתכם במסע מוזיקלי דרך הקלאסיקות הישראליות האהובות: שירים שיעלו חיוך על פניכם, שירים שיגעו לכם בלב ושירים שירקידו את ליבכם."
    ],
    bodyEn: [
      "The perfect way to enrich and mark a golden anniversary, a silver anniversary, a vow renewal, birthdays, corporate events, conferences, and more.",
      "Shaul will lead you on a musical journey through beloved Israeli classics: songs that bring a smile, songs that touch the heart, and songs that get you dancing."
    ],
    highlights: [
      "תמונות מרגשות מהחיים שלכם, לרגל חתונת זהב, חתונת כסף, חידוש ברית נישואין או ימי הולדת",
      "תוכן מקצועי מרתק, לאירועים עסקיים וכנסים"
    ],
    highlightsEn: [
      "Moving photos from your life, for a golden or silver anniversary, a vow renewal, or a birthday",
      "Engaging professional content, for corporate events and conferences"
    ]
  }
];
