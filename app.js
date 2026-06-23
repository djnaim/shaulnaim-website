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

// ---------- render singles grid ----------
const grid = document.getElementById('grid');
const releases = window.RELEASES || [];
releases.forEach((r, i) => {
  const card = document.createElement(r.status === 'coming' ? 'div' : 'button');
  card.className = 'card ' + (r.status === 'coming' ? 'card-coming' : '');
  const cover = r.cover || 'assets/cover.jpg';
  card.innerHTML = `
    <div class="card-cover" ${r.status==='coming' ? '' : `style="background-image:url('${cover}')"`}>
      ${r.status==='coming' ? '<span class="soon">בקרוב</span>' : '<span class="card-play">►</span>'}
    </div>
    <div class="card-meta">
      <span class="card-title">${r.title}</span>
      <span class="card-year">${r.year || ''}</span>
    </div>`;
  if (r.status !== 'coming') card.addEventListener('click', () => openRelease(i));
  grid.appendChild(card);
});

// ---------- modal ----------
const modal = document.getElementById('modal');
const body = document.getElementById('modal-body');
function openRelease(i){
  const r = releases[i];
  const links = [
    r.spotify ? `<a class="chip" href="${r.spotify}" target="_blank" rel="noopener">Spotify</a>` : '',
    r.youtube ? `<a class="chip" href="${r.youtube}" target="_blank" rel="noopener">YouTube</a>` : ''
  ].join('');
  const lyrics = r.lyrics ? `<details class="lyrics"><summary>מילים</summary>
    <div class="lyrics-body">${r.lyrics.join('<br/>')}</div></details>` : '';
  const player = r.video ? `<div class="video-wrap" data-src="${r.video}">
      <img class="poster" src="${r.cover}" alt="${r.title}" />
      <button class="play-btn" aria-label="נגן">►</button></div>` : '';
  body.innerHTML = `
    ${player}
    <div class="modal-info">
      <span class="eyebrow">סינגל · ${r.year||''}</span>
      <h2>${r.title}</h2>
      ${r.composer ? `<p class="credit">מילים ולחן: ${r.composer}<br/>נגינה, עיבוד ושירה: שאול נעים</p>` : ''}
      ${r.blurb ? `<p class="blurb">${r.blurb}</p>` : ''}
      <div class="stream-links">${links}</div>
      ${lyrics}
    </div>`;
  // click-to-load video
  const pl = body.querySelector('.video-wrap');
  if (pl) pl.addEventListener('click', ()=>{
    if (pl.dataset.loaded) return; pl.dataset.loaded='1';
    const v=document.createElement('video');
    v.src=pl.dataset.src; v.controls=true; v.autoplay=true; v.playsInline=true;
    pl.innerHTML=''; pl.appendChild(v);
  });
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}
function closeModal(){
  modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
  document.body.style.overflow=''; body.innerHTML='';
}
modal.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });
