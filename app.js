// ============================================================
//  shaulnaim.com homepage behavior (redesign 2026-10-03)
//  Everything essential is visible without this file; it only
//  renders data lists, switches language, and prepares inquiries.
// ============================================================
document.documentElement.classList.add('js');

// ACUM: covers' lyrics stay off until rights are licensed. Never flip this
// without written confirmation of ACUM lyric rights (owner action only).
const LYRICS_LICENSED = false;

const WA_NUMBER = '972522511351';
const EMAIL = 'hello@shaulnaim.com';

function store(get, k, v){
  try { return get ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch(e){ return null; }
}
let lang = store(true, 'lang') === 'en' ? 'en' : 'he';

const T = {
  he: {
    details: 'לפרטי המופע', ask: 'לבירור זמינות למופע', choose: 'נבחר יחד',
    tracks: 'רצועות', album: 'על האלבום', listen: 'פרטים והאזנה', words: 'מילים ולחן:',
    general: 'שלום שאול, אשמח לברר זמינות ומחיר למופע שירה בציבור.',
    intro: 'שלום שאול, אשמח לברר לגבי מופע.',
    fName: 'שם', fOrg: 'ארגון או יישוב', fShow: 'מופע', fDate: 'תאריך משוער', fNotes: 'פרטים נוספים',
    subject: 'פנייה לגבי מופע', pause: 'עצירת התנועה', play: 'הפעלת התנועה',
    menu: 'תפריט', close: 'סגירה', navLabel: 'ניווט ראשי'
  },
  en: {
    details: 'Show details', ask: 'Ask about this show', choose: 'We’ll choose together',
    tracks: 'tracks', album: 'Explore the album', listen: 'Details and listening', words: 'Words and music:',
    general: 'Hello Shaul, I’d like to ask about availability and pricing for a sing-along show.',
    intro: 'Hello Shaul, I’d like to ask about a show.',
    fName: 'Name', fOrg: 'Organization or town', fShow: 'Programme', fDate: 'Approximate date', fNotes: 'Notes',
    subject: 'Show inquiry', pause: 'Pause motion', play: 'Play motion',
    menu: 'Menu', close: 'Close', navLabel: 'Main navigation'
  }
};

const pick = (o, k) => (lang === 'en' && o[k + 'En']) ? o[k + 'En'] : o[k];
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const waURL = msg => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

/* ---------- language ---------- */
function applyLang(l){
  lang = l; store(false, 'lang', l);
  const html = document.documentElement;
  html.lang = l; html.dir = l === 'he' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-he]').forEach(el => { const v = el.dataset[l]; if (v != null) el.textContent = v; });
  document.querySelectorAll('[data-he-aria]').forEach(el => { const v = el.dataset[l + 'Aria']; if (v != null) el.setAttribute('aria-label', v); });
  document.querySelectorAll('[data-he-alt]').forEach(el => { const v = el.dataset[l + 'Alt']; if (v != null) el.setAttribute('alt', v); });
  const lt = document.getElementById('langToggle');
  if (lt){ lt.textContent = l === 'he' ? 'English' : 'עברית'; lt.lang = l === 'he' ? 'en' : 'he'; }
  document.querySelectorAll('.js-wa[data-wa="general"]').forEach(a => a.href = waURL(T[l].general));
  renderShows(); renderMusic(); fillShowSelect(); syncMotionLabel();
}

/* ---------- songs wall ---------- */
function renderSongs(){
  const songs = window.SONGS || [];
  const list = document.getElementById('songList');
  const rows = document.getElementById('songRows');
  if (!songs.length || !list || !rows) return;
  list.innerHTML = songs.map(s => `<li lang="he">${esc(s)}</li>`).join('');
  const n = 3, per = Math.ceil(songs.length / n);
  rows.innerHTML = '';
  for (let r = 0; r < n; r++){
    const part = songs.slice(r * per, (r + 1) * per);
    const row = document.createElement('div');
    row.className = 'song-row'; row.lang = 'he'; row.dir = 'rtl';
    const one = part.map(s => `<span>${esc(s)}</span>`).join('');
    const dup = part.map(s => `<span class="dup">${esc(s)}</span>`).join('');
    row.innerHTML = one + dup;
    row.style.setProperty('--dur', (70 + r * 18) + 's');
    rows.appendChild(row);
  }
  // rows are rtl: content flows right-to-left, so drift toward +50% (rightward) loops seamlessly
  rows.querySelectorAll('.song-row').forEach(row => row.style.setProperty('--shift', '50%'));
}
function syncMotionLabel(){
  const b = document.getElementById('motionToggle'); if (!b) return;
  const paused = document.getElementById('songs').classList.contains('paused');
  b.textContent = paused ? T[lang].play : T[lang].pause;
  b.setAttribute('aria-pressed', String(paused));
}
function initMotionToggle(){
  const b = document.getElementById('motionToggle'); if (!b) return;
  b.addEventListener('click', () => { document.getElementById('songs').classList.toggle('paused'); syncMotionLabel(); });
}

/* ---------- shows ---------- */
function renderShows(){
  const el = document.getElementById('showList'); if (!el) return;
  const t = T[lang];
  const openSlug = (el.querySelector('details[open]') || {}).dataset?.slug;
  el.innerHTML = (window.SHOWS || []).map((s, i) => `
    <details class="show" data-slug="${esc(s.slug)}"${(openSlug ? openSlug === s.slug : i === 0) ? ' open' : ''}>
      <summary>
        <h3>${esc(pick(s, 'title'))}</h3>
        <span class="chev" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 2v14M2 9h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></span>
      </summary>
      <div class="show-body">
        <p>${esc(pick(s, 'tagline'))}</p>
        <div class="show-actions">
          <a class="btn btn-primary" href="#booking" data-ask="${esc(s.slug)}">${esc(t.ask)}</a>
          <a class="btn btn-quiet" href="show.html?slug=${encodeURIComponent(s.slug)}">${esc(t.details)}</a>
        </div>
      </div>
    </details>`).join('');
  el.querySelectorAll('details').forEach(d => d.addEventListener('toggle', () => {
    if (d.open) el.querySelectorAll('details[open]').forEach(o => { if (o !== d) o.open = false; });
  }));
  el.querySelectorAll('[data-ask]').forEach(a => a.addEventListener('click', () => {
    const sel = document.getElementById('fShow'); if (sel) sel.value = a.dataset.ask;
    setTimeout(() => document.getElementById('fName')?.focus({preventScroll: true}), 450);
  }));
}

/* ---------- music ---------- */
function renderMusic(){
  const t = T[lang];
  const ag = document.getElementById('albumGrid');
  if (ag) ag.innerHTML = (window.ALBUMS || []).map(a => `
    <article class="album">
      <img src="assets/img/${esc(a.slug)}-600.jpg" width="600" height="600" alt="${esc(pick(a,'title'))}" loading="lazy" decoding="async">
      <div>
        <h3>${esc(pick(a, 'title'))}</h3>
        <p class="meta">${esc(a.year)}, ${esc(a.tracks)} ${esc(t.tracks)}</p>
        <p>${esc(pick(a, 'blurb'))}</p>
        <div class="links"><a class="text-link" href="album.html?slug=${encodeURIComponent(a.slug)}">${esc(t.album)}</a></div>
      </div>
    </article>`).join('');
  const sl = document.getElementById('singleList');
  if (sl) sl.innerHTML = (window.RELEASES || []).filter(r => r.status !== 'coming').map(r => `
    <a class="single" href="single.html?slug=${encodeURIComponent(r.slug)}">
      <img src="assets/img/${esc(r.slug)}-240.jpg" width="240" height="240" alt="" loading="lazy" decoding="async">
      <span>
        <h4>${esc(pick(r, 'title'))}</h4>
        <p class="credit">${esc(t.words)} ${esc(pick(r, 'composer'))}</p>
        <span class="go">${esc(t.listen)}</span>
      </span>
    </a>`).join('');
}

/* ---------- video: load YouTube only on deliberate activation ---------- */
function initVideo(){
  const f = document.getElementById('liveVideo'); if (!f) return;
  const btn = f.querySelector('.play');
  btn.addEventListener('click', () => {
    const id = f.dataset.yt;
    const ifr = document.createElement('iframe');
    ifr.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    ifr.title = lang === 'he' ? 'חנוכה של אור ותקווה, שאול נעים' : 'Hanukkah of Light and Hope, Shaul Naim';
    ifr.allow = 'autoplay; encrypted-media; picture-in-picture'; ifr.allowFullscreen = true;
    f.querySelector('img').replaceWith(ifr); btn.remove();
    ifr.focus();
  });
}

/* ---------- booking form ---------- */
function fillShowSelect(){
  const sel = document.getElementById('fShow'); if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = `<option value="">${esc(T[lang].choose)}</option>` +
    (window.SHOWS || []).map(s => `<option value="${esc(s.slug)}">${esc(pick(s, 'title'))}</option>`).join('');
  sel.value = cur;
}
function buildMessage(){
  const t = T[lang], v = id => (document.getElementById(id)?.value || '').trim();
  const show = (window.SHOWS || []).find(s => s.slug === v('fShow'));
  const lines = [t.intro, '', `${t.fName}: ${v('fName')}`];
  if (v('fOrg')) lines.push(`${t.fOrg}: ${v('fOrg')}`);
  lines.push(`${t.fShow}: ${show ? pick(show, 'title') : t.choose}`);
  if (v('fDate')) lines.push(`${t.fDate}: ${v('fDate').split('-').reverse().join('.')}`);
  if (v('fNotes')) lines.push(`${t.fNotes}: ${v('fNotes')}`);
  return lines.join('\n');
}
function validName(){
  const inp = document.getElementById('fName'), err = document.getElementById('fNameErr');
  const ok = !!inp.value.trim();
  inp.closest('.field').classList.toggle('invalid', !ok);
  inp.setAttribute('aria-invalid', String(!ok)); err.hidden = ok;
  if (!ok) inp.focus();
  return ok;
}
function initForm(){
  const form = document.getElementById('bookForm'); if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault(); if (!validName()) return;
    window.open(waURL(buildMessage()), '_blank', 'noopener');
  });
  document.getElementById('emailBtn').addEventListener('click', () => {
    if (!validName()) return;
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(T[lang].subject)}&body=${encodeURIComponent(buildMessage())}`;
  });
  document.getElementById('fName').addEventListener('input', e => {
    if (e.target.value.trim()){ e.target.closest('.field').classList.remove('invalid'); e.target.removeAttribute('aria-invalid'); document.getElementById('fNameErr').hidden = true; }
  });
}

/* ---------- header menu ---------- */
function initMenu(){
  const btn = document.getElementById('menuToggle'), nav = document.getElementById('mainNav');
  if (!btn || !nav) return;
  const set = open => { nav.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); };
  btn.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')){ set(false); btn.focus(); } });
}

/* ---------- mobile booking bar: appears once the hero actions scroll away ---------- */
function initMobileBar(){
  const bar = document.getElementById('mobileBar'), anchor = document.querySelector('.hero-actions');
  if (!bar || !anchor || !('IntersectionObserver' in window)) return;
  document.body.classList.add('has-bar');
  const booking = document.getElementById('booking');
  let heroVisible = true, bookingVisible = false;
  const upd = () => bar.classList.toggle('show', !heroVisible && !bookingVisible);
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; upd(); }).observe(anchor);
  new IntersectionObserver(([e]) => { bookingVisible = e.isIntersecting; upd(); }, {threshold: .15}).observe(booking);
}

document.getElementById('langToggle').addEventListener('click', () => applyLang(lang === 'he' ? 'en' : 'he'));
renderSongs(); initMotionToggle(); initVideo(); initForm(); initMenu(); initMobileBar();
applyLang(lang);
