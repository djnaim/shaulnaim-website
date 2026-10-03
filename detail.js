// ============================================================
//  shaulnaim.com detail pages: show.html / single.html / album.html
//  Reads ?slug= and renders one item with its own primary action.
// ============================================================
document.documentElement.classList.add('js');

// ACUM: covers' lyrics stay off until rights are licensed.
const LYRICS_LICENSED = false;
const WA_NUMBER = '972522511351';

function store(get, k, v){ try { return get ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch(e){ return null; } }
let lang = store(true, 'lang') === 'en' ? 'en' : 'he';

const T = {
  he: { show:'מופע', single:'ביצוע חדש', album:'אלבום', crumbShows:'כל המופעים', crumbMusic:'כל המוזיקה',
        about:'על המופע', incl:'מה כלול', plan:'פרטים לתיאום',
        planText:'משך המופע, המחיר ודרישות המקום יימסרו בשיחה.',
        ask:'בירור זמינות למופע', call:'חיוג', bookTitle:'רוצים את המופע הזה אצלכם?',
        bookText:'כתבו לשאול ב-WhatsApp, וההודעה תיפתח עם שם המופע.',
        more:'מופעים נוספים', words:'מילים ולחן:', perf:'שירה, נגינה ועיבוד: שאול נעים',
        watch:'צפייה בקליפ', yt:'צפייה ב-YouTube', spotify:'שאול ב-Spotify', apple:'האזנה ב-Apple Music',
        buy:'לרכישת האלבום ב-WhatsApp', tracks:'רצועות', notfound:'הדף לא נמצא', home:'חזרה לעמוד הבית',
        msgShow: t => `שלום שאול, אשמח לברר זמינות ומחיר למופע "${t}".`,
        msgAlbum: t => `שלום שאול, אשמח לרכוש את האלבום "${t}". מה המחיר ואיך רוכשים?` },
  en: { show:'Show', single:'New rendition', album:'Album', crumbShows:'All shows', crumbMusic:'All music',
        about:'About the show', incl:'What’s included', plan:'Details to discuss',
        planText:'We’ll discuss duration, pricing, and venue requirements with you.',
        ask:'Check this show’s availability', call:'Call', bookTitle:'Want this show at your venue?',
        bookText:'Message Shaul on WhatsApp; the message opens with the show’s name.',
        more:'More shows', words:'Words and music:', perf:'Vocals, keys, and arrangement: Shaul Naim',
        watch:'Watch the video', yt:'Watch on YouTube', spotify:'Shaul on Spotify', apple:'Listen on Apple Music',
        buy:'Buy the album via WhatsApp', tracks:'tracks', notfound:'Page not found', home:'Back to the homepage',
        msgShow: t => `Hello Shaul, I’d like to ask about availability and pricing for "${t}".`,
        msgAlbum: t => `Hello Shaul, I’d like to buy the album "${t}". What is the price, and how can I purchase it?` }
};
const pick = (o, k) => (lang === 'en' && o[k + 'En']) ? o[k + 'En'] : o[k];
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const waURL = m => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(m)}`;

const slug = new URLSearchParams(location.search).get('slug');
const page = document.body.dataset.page;
const hero = document.getElementById('detailHero');
const body = document.getElementById('detailBody');

function setTitle(t){ document.title = `${t} | ${lang === 'he' ? 'שאול נעים' : 'Shaul Naim'}`; }

function notFound(t){
  setTitle(t.notfound);
  hero.innerHTML = `<a class="crumb" href="index.html">${esc(t.home)}</a><h1>${esc(t.notfound)}</h1>`;
  body.innerHTML = '';
}

function ytFrame(id, title, poster){
  return `<div class="video-frame" data-yt="${esc(id)}">
    <img src="${esc(poster || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`)}" alt="" loading="lazy" decoding="async">
    <button class="play" type="button" aria-label="${esc(title)}"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="32" fill="var(--blue)"/><path d="M26 20 46 32 26 44Z" fill="#fff"/></svg></button>
  </div>`;
}
function wireVideos(){
  body.querySelectorAll('.video-frame[data-yt]').forEach(f => {
    const b = f.querySelector('.play'); if (!b) return;
    b.addEventListener('click', () => {
      const ifr = document.createElement('iframe');
      ifr.src = `https://www.youtube-nocookie.com/embed/${f.dataset.yt}?autoplay=1&rel=0`;
      ifr.title = b.getAttribute('aria-label'); ifr.allow = 'autoplay; encrypted-media; picture-in-picture'; ifr.allowFullscreen = true;
      f.querySelector('img').replaceWith(ifr); b.remove(); ifr.focus();
    });
  });
}

function renderShow(t){
  const list = window.SHOWS || [];
  const s = list.find(x => x.slug === slug); if (!s) return notFound(t);
  const title = pick(s, 'title');
  setTitle(title);
  hero.innerHTML = `
    <a class="crumb" href="index.html#shows">${esc(t.crumbShows)}</a>
    <p class="detail-kind">${esc(t.show)}</p>
    <h1>${esc(title)}</h1>
    <p class="lede">${esc(pick(s, 'tagline'))}</p>`;
  const paras = pick(s, 'body') || [];
  const hl = pick(s, 'highlights') || [];
  const incl = (window.SHOW_INCLUDES || {})[lang] || '';
  const others = list.filter(x => x.slug !== s.slug).slice(0, 3);
  body.innerHTML = `
    <div class="detail-grid">
      <div class="detail-main">
        <h2>${esc(t.about)}</h2>
        ${paras.map(p => `<p>${esc(p)}</p>`).join('')}
        ${hl.length ? `<ul>${hl.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        ${incl ? `<h2>${esc(t.incl)}</h2><p>${esc(incl.replace(/^(המופע כולל:|The show includes:)\s*/, ''))}</p>` : ''}
        <h2>${esc(t.plan)}</h2><p>${esc(t.planText)}</p>
      </div>
      <aside class="detail-side" aria-labelledby="sideTitle">
        <h2 id="sideTitle">${esc(t.bookTitle)}</h2>
        <p>${esc(t.bookText)}</p>
        <a class="btn btn-primary btn-lg" href="${waURL(t.msgShow(title))}" target="_blank" rel="noopener">${esc(t.ask)}</a>
        <a class="btn btn-quiet btn-lg" href="tel:+972522511351">${esc(t.call)} <span dir="ltr">052-251-1351</span></a>
      </aside>
    </div>
    <div class="related" style="margin-top:var(--s8);padding-top:var(--s6)">
      <h2 style="font-size:1.5rem">${esc(t.more)}</h2>
      <ul>${others.map(o => `<li><a href="show.html?slug=${encodeURIComponent(o.slug)}">${esc(pick(o, 'title'))}</a></li>`).join('')}</ul>
    </div>`;
}

function renderSingle(t){
  const r = (window.RELEASES || []).find(x => x.slug === slug && x.status !== 'coming'); if (!r) return notFound(t);
  const title = pick(r, 'title');
  setTitle(title);
  hero.innerHTML = `
    <a class="crumb" href="index.html#music">${esc(t.crumbMusic)}</a>
    <p class="detail-kind">${esc(t.single)}, ${esc(r.year || '')}</p>
    <h1>${esc(title)}</h1>
    <p class="lede">${esc(t.words)} ${esc(pick(r, 'composer'))}</p>`;
  body.innerHTML = `
    <div class="detail-grid">
      <div class="detail-media"><img class="cover-lg" src="assets/img/${esc(r.slug)}-720.jpg" width="720" height="720" alt="${esc(title)}" decoding="async"></div>
      <div class="detail-info">
        <p class="credit">${esc(t.perf)}</p>
        <p>${esc(pick(r, 'blurb'))}</p>
        <div class="stack">
          ${r.youtube ? `<a class="btn btn-primary btn-lg" href="${esc(r.youtube)}" target="_blank" rel="noopener">${esc(t.yt)}</a>` : ''}
          ${r.spotify ? `<a class="btn btn-quiet btn-lg" href="${esc(r.spotify)}" target="_blank" rel="noopener">${esc(t.spotify)}</a>` : ''}
        </div>
      </div>
    </div>
    ${r.youtubeId ? `<div class="detail-video">${ytFrame(r.youtubeId, `${t.watch}: ${title}`)}</div>` : ''}`;
  wireVideos();
}

function renderAlbum(t){
  const a = (window.ALBUMS || []).find(x => x.slug === slug); if (!a) return notFound(t);
  const title = pick(a, 'title');
  setTitle(title);
  hero.innerHTML = `
    <a class="crumb" href="index.html#music">${esc(t.crumbMusic)}</a>
    <p class="detail-kind">${esc(t.album)}, ${esc(a.year)}</p>
    <h1>${esc(title)}</h1>
    <p class="lede">${esc(pick(a, 'subtitle'))}</p>`;
  body.innerHTML = `
    <div class="detail-grid">
      <div class="detail-media"><img class="cover-lg" src="assets/img/${esc(a.slug)}-600.jpg" width="600" height="600" alt="${esc(title)}" decoding="async"></div>
      <div class="detail-info">
        <p class="credit">${esc(a.year)}, ${esc(a.tracks)} ${esc(t.tracks)}</p>
        <p>${esc(pick(a, 'blurb'))}</p>
        <div class="stack">
          <a class="btn btn-primary btn-lg" href="${waURL(t.msgAlbum(title))}" target="_blank" rel="noopener">${esc(t.buy)}</a>
          ${a.apple ? `<a class="btn btn-quiet btn-lg" href="${esc(a.apple)}" target="_blank" rel="noopener">${esc(t.apple)}</a>` : ''}
        </div>
      </div>
    </div>`;
}

function render(){
  const t = T[lang];
  if (page === 'show') renderShow(t); else if (page === 'album') renderAlbum(t); else renderSingle(t);
}

function applyLang(l){
  lang = l; store(false, 'lang', l);
  document.documentElement.lang = l; document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-he]').forEach(el => { const v = el.dataset[l]; if (v != null) el.textContent = v; });
  document.querySelectorAll('[data-he-aria]').forEach(el => { const v = el.dataset[l + 'Aria']; if (v != null) el.setAttribute('aria-label', v); });
  const lt = document.getElementById('langToggle');
  if (lt){ lt.textContent = l === 'he' ? 'English' : 'עברית'; lt.lang = l === 'he' ? 'en' : 'he'; lt.setAttribute('aria-label', l === 'he' ? 'Switch to English' : 'מעבר לעברית'); }
  render();
}

(function initMenu(){
  const btn = document.getElementById('menuToggle'), nav = document.getElementById('mainNav'); if (!btn || !nav) return;
  const set = o => { nav.classList.toggle('open', o); btn.setAttribute('aria-expanded', String(o)); };
  btn.addEventListener('click', () => set(!nav.classList.contains('open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')){ set(false); btn.focus(); } });
})();

document.getElementById('langToggle').addEventListener('click', () => applyLang(lang === 'he' ? 'en' : 'he'));
applyLang(lang);
