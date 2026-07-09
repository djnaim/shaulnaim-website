// Per-show / per-single page. Reads ?slug= and renders the item's own bound leaf.
document.getElementById('yr').textContent = new Date().getFullYear();

// detail pages keep a solid nav (it floats over dark arc-hued panels)
document.getElementById('nav').classList.add('scrolled');

const T = {
  he:{ single:"סינגל", show:"מופע", album:"אלבום", words:"מילים ולחן:", perf:"נגינה, עיבוד ושירה: שאול נעים",
       lyrics:"מילים", book:"לתיאום הופעה", contents:"תוכן העניינים", buy:"לרכישה באפל מיוזיק",
       spotify:"להאזנה בספוטיפיי", tracks:"רצועות", watch:"צפייה", notfound:"הדף לא נמצא", home:"חזרה לעמוד הבית" },
  en:{ single:"Single", show:"Show", album:"Album", words:"Words & melody:", perf:"Performed, arranged & sung by Shaul Naim",
       lyrics:"Lyrics", book:"Book a show", contents:"Contents", buy:"Buy on Apple Music",
       spotify:"Listen on Spotify", tracks:"tracks", watch:"Watch", notfound:"Page not found", home:"Back to home" }
};
let lang = localStorage.getItem('lang') || 'he';
const LYRICS_LICENSED = false;                       // ACUM: covers' lyrics stay off until licensed
const slug = new URLSearchParams(location.search).get('slug');
const pageType = document.body.dataset.page;         // 'show' | 'single'
const panel = document.getElementById('detailPanel');
const bodyEl = document.getElementById('detailBody');

const SHOW_HUE = ['hue-gold','hue-stone','hue-euc','hue-tek','hue-pom','hue-ink','hue-tek'];
const SINGLE_HUE = ['hue-gold','hue-ink','hue-tek'];
const ALBUM_HUE = ['hue-euc','hue-gold','hue-tek'];

function applyLang(l){
  lang = l; localStorage.setItem('lang', l);
  document.documentElement.lang = l;
  document.documentElement.dir = (l === 'he') ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-he]').forEach(el=>{ const v = el.dataset[l]; if(v != null) el.textContent = v; });
  document.querySelectorAll('[data-he-aria]').forEach(el=>{ const v = el.dataset[l+'Aria']; if(v != null) el.setAttribute('aria-label', v); });
  const lt = document.getElementById('langToggle');
  if(lt){ lt.textContent = (l === 'he') ? 'EN' : 'עב'; lt.setAttribute('aria-pressed', String(l === 'en')); }
  render();
}

function setHue(cls){ panel.className = 'detail-panel cropped paper ' + cls; }

function notFound(t){
  document.title = t.notfound + ' · שאול נעים';
  setHue('hue-ink');
  panel.innerHTML = `<div class="detail-inner"><a class="back-link" href="index.html">← ${t.home}</a><h1>${t.notfound}</h1></div>`;
  bodyEl.innerHTML = '';
}

function renderShow(t){
  const list = (window.SHOWS || []);
  const i = list.findIndex(x => x.slug === slug);
  if(i < 0){ notFound(t); return; }
  const s = list[i];
  const title = (lang==='en' && s.titleEn) ? s.titleEn : s.title;
  const tag = (lang==='en' && s.taglineEn) ? s.taglineEn : s.tagline;
  const paras = (lang==='en' && s.bodyEn) ? s.bodyEn : s.body;
  const hl = (lang==='en' && s.highlightsEn) ? s.highlightsEn : s.highlights;
  const includes = (window.SHOW_INCLUDES || {})[lang] || '';
  document.title = title + ' · שאול נעים';
  setHue(SHOW_HUE[i % SHOW_HUE.length]);
  panel.innerHTML = `<div class="detail-inner">
    <a class="back-link" href="index.html#shows">← ${t.contents}</a>
    <span class="eyebrow">${t.show} · ${['א','ב','ג','ד','ה','ו','ז'][i] || (i+1)}</span>
    <h1>${title}</h1></div>`;
  bodyEl.innerHTML = `
    ${tag ? `<p class="show-lead">${tag}</p>` : ''}
    ${(paras||[]).map(p=>`<p>${p}</p>`).join('')}
    ${hl && hl.length ? `<ul class="show-list">${hl.map(x=>`<li>${x}</li>`).join('')}</ul>` : ''}
    ${includes ? `<p class="show-includes">${includes}</p>` : ''}
    <div class="shows-cta"><a class="btn btn-pom" href="index.html#contact">${t.book}</a></div>`;
  igniteLead();
}

// echo the hero's signature on each leaf: the tagline lights word by word
function igniteLead(){
  const lead = bodyEl.querySelector('.show-lead');
  if(!lead) return;
  const words = lead.textContent.split(' ');
  lead.innerHTML = words.map(w=>`<span class="w">${w}</span>`).join(' ');
  const ws = [...lead.querySelectorAll('.w')];
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){ ws.forEach(w=>w.classList.add('on')); return; }
  ws.forEach((w,i)=> setTimeout(()=>w.classList.add('on'), 140 + i*70));
}

function renderSingle(t){
  const list = (window.RELEASES || []);
  const i = list.findIndex(x => x.slug === slug && x.status !== 'coming');
  if(i < 0){ notFound(t); return; }
  const r = list[i];
  const title = (lang==='en' && r.titleEn) ? r.titleEn : r.title;
  const blurb = (lang==='en' && r.blurbEn) ? r.blurbEn : r.blurb;
  const composer = (lang==='en' && r.composerEn) ? r.composerEn : r.composer;
  document.title = title + ' · שאול נעים';
  setHue(SINGLE_HUE[i % SINGLE_HUE.length]);
  panel.innerHTML = `<div class="detail-inner">
    <a class="back-link" href="index.html#singles">← ${t.contents}</a>
    <span class="eyebrow">${t.single} · ${r.year || ''}</span>
    <h1>${title}</h1></div>`;
  const links = [
    r.spotify ? `<a class="chip" href="${r.spotify}" target="_blank" rel="noopener">Spotify</a>`:'',
    r.youtube ? `<a class="chip" href="${r.youtube}" target="_blank" rel="noopener">YouTube</a>`:''
  ].join('');
  const lyrics = (LYRICS_LICENSED && r.lyrics) ? `<details class="lyrics"><summary>${t.lyrics}</summary>
    <div class="lyrics-body">${r.lyrics.map(s=>s.replace(/ \/ /g,'<br/>')).join('<br/><br/>')}</div></details>` : '';
  const player = r.youtubeId
    ? `<div class="video-wrap"><iframe width="100%" height="100%" src="https://www.youtube.com/embed/${r.youtubeId}" title="${title}" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
    : (r.video ? `<div class="video-wrap" data-src="${r.video}">
        <img class="poster" src="${r.cover}" alt="${title}" loading="lazy" decoding="async" />
        <button class="play-btn" aria-label="${t.watch}">►</button></div>`
    : (r.cover ? `<div class="video-wrap"><img class="poster" src="${r.cover}" alt="${title}" /></div>` : ''));
  bodyEl.innerHTML = `
    ${player}
    ${composer ? `<p class="credit">${t.words} ${composer} · ${t.perf}</p>` : ''}
    ${blurb ? `<p class="blurb">${blurb}</p>` : ''}
    <div class="stream-links">${links}</div>
    ${lyrics}`;
  const pl = bodyEl.querySelector('.video-wrap[data-src]');
  if(pl) pl.addEventListener('click', ()=>{
    if(pl.dataset.loaded) return; pl.dataset.loaded='1';
    const v = document.createElement('video');
    v.src = pl.dataset.src; v.controls = true; v.autoplay = true; v.playsInline = true;
    pl.innerHTML=''; pl.appendChild(v);
  });
}

function renderAlbum(t){
  const list = (window.ALBUMS || []);
  const i = list.findIndex(x => x.slug === slug);
  if(i < 0){ notFound(t); return; }
  const a = list[i];
  const title = (lang==='en' && a.titleEn) ? a.titleEn : a.title;
  const sub = (lang==='en' && a.subtitleEn) ? a.subtitleEn : a.subtitle;
  const blurb = (lang==='en' && a.blurbEn) ? a.blurbEn : a.blurb;
  document.title = title + ' · שאול נעים';
  setHue(ALBUM_HUE[i % ALBUM_HUE.length]);
  panel.innerHTML = `<div class="detail-inner">
    <a class="back-link" href="index.html#albums">← ${t.contents}</a>
    <span class="eyebrow">${t.album} · ${a.year || ''}</span>
    <h1>${title}</h1></div>`;
  bodyEl.innerHTML = `
    <div class="album-detail">
      <div class="album-detail-cover"><img src="${a.cover}" alt="${title}" loading="lazy" decoding="async" /></div>
      <div class="album-detail-info">
        ${sub ? `<p class="album-detail-sub">${sub}</p>` : ''}
        <p class="album-detail-meta">${a.year || ''} · ${a.tracks || ''} ${t.tracks}</p>
        ${blurb ? `<p class="blurb">${blurb}</p>` : ''}
        <div class="stream-links">
          ${a.apple ? `<a class="btn btn-pom" href="${a.apple}" target="_blank" rel="noopener">${t.buy}</a>` : ''}
          ${a.spotify ? `<a class="chip" href="${a.spotify}" target="_blank" rel="noopener">${t.spotify}</a>` : ''}
        </div>
      </div>
    </div>`;
}

function render(){ const t = T[lang];
  if(pageType === 'show') renderShow(t);
  else if(pageType === 'album') renderAlbum(t);
  else renderSingle(t); }

// scarlet thread bead follows scroll
(function bead(){
  const b = document.getElementById('threadBead');
  if(!b || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  const upd = () => { const max = document.documentElement.scrollHeight - innerHeight;
    const p = max>0 ? Math.min(1, Math.max(0, scrollY/max)) : 0;
    b.style.transform = `translateY(${p*(innerHeight-12)}px)`; ticking=false; };
  addEventListener('scroll', ()=>{ if(!ticking){ ticking=true; requestAnimationFrame(upd); } }, {passive:true});
  addEventListener('resize', upd, {passive:true}); upd();
})();

document.getElementById('langToggle').addEventListener('click', ()=>applyLang(lang==='he'?'en':'he'));
applyLang(lang);
