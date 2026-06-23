document.getElementById('yr').textContent = new Date().getFullYear();

// nav background on scroll
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

// scroll-reveal
const io = new IntersectionObserver((es)=>es.forEach(e=>{
  if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
}),{threshold:0.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// ---------- i18n ----------
const T = {
  he:{ single:"סינגל", words:"מילים ולחן:", perf:"נגינה, עיבוד ושירה: שאול נעים",
       lyrics:"מילים", soon:"בקרוב", play:"נגן" },
  en:{ single:"Single", words:"Words & melody:", perf:"Performed, arranged & sung by Shaul Naim",
       lyrics:"Lyrics", soon:"Coming soon", play:"Play" }
};
let lang = localStorage.getItem('lang') || 'he';
const releases = window.RELEASES || [];

// ACUM compliance: the singles are covers, so reproducing their lyrics on the
// site needs an ACUM/author license. Lyrics display is OFF until that is
// confirmed. Flip to true ONLY once ACUM lyric rights are in place.
const LYRICS_LICENSED = false;

function applyLang(l){
  lang = l; localStorage.setItem('lang', l);
  document.documentElement.lang = l;
  document.documentElement.dir = (l === 'he') ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-he]').forEach(el=>{
    const v = el.dataset[l]; if(v != null) el.textContent = v;
  });
  document.querySelectorAll('[data-he-aria]').forEach(el=>{
    const v = el.dataset[l + 'Aria']; if(v != null) el.setAttribute('aria-label', v);
  });
  document.getElementById('langToggle').textContent = (l === 'he') ? 'EN' : 'עב';
  renderGrid();
}

// ---------- singles grid ----------
const grid = document.getElementById('grid');
function renderGrid(){
  grid.innerHTML = '';
  releases.forEach((r, i) => {
    const coming = r.status === 'coming';
    const title = (lang==='en' && r.titleEn) ? r.titleEn : (coming ? T[lang].soon : r.title);
    const card = document.createElement(coming ? 'div' : 'button');
    card.className = 'card ' + (coming ? 'card-coming' : '');
    card.innerHTML = `
      <div class="card-cover" ${coming ? '' : `style="background-image:url('${r.cover}')"`}>
        ${coming ? `<span class="soon">${T[lang].soon}</span>` : '<span class="card-play">►</span>'}
      </div>
      <div class="card-meta">
        <span class="card-title">${title}</span>
        <span class="card-year">${r.year || ''}</span>
      </div>`;
    if(!coming) card.addEventListener('click', ()=>openRelease(i));
    grid.appendChild(card);
  });
}

// ---------- modal ----------
const modal = document.getElementById('modal');
const modalCard = modal.querySelector('.modal-card');
const body = document.getElementById('modal-body');
let lastFocused = null;
function openRelease(i){
  const r = releases[i], t = T[lang];
  const title = (lang==='en' && r.titleEn) ? r.titleEn : r.title;
  const blurb = (lang==='en' && r.blurbEn) ? r.blurbEn : r.blurb;
  const composer = (lang==='en' && r.composerEn) ? r.composerEn : r.composer;
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
      <button class="play-btn" aria-label="${t.play}">►</button></div>` : '');
  body.innerHTML = `
    ${player}
    <div class="modal-info">
      <span class="eyebrow">${t.single} · ${r.year||''}</span>
      <h2 id="modal-title">${title}</h2>
      ${composer ? `<p class="credit">${t.words} ${composer}<br/>${t.perf}</p>` : ''}
      ${blurb ? `<p class="blurb">${blurb}</p>` : ''}
      <div class="stream-links">${links}</div>
      ${lyrics}
    </div>`;
  const pl = body.querySelector('.video-wrap[data-src]');
  if(pl) pl.addEventListener('click', ()=>{
    if(pl.dataset.loaded) return; pl.dataset.loaded='1';
    const v=document.createElement('video');
    v.src=pl.dataset.src; v.controls=true; v.autoplay=true; v.playsInline=true;
    pl.innerHTML=''; pl.appendChild(v);
  });
  modalCard.setAttribute('aria-labelledby','modal-title');
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  lastFocused = document.activeElement;
  const x = modalCard.querySelector('.modal-x');
  if(x) x.focus();
}
function closeModal(){
  if(!modal.classList.contains('open')) return;
  modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
  document.body.style.overflow=''; body.innerHTML='';
  if(lastFocused && lastFocused.focus){ lastFocused.focus(); lastFocused = null; }
}
modal.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{
  if(!modal.classList.contains('open')) return;
  if(e.key==='Escape'){ closeModal(); return; }
  if(e.key==='Tab'){
    const f = modalCard.querySelectorAll('a[href],button,iframe,video,details,summary,[tabindex]:not([tabindex="-1"])');
    if(!f.length) return;
    const first = f[0], last = f[f.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  }
});

// ---------- init ----------
document.getElementById('langToggle').addEventListener('click', ()=>applyLang(lang==='he'?'en':'he'));
applyLang(lang);
