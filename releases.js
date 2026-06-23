// ============================================================
//  Shaul Naim - releases data
//  To add a single: copy a release folder under assets/releases/<slug>/
//  (cover.jpg, optional video.mp4), then add an object below.
//  Newest first. status: "released" | "coming".
// ============================================================
window.RELEASES = [
  {
    slug: "ani-gitara",
    title: "אני גיטרה",
    titleEn: "Ani Gitara",
    year: 2026,
    composer: "נעמי שמר",
    composerEn: "Naomi Shemer",
    blurb: "ביצוע חדש ומרגש לאחד משיריה היפים של נעמי שמר.",
    blurbEn: "A heartfelt new rendition of one of Naomi Shemer's most beloved songs.",
    cover: "assets/releases/ani-gitara/cover.jpg",
    video: "assets/releases/ani-gitara/video.mp4",
    spotify: "https://open.spotify.com/artist/5axEq9NvsVnVoP2zXl4YhD",
    youtube: "https://www.youtube.com/@ShaulNaimOfficial",
    lyrics: [
      "אני גיטרה / הרוח מנגן עלי / בחילופי עונות",
      "אני גיטרה / מישהו פורט עלי / בחילופי המנגינות",
      "כשמתחשק לי לפלרטט / אני פוצח בדואט",
      "גם אם זה טריו או קווארטט / זה לא מפריע",
      "על משבצות אדום לבן / אשכול בשל על השולחן",
      "ואגסים דמויי סזאן / וגם סנגריה",
      "אני סימן, אני עדות / לידידות ולבדידות",
      "וגם במשעולי ילדות / אצעד לבטח",
      "אני גיטרה / הייתי פעם עץ אולי / ובתיבת התהודה",
      "אני זוכר את / כל מי שניגן עלי / ואני אומר תודה"
    ],
    status: "released"
  },

  // ---- upcoming singles: fill in title/cover/video as each is ready ----
  { slug: "single-2", title: "בקרוב", year: 2026, status: "coming" },
  { slug: "single-3", title: "בקרוב", year: 2026, status: "coming" }
];
