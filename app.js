// year
document.getElementById('yr').textContent = new Date().getFullYear();

// nav background on scroll
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

// scroll-reveal
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }});
},{threshold:0.15});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// click-to-load video (avoids loading 20MB on page open)
const player = document.getElementById('player');
if(player){
  player.addEventListener('click', ()=>{
    if(player.dataset.loaded) return;
    player.dataset.loaded = '1';
    const v = document.createElement('video');
    v.src = player.dataset.src;
    v.controls = true; v.autoplay = true; v.playsInline = true;
    player.innerHTML = '';
    player.appendChild(v);
  });
}
