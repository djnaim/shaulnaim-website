document.getElementById('yr').textContent = new Date().getFullYear();

// nav background on scroll
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

// scroll reveal
const io = new IntersectionObserver((es)=>es.forEach(e=>{
  if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
}),{threshold:0.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// ---------- i18n ----------
const T = {
  he:{ soon:"בקרוב", details:"לפרטים", show:"מופע", watch:"צפייה בסרטון" },
  en:{ soon:"Coming soon", details:"Details", show:"Show", watch:"Play video" }
};
let lang = localStorage.getItem('lang') || 'he';
const releases = window.RELEASES || [];
const albums = window.ALBUMS || [];
const shows = window.SHOWS || [];
const videos = window.VIDEOS || [];
const HEB_ORD = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','י״א','י״ב'];
// one arc hue per ordinal (never two per row); glyph stays ink for AAA on the stone band
const ROW_HUE = ['var(--gold)','var(--tek-500)','var(--pom)','var(--euc)','var(--gold)','var(--tek-500)','var(--pom)'];

function applyLang(l){
  lang = l; localStorage.setItem('lang', l);
  document.documentElement.lang = l;
  document.documentElement.dir = (l === 'he') ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-he]').forEach(el=>{ const v = el.dataset[l]; if(v != null) el.textContent = v; });
  document.querySelectorAll('[data-he-aria]').forEach(el=>{ const v = el.dataset[l+'Aria']; if(v != null) el.setAttribute('aria-label', v); });
  const lt = document.getElementById('langToggle');
  lt.textContent = (l === 'he') ? 'EN' : 'עב';
  lt.setAttribute('aria-pressed', String(l === 'en'));
  renderGrid();
  renderAlbums();
  renderShows();
  renderVideos();
}

// ---------- albums: flagship covers, each links to its own page ----------
const albumGrid = document.getElementById('albumGrid');
function renderAlbums(){
  if(!albumGrid) return;
  albumGrid.innerHTML = '';
  albums.forEach(a => {
    const title = (lang==='en' && a.titleEn) ? a.titleEn : a.title;
    const sub = (lang==='en' && a.subtitleEn) ? a.subtitleEn : a.subtitle;
    const card = document.createElement('a');
    card.className = 'album-card';
    card.href = 'album.html?slug=' + encodeURIComponent(a.slug);
    card.setAttribute('aria-label', (lang==='he'?'אלבום: ':'Album: ') + title);
    card.innerHTML = `
      <div class="album-cover">
        <img src="${a.cover}" alt="${title}" loading="lazy" decoding="async" />
        <span class="album-buy">${lang==='he'?'לרכישה':'Buy'}</span>
      </div>
      <div class="album-meta">
        <span class="album-title">${title}</span>
        <span class="album-sub">${sub || ''}</span>
        <span class="album-info">${a.year} · ${a.tracks} ${lang==='he'?'רצועות':'tracks'}</span>
      </div>`;
    albumGrid.appendChild(card);
  });
}

// ---------- singles: printed plates, each links to its own page ----------
const grid = document.getElementById('grid');
function renderGrid(){
  grid.innerHTML = '';
  releases.forEach((r, i) => {
    const coming = r.status === 'coming';
    const title = (lang==='en' && r.titleEn) ? r.titleEn : (coming ? T[lang].soon : r.title);
    const card = document.createElement(coming ? 'div' : 'a');
    card.className = 'card ' + (coming ? 'card-coming' : '');
    if(!coming){
      card.href = 'single.html?slug=' + encodeURIComponent(r.slug);
      const playLabel = (lang==='he') ? 'לצפייה והאזנה: ' : 'Watch and listen: ';
      card.setAttribute('aria-label', playLabel + title);
    }
    card.innerHTML = `
      <div class="card-cover" ${coming ? '' : `style="background-image:url('${r.cover}')"`}>
        ${coming ? `<span class="soon">${T[lang].soon}</span>` : '<span class="card-play">►</span>'}
      </div>
      <div class="card-meta">
        <span class="card-num">${HEB_ORD[i] || (i+1)}</span>
        <span class="card-title">${title}</span>
        <span class="card-dots" aria-hidden="true"></span>
        <span class="card-year">${r.year || ''}</span>
      </div>`;
    grid.appendChild(card);
  });
}

// ---------- shows: the songbook table of contents ----------
const showsToc = document.getElementById('showsToc');
let tocObserver = null;
function renderShows(){
  if(!showsToc) return;
  showsToc.innerHTML = '';
  shows.forEach((s, i) => {
    const title = (lang==='en' && s.titleEn) ? s.titleEn : s.title;
    const tag = (lang==='en' && s.taglineEn) ? s.taglineEn : s.tagline;
    const isEvents = (i === shows.length - 1);
    const a = document.createElement('a');
    a.className = 'toc-row' + (isEvents ? ' events' : '');
    a.href = 'show.html?slug=' + encodeURIComponent(s.slug);
    a.style.setProperty('--row-hue', ROW_HUE[i % ROW_HUE.length]);
    a.setAttribute('aria-label', T[lang].show + ': ' + title);
    a.innerHTML = `
      <span class="medallion" aria-hidden="true">${HEB_ORD[i] || (i+1)}</span>
      <span class="toc-main">
        <span class="toc-line">
          <span class="toc-title">${title}</span>
          <span class="toc-dots" aria-hidden="true"></span>
          <span class="toc-meta">${T[lang].details}</span>
        </span>
        <span class="toc-desc">${tag || ''}</span>
      </span>
      <span class="toc-arrow" aria-hidden="true">←</span>`;
    showsToc.appendChild(a);
  });
  // leader-dot type-in as each row scrolls into view (row-staggered)
  if(tocObserver) tocObserver.disconnect();
  const rows = [...showsToc.querySelectorAll('.toc-row')];
  tocObserver = new IntersectionObserver((es)=>es.forEach(e=>{
    if(e.isIntersecting){
      const idx = rows.indexOf(e.target);
      const dots = e.target.querySelector('.toc-dots');
      if(dots) dots.style.transitionDelay = (idx * 90) + 'ms';
      e.target.classList.add('seen');
      tocObserver.unobserve(e.target);
    }
  }), {threshold:0.35});
  rows.forEach(r=>tocObserver.observe(r));
}

// ---------- video gallery (click to load, inline) ----------
const videoGrid = document.getElementById('videoGrid');
function renderVideos(){
  if(!videoGrid) return;
  videoGrid.innerHTML = '';
  videos.forEach(v => {
    const title = (lang==='en' && v.titleEn) ? v.titleEn : v.title;
    const desc = (lang==='en' && v.descEn) ? v.descEn : v.desc;
    const fig = document.createElement('figure');
    fig.className = 'video-item';
    fig.innerHTML = `
      <div class="video-wrap" data-yt="${v.id}">
        <img class="poster" src="https://img.youtube.com/vi/${v.id}/hqdefault.jpg" alt="${title}" loading="lazy" decoding="async" />
        <button class="play-btn" aria-label="${T[lang].watch}: ${title}">►</button>
      </div>
      <figcaption class="video-cap">
        <span class="video-title">${title}</span>
        ${desc ? `<span class="video-desc">${desc}</span>` : ''}
      </figcaption>`;
    const wrap = fig.querySelector('.video-wrap');
    wrap.addEventListener('click', ()=>{
      if(wrap.dataset.loaded) return; wrap.dataset.loaded='1';
      wrap.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${v.id}?autoplay=1" title="${title}" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>`;
    });
    videoGrid.appendChild(fig);
  });
}

// ---------- signature: the sing-along headline that ignites word by word ----------
function initKaraoke(){
  const m = document.getElementById('marquee');
  if(!m) return;
  const words = [...m.querySelectorAll('.word')];
  if(!words.length) return;
  const ANCHOR = 3; // first words stay lit so the sing-along concept reads even at rest / in OG previews
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){ words.forEach(w=>w.classList.add('lit')); return; }
  words.slice(0, ANCHOR).forEach(w=>w.classList.add('lit')); // paint the at-rest state immediately on load
  let running = false;
  function sweep(){
    if(running) return; running = true;
    words.forEach((w,i)=> setTimeout(()=>w.classList.add('lit'), i*180));
    const hold = words.length*180 + 2800;
    setTimeout(()=>{
      words.forEach((w,i)=>{ if(i >= ANCHOR) w.classList.remove('lit'); }); // keep the anchor words lit between sweeps
      running = false;
      setTimeout(sweep, 650);
    }, hold);
  }
  sweep();
}

// ---------- the scarlet thread's sun-bead follows scroll ----------
function initThreadBead(){
  const bead = document.getElementById('threadBead');
  if(!bead || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    bead.style.transform = `translateY(${p * (innerHeight - 12)}px)`;
    ticking = false;
  };
  addEventListener('scroll', ()=>{ if(!ticking){ ticking = true; requestAnimationFrame(update); } }, {passive:true});
  addEventListener('resize', update, {passive:true});
  update();
}

// ---------- init ----------
document.getElementById('langToggle').addEventListener('click', ()=>applyLang(lang==='he'?'en':'he'));
applyLang(lang);
requestAnimationFrame(()=>document.querySelector('.hero')?.classList.add('entered'));
initKaraoke();
initThreadBead();

// the scarlet thread stamps its seal when you reach the colophon
const seal = document.querySelector('.seal-here');
if(seal){
  const so = new IntersectionObserver((es)=>es.forEach(e=>{
    if(e.isIntersecting){ seal.classList.add('stamped'); so.disconnect(); }
  }), {threshold:1});
  so.observe(seal);
}

// Re-scroll to an in-page anchor after full load (late images/iframe shift layout)
window.addEventListener('load', () => {
  if (!location.hash) return;
  const el = document.querySelector(location.hash);
  if (el) setTimeout(() => el.scrollIntoView({ behavior: 'auto', block: 'start' }), 60);
});
