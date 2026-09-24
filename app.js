/* SENDER-WEB · app.js — modulos de interaccion (film scrub, knob, espectro, htrack, velo)
   gsap/ScrollTrigger/Lenis vienen de CDN como globales. */
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const Lenis = window.Lenis;
if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
import './i18n.js';
/* v23.1: 3D background como chunk diferido (idle + solo puntero fino) = main bundle liviano */
if (!window.matchMedia('(pointer: coarse), (max-width: 1100px)').matches) {
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 900));
}

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ================= PRELOADER ================= */
const loader = document.getElementById('loader');
const loaderCount = document.getElementById('loader-count');
const loaderBar = document.getElementById('loader-bar');
const loaderWave = document.getElementById('loader-wave-path');
let WAVE_LEN = 0;
if (loaderWave) {
  WAVE_LEN = loaderWave.getTotalLength();
  loaderWave.style.strokeDasharray = String(WAVE_LEN);
  loaderWave.style.strokeDashoffset = String(WAVE_LEN);
}
document.body.classList.add('loading');

function bootHero() {
  document.body.classList.remove('loading');
  heroTl.play();
}
if (reduce && loader) {
  loader.remove();
  document.body.classList.remove('loading');
} else if (loader) {
  const c = { v: 0 };
  gsap.to(c, {
    v: 100, duration: 0.9, ease: 'power2.inOut',
    onUpdate: () => {
      loaderCount.textContent = String(Math.round(c.v)).padStart(3, '0');
      loaderBar.style.width = c.v + '%';
      if (loaderWave) loaderWave.style.strokeDashoffset = String(WAVE_LEN * (1 - c.v / 100));
    },
    onComplete: () => {
      gsap.to(loader, {
        yPercent: -100, duration: 0.55, ease: 'power4.inOut',
        onComplete: () => { loader.remove(); bootHero(); },
      });
    },
  });
} else {
  document.body.classList.remove('loading');
}

/* ================= SMOOTH SCROLL ================= */
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -8 });
    else target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ================= CURSOR (blend difference) ================= */
const cursor = document.getElementById('cursor');
if (cursor && finePointer && !reduce) {
  const cx = gsap.quickTo(cursor, 'x', { duration: 0.4, ease: 'power3' });
  const cy = gsap.quickTo(cursor, 'y', { duration: 0.4, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); });
  document.querySelectorAll('a, button, [data-tilt]').forEach((el) => {
    el.addEventListener('pointerenter', () => cursor.classList.add('big'));
    el.addEventListener('pointerleave', () => cursor.classList.remove('big'));
  });
} else if (cursor) cursor.remove();

/* ================= PROGRESS BAR + NAV ================= */
gsap.to('#progress i', {
  scaleX: 1, ease: 'none',
  scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
});
const nav = document.getElementById('nav');
ScrollTrigger.create({
  start: 60,
  onUpdate: (self) => nav.classList.toggle('scrolled', self.scroll() > 60),
});

/* ================= SPLIT WORDS ================= */
document.querySelectorAll('.split-words').forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="w"><span>${w}</span></span>`).join(' ');
});

/* ================= HERO TIMELINE (pausada hasta el loader) ================= */
const heroTl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });
heroTl
  .from('.hero-bg img', { scale: 1.28, duration: 2.2, ease: 'power2.out' }, 0)
  .from('.nav', { y: -50, opacity: 0, duration: 0.8 }, 0.2)
  .from('.hero-eyebrow', { y: 18, opacity: 0, duration: 0.7 }, 0.45)
  .from('.hero-title .w > span', { yPercent: 115, duration: 1.1, stagger: 0.07 }, 0.5)
  .from('.hero-sub', { y: 22, opacity: 0, duration: 0.8 }, 0.95)
  .from('.hero-cta > *', { y: 22, opacity: 0, stagger: 0.1, duration: 0.7 }, 1.1)
  .from('.hero-stats .stat', { y: 26, opacity: 0, stagger: 0.08, duration: 0.7 }, 1.25)
  .from('.scroll-hint', { opacity: 0, duration: 0.8 }, 1.5);
if (reduce) { document.body.classList.remove('loading'); heroTl.progress(1).pause(); }

/* ================= REVEALS ================= */
document.querySelectorAll('.reveal').forEach((el) => {
  if (el.classList.contains('split-words')) {
    gsap.from(el.querySelectorAll('.w > span'), {
      yPercent: 115, duration: 1, stagger: 0.05, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
    });
  } else {
    gsap.from(el, {
      y: 44, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  }
});

/* ================= SCRAMBLE DECODE ================= */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/—';
function scramble(el) {
  const txt = el.dataset.text || el.textContent;
  let frame = 0;
  const iv = setInterval(() => {
    frame++;
    el.textContent = txt.split('').map((ch, i) =>
      i < frame / 2 ? ch : (ch === ' ' ? ' ' : CHARS[(Math.random() * CHARS.length) | 0])
    ).join('');
    if (frame / 2 >= txt.length) { clearInterval(iv); el.textContent = txt; }
  }, 28);
}
document.querySelectorAll('.scramble').forEach((el) => {
  ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => scramble(el) });
});

/* ================= CONTADORES ================= */
document.querySelectorAll('[data-count]').forEach((el) => {
  const end = parseFloat(el.dataset.count);
  const obj = { v: 0 };
  gsap.to(obj, {
    v: end, ease: 'power1.out', duration: 2,
    scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('es-CL'); },
  });
});

/* ================= PARALLAX INTERNO DE IMÁGENES (efecto 3D) ================= */
document.querySelectorAll('[data-parallax]').forEach((wrap) => {
  const img = wrap.querySelector('img');
  if (!img) return;
  gsap.fromTo(img, { yPercent: -10, scale: 1.18 }, {
    yPercent: 10, scale: 1.18, ease: 'none',
    scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
  });
});
/* héroe: parallax vertical extra */
if (!reduce) {
  gsap.to('.hero-bg', {
    yPercent: 14, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/* ================= TILT 3D CON EL PUNTERO ================= */
if (finePointer && !reduce) {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotationY: px * 9, rotationX: -py * 9, transformPerspective: 900, duration: 0.6, ease: 'power2.out' });
    });
    card.addEventListener('pointerleave', () => {
      gsap.to(card, { rotationX: 0, rotationY: 0, duration: 1, ease: 'elastic.out(1, 0.45)' });
    });
  });

  /* ================= BOTONES MAGNÉTICOS ================= */
  document.querySelectorAll('[data-magnetic]').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.35, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.5, ease: 'power2.out' });
    });
    btn.addEventListener('pointerleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' });
    });
  });
}

/* ================= ESPECTRO (signature move) ================= */
const bands = [
  { name: 'NAVTEX', min: 490e3, max: 518e3 },
  { name: 'AM', min: 510e3, max: 1700e3 },
  { name: 'HF', min: 2e6, max: 30e6 },
  { name: 'FM', min: 88e6, max: 108e6 },
];
const freqEl = document.getElementById('freq');
const unitEl = document.getElementById('unit');
const bandNameEl = document.getElementById('band-name');
const needleEl = document.getElementById('needle');
const segEls = document.querySelectorAll('.seg');
const panelEls = document.querySelectorAll('.panel');
const thumbEls = document.querySelectorAll('.bthumb');

function fmtFreq(f) {
  if (f >= 1e6) {
    const v = f / 1e6;
    return [v.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: v < 10 ? 2 : 1 }), 'MHz'];
  }
  return [(f / 1e3).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }), 'kHz'];
}
const specState = { band: 0, ratio: 0 };
function updateSpectrum(p) {
  p = Math.min(0.99999, Math.max(0, p));
  const bi = Math.min(bands.length - 1, Math.floor(p * bands.length));
  const local = p * bands.length - bi;
  const b = bands[bi];
  const f = Math.exp(Math.log(b.min) + local * (Math.log(b.max) - Math.log(b.min)));
  const [val, unit] = fmtFreq(f);
  freqEl.textContent = val;
  unitEl.textContent = unit;
  bandNameEl.textContent = b.name;
  needleEl.style.left = (p * 100).toFixed(3) + '%';
  if (specState.band !== bi) {
    specState.band = bi;
    segEls.forEach((s, i) => s.classList.toggle('active', i === bi));
    panelEls.forEach((s, i) => s.classList.toggle('active', i === bi));
    thumbEls.forEach((s, i) => s.classList.toggle('active', i === bi));
  }
  specState.ratio = local;
}
ScrollTrigger.create({
  trigger: '#espectro', start: 'top top', end: '+=320%',
  pin: window.matchMedia('(min-width: 901px)').matches ? '.espectro-pin' : false, scrub: 0.35, anticipatePin: 1, invalidateOnRefresh: true,
  onUpdate: (self) => updateSpectrum(self.progress),
});
updateSpectrum(0);

/* ---- osciloscopio ---- */
const scope = document.getElementById('scope');
const sctx = scope.getContext('2d');
let phase = 0;
function resizeScope() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = scope.getBoundingClientRect();
  scope.width = rect.width * dpr;
  scope.height = rect.height * dpr;
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeScope();
window.addEventListener('resize', resizeScope);
function drawScope() {
  const rect = scope.getBoundingClientRect();
  const w = rect.width, h = rect.height;
  sctx.clearRect(0, 0, w, h);
  const band = specState.band;
  const cycles = 2.5 + band * 3.5 + specState.ratio * 3;
  const amp = h * 0.32 * (1 - band * 0.07);
  sctx.strokeStyle = 'rgba(255,255,255,0.07)';
  sctx.lineWidth = 1;
  sctx.beginPath(); sctx.moveTo(0, h / 2); sctx.lineTo(w, h / 2); sctx.stroke();
  const grad = sctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, 'rgba(30,115,190,0.25)');
  grad.addColorStop(0.5, '#4da3e0');
  grad.addColorStop(1, '#0085b2');
  sctx.strokeStyle = grad;
  sctx.lineWidth = 2;
  sctx.shadowColor = 'rgba(0,133,178,0.6)';
  sctx.shadowBlur = 12;
  sctx.beginPath();
  for (let x = 0; x <= w; x += 3) {
    const t = x / w;
    const y = h / 2 + Math.sin(t * Math.PI * 2 * cycles + phase) * amp * Math.sin(t * Math.PI) ** 0.4;
    x === 0 ? sctx.moveTo(x, y) : sctx.lineTo(x, y);
  }
  sctx.stroke();
  sctx.shadowBlur = 0;
  phase += reduce ? 0 : 0.06;
}
let scopeVisible = true;
new IntersectionObserver((es) => { scopeVisible = es[0].isIntersecting; }, { rootMargin: '200px' }).observe(document.getElementById('espectro') || document.body);
(function scopeLoop() { if (scopeVisible && !reduce) drawScope(); else requestAnimationFrame(scopeLoop); })();

/* ================= PROYECTOS: SCROLL HORIZONTAL PINEADO ================= */
const projNow = document.getElementById('proj-now');
const mm = gsap.matchMedia();
mm.add('(min-width: 761px)', () => {
  const track = document.getElementById('htrack');
  const distance = () => track.scrollWidth - window.innerWidth;
  const hTween = gsap.to(track, {
    x: () => -distance(), ease: 'none',
    scrollTrigger: {
      trigger: '#proyectos', start: 'top top', end: () => '+=' + distance(),
      pin: '.proj-pin', scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: (self) => {
        projNow.textContent = String(Math.min(4, Math.floor(self.progress * 4) + 1)).padStart(2, '0');
      },
    },
  });
  /* parallax horizontal dentro de cada slide (containerAnimation) */
  document.querySelectorAll('.slide').forEach((slide) => {
    const img = slide.querySelector('.slide-media img');
    gsap.fromTo(img, { xPercent: -7, scale: 1.15 }, {
      xPercent: 7, scale: 1.15, ease: 'none',
      scrollTrigger: { trigger: slide, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true },
    });
  });
});

/* ================= NOSOTROS: rotateY ligado al scroll (3D) ================= */
if (!reduce) {
  gsap.fromTo('.about-frame', { rotationY: -11, transformPerspective: 1300 }, {
    rotationY: 7, ease: 'none',
    scrollTrigger: { trigger: '#nosotros', start: 'top bottom', end: 'bottom top', scrub: 0.8 },
  });
}

/* ================= v4: MENÚ DESPLEGABLE ================= */
const burger = document.getElementById('burger');
const menuOverlay = document.getElementById('menu-overlay');
const menuClose = document.getElementById('menu-close');
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  const mo = document.getElementById('menu-overlay');
  if (mo) mo.setAttribute('aria-hidden', String(!open));
  if (open) setTimeout(() => { const f = document.querySelector('#menu-overlay a'); if (f) f.focus(); }, 80);
  burger.setAttribute('aria-expanded', String(open));
  menuOverlay.setAttribute('aria-hidden', String(!open));
  if (lenis) open ? lenis.stop() : lenis.start();
}
burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
menuClose.addEventListener('click', () => setMenu(false));
menuOverlay.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', () => setMenu(false));
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setMenu(false);
  if (e.key === 'Tab' && document.body.classList.contains('menu-open')) {
    const f = [...document.querySelectorAll('#menu-overlay a, #menu-overlay button')].filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ================= v4: SHOT CYCLER (tomas 3D) ================= */
import { t as i18nT } from './i18n.js';
document.querySelectorAll('.shot-stage').forEach((stage, idx) => {
  const label = stage.querySelector('.shot-label');
  let i = idx % 4;
  const apply = () => {
    stage.dataset.shot = String(i);
    if (label) label.textContent = i18nT('shot.' + (i + 1));
  };
  apply();
  setInterval(() => { i = (i + 1) % 4; apply(); }, 3400);
});
window.addEventListener('langchange', () => {
  document.querySelectorAll('.shot-stage').forEach((stage) => {
    const label = stage.querySelector('.shot-label');
    if (label) label.textContent = i18nT('shot.' + (Number(stage.dataset.shot) + 1));
  });
});

/* ================= v5: HÉROE TRANSMISOR 360 — VIDEO SCRUB + 3D ================= */
(() => {
  const stage = document.getElementById('tx-stage');
  const video = document.getElementById('tx-video');
  const hud = document.getElementById('tx-hud-label');
  if (!stage || !video) return;
  const VPATHS = ['./assets/videos/hero-cut.mp4', './assets/videos/cine.mp4'];
  let hasVideo = false;

  const setHud = () => { hud.textContent = i18nT(hasVideo ? 'hero.video.on' : 'hero.video.off'); };
  (async () => {
    for (const V of VPATHS) {
      try {
        const r = await fetch(V, { method: 'HEAD' });
        if (!r.ok) continue;
        video.src = V;
        video.addEventListener('loadedmetadata', () => {
          hasVideo = true; stage.classList.add('has-video'); setHud();
          try { video.currentTime = 0.9; } catch (e) { /* frame inicial visible */ }
        }, { once: true });
        video.load();
        return;
      } catch (e) { /* siguiente slot */ }
    }
    setHud();
  })();
  window.addEventListener('langchange', setHud);

  /* scrub: el scroll reproduce el video 360 y adapta el plano al diseño */
  let sp = 0, px = 0, py = 0;
  const applyStage = () => {
    gsap.set(stage, {
      scale: 1 - sp * 0.16,
      rotateY: -12 + sp * 12 + px * 10,
      rotateX: -py * 7,
      transformPerspective: 1100,
    });
    if (hasVideo && video.duration && isFinite(video.duration)) {
      video.currentTime = sp * Math.max(0, video.duration - 0.05);
    }
  };
  ScrollTrigger.create({
    trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.4,
    onUpdate: (self) => { sp = self.progress; applyStage(); },
  });
  if (finePointer && !reduce) {
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - 0.5;
      py = (e.clientY - r.top) / r.height - 0.5;
      applyStage();
    });
    stage.addEventListener('pointerleave', () => { px = 0; py = 0; applyStage(); });
  }
})();

/* ================= v6: PRODUCT FILM PINEADO (scrub + capítulos) ================= */
(() => {
  const pin = document.querySelector('.cine-pin');
  const video = document.getElementById('cine-video');
  const bar = document.getElementById('cine-bar');
  const hint = document.querySelector('.cine-hint');
  const chs = document.querySelectorAll('.ch');
  if (!pin || !video) return;
  const VPATHS = []; /* lab: el film global toma el rol */
  (async () => {
    for (const V of VPATHS) {
      try {
        const r = await fetch(V, { method: 'HEAD' });
        if (!r.ok) continue;
        video.src = V;
        video.addEventListener('loadedmetadata', () => pin.classList.add('has-video'), { once: true });
        video.load();
        return;
      } catch (e) { /* probar siguiente slot */ }
    }
  })();

  ScrollTrigger.create({
    trigger: '#cine', start: 'top top', end: '+=240%',
    pin: '.cine-pin', scrub: 0.35, anticipatePin: 1,
    onUpdate: (self) => {
      const p = self.progress;
      if (pin.classList.contains('has-video') && video.duration && isFinite(video.duration)) {
        video.currentTime = p * Math.max(0, video.duration - 0.05);
      }
      if (bar) bar.style.transform = 'scaleX(' + p + ')';
      if (hint) hint.classList.toggle('off', p > 0.06);
      const ci = p < 0.45 ? 0 : p < 0.8 ? 1 : 2;
      chs.forEach((c, i) => c.classList.toggle('active', i === ci));
    },
  });
})();

/* ================= v7: slot video propagacion Rapa Nui ================= */
(() => {
  const prop = document.querySelector('.propagation');
  const pv = document.getElementById('prop-video');
  if (!prop || !pv) return;
  const V = './assets/videos/prop-rapanui.mp4';
  let ok = false;
  fetch(V, { method: 'HEAD' }).then((r) => {
    if (!r.ok) throw new Error('no-video');
    pv.src = V;
    pv.addEventListener('loadedmetadata', () => { ok = true; prop.classList.add('has-video'); }, { once: true });
    pv.load();
  }).catch(() => {});
  ScrollTrigger.create({
    trigger: '#proyectos', start: 'top 62%', end: 'bottom 78%', scrub: 0.4,
    onUpdate: (self) => {
      if (ok && pv.duration && isFinite(pv.duration)) {
        pv.currentTime = self.progress * Math.max(0, pv.duration - 0.05);
      }
    },
  });
})();

/* ================= v8: video ambiental en banda CTA ================= */
(() => {
  const band = document.querySelector('.cta-band');
  const cv = document.getElementById('cta-video');
  if (!band || !cv) return;
  const V = './assets/videos/cta-loop.mp4';
  fetch(V, { method: 'HEAD' }).then((r) => {
    if (!r.ok) throw new Error('no-video');
    cv.src = V;
    cv.addEventListener('canplay', () => {
      band.classList.add('has-video');
      cv.play().catch(() => {});
    }, { once: true });
    cv.load();
  }).catch(() => {});
})();

/* ================= v10: videos provisionales en fichas de capacidades ================= */
(() => {
  document.querySelectorAll('.cap-video').forEach((v) => {
    const slot = v.dataset.slot;
    if (!slot) return;
    const card = v.closest('.cap-card');
    const V = './assets/videos/' + slot + '.mp4';
    fetch(V, { method: 'HEAD' }).then((r) => {
      if (!r.ok) throw new Error('no-video');
      v.src = V;
      v.addEventListener('canplay', () => {
        if (card) card.classList.add('has-video');
        ScrollTrigger.create({
          trigger: card, start: 'top 90%', end: 'bottom 0%', scrub: 0.35,
          onUpdate: (self) => {
            if (v.duration && isFinite(v.duration)) {
              v.currentTime = self.progress * Math.max(0, v.duration - 0.05);
            }
          },
        });
      }, { once: true });
      v.load();
    }).catch(() => {});
  });
})();

/* ================= v11: marker sweep en pull quote (patron OpenDesign) ================= */
(() => {
  const q = document.querySelector('.pull');
  if (!q) return;
  ScrollTrigger.create({
    trigger: q, start: 'top 85%', once: true,
    onEnter: () => q.classList.add('swept'),
  });
})();

/* ================= v12: aria-pressed en switch de idioma ================= */
(() => {
  const sync = () => document.querySelectorAll('[data-lang]').forEach((s) => {
    s.setAttribute('aria-pressed', String(s.classList.contains('on')));
  });
  sync();
  window.addEventListener('langchange', sync);
  document.querySelectorAll('[data-lang]').forEach((s) => s.addEventListener('click', () => setTimeout(sync, 0)));
})();

/* ================= v13: productos keynote (4 vistas scrub o video) ================= */
(() => {
  document.querySelectorAll('.prod').forEach((sec) => {
    const imgs = sec.querySelectorAll('.prod-stack img');
    const dots = sec.querySelectorAll('.prod-dots i');
    const vid = sec.querySelector('.prod-video');
    const slot = vid && vid.dataset.slot;
    if (slot) {
      const V = './assets/videos/' + slot + '.mp4';
      fetch(V, { method: 'HEAD' }).then((r) => {
        if (!r.ok) throw new Error('no-video');
        vid.src = V;
        vid.addEventListener('loadedmetadata', () => sec.classList.add('has-video'), { once: true });
        vid.load();
      }).catch(() => {});
    }
    ScrollTrigger.create({
      trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.35,
      onUpdate: (self) => {
        const p = self.progress;
        if (sec.classList.contains('has-video') && vid.duration && isFinite(vid.duration)) {
          vid.currentTime = p * Math.max(0, vid.duration - 0.05);
          return;
        }
        const idx = Math.min(imgs.length - 1, Math.floor(p * imgs.length));
        imgs.forEach((im, i) => im.classList.toggle('on', i === idx));
        dots.forEach((d, i) => d.classList.toggle('on', i === idx));
        const tf = 'scale(' + (1 + p * 0.10).toFixed(4) + ') rotateY(' + ((p - 0.5) * 5).toFixed(2) + 'deg)';
        const stack = sec.querySelector('.prod-stack');
        if (stack) stack.style.transform = tf;
        if (vid) vid.style.transform = tf;
      },
    });
  });
})();

/* ================= v14: cursor glow (pointer fine only) ================= */
(() => {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const g = document.createElement('div');
  g.id = 'cglow';
  document.body.appendChild(g);
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, seen = false;
  addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    if (!seen) { seen = true; document.body.classList.add('has-pointer'); }
  }, { passive: true });
  const tick = () => {
    cx += (x - cx) * 0.12; cy += (y - cy) * 0.12;
    g.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
    requestAnimationFrame(tick);
  };
  tick();
})();

/* ================= v16: pausa de videos fuera de viewport (perf movil) ================= */
(() => {
  const vids = document.querySelectorAll('video');
  if (!vids.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const v = en.target;
      if (!en.isIntersecting) {
        v.pause();
      } else if (v.loop && v.src) {
        v.play().catch(() => {});
      }
    });
  }, { threshold: 0.05 });
  vids.forEach((v) => io.observe(v));
})();


/* ================= LAB v1: film como backbone global + HUD ================= */
(() => {
  const v = document.getElementById('film-video');
  const prog = document.getElementById('hud-progress');
  const chEl = document.getElementById('hud-chapter');
  const secEl = document.getElementById('hud-section');
  if (!v) return;
  const V = './assets/videos/cine.mp4';
  fetch(V, { method: 'HEAD' }).then((r) => { if (!r.ok) throw new Error('x'); v.src = V; v.load(); }).catch(() => {});
  const CH = [0, .32, .55, .82];
  let tgt = 0, curT = 0;
  let lastT = -1;
  const tickFilm = () => {
    curT += (tgt - curT) * 0.14;
    if (v.duration && isFinite(v.duration) && Math.abs(curT - lastT) > 0.0022) {
      v.currentTime = curT * Math.max(0, v.duration - .05); lastT = curT;
    }
    requestAnimationFrame(tickFilm);
  };
  requestAnimationFrame(tickFilm);
  ScrollTrigger.create({
    trigger: document.documentElement, start: 0, end: 'max', scrub: .4,
    onUpdate: (self) => {
      const p = self.progress;
      tgt = p;
      if (prog) prog.style.height = (p * 100).toFixed(2) + '%';
      const ci = p < CH[1] ? 0 : p < CH[2] ? 1 : p < CH[3] ? 2 : 3;
      if (chEl) chEl.textContent = 'CH 0' + (ci + 1);
      const fl = document.getElementById('film-layer'); if (fl) fl.dataset.ch = String(ci);
    },
  });
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.fromTo(v, { scale: 1.1 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: document.documentElement, start: 0, end: 'max', scrub: .8 },
    });
  }
  let decTok = 0;
  const GL = '\u25ae\u25af/<>\u00b7\u201401#';
  const decodeSec = (txt) => {
    const tok = ++decTok; let f = 0; const total = 12;
    const iv = setInterval(() => {
      if (tok !== decTok) { clearInterval(iv); return; }
      f++;
      secEl.textContent = txt.split('').map((c, i) => (c === ' ' ? ' ' : (i < (f / total) * txt.length ? c : GL[(Math.random() * GL.length) | 0]))).join('');
      if (f >= total) { clearInterval(iv); secEl.textContent = txt; }
    }, 30);
  };
  document.querySelectorAll('section[id]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: (st) => { if (st.isActive && secEl) decodeSec((sec.id || '').toUpperCase()); },
    });
  });
})();

/* ================= LAB v2: dossier overlay + tilt 3D de sheets ================= */
(() => {
  const d = document.getElementById('dossier');
  const open = document.getElementById('dossier-open');
  const close = document.getElementById('dossier-close');
  if (d && open && close) {
    const set = (v) => { d.classList.toggle('open', v); d.setAttribute('aria-hidden', String(!v)); if (v) close.focus(); else open.focus(); };
    open.addEventListener('click', () => set(true));
    close.addEventListener('click', () => set(false));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && d.classList.contains('open')) set(false); });
  }
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.utils.toArray('.sheet-glass').forEach((sh) => {
      gsap.fromTo(sh, { rotateX: 3.2, transformPerspective: 1200 }, {
        rotateX: 0, ease: 'none',
        scrollTrigger: { trigger: sh, start: 'top 92%', end: 'top 40%', scrub: .4 },
      });
    });
  }
})();

/* ================= v18: line-mask reveals + parallax depth + tilt 3D titular ================= */
(() => {
  gsap.utils.toArray('.section-sub, .prod-lead').forEach((el) => {
    el.classList.add('lm');
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => el.classList.add('in') });
  });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.utils.toArray('.film-breath span').forEach((el) => {
    gsap.fromTo(el, { y: 46 }, {
      y: -46, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: .5 },
    });
  });
  gsap.utils.toArray('.sheet-glass, .window').forEach((sh) => {
    gsap.fromTo(sh, { scale: .985 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: sh, start: 'top 90%', end: 'top 45%', scrub: .4 },
    });
  });
  const ht = document.querySelector('#hero h1');
  if (ht && window.matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', (e) => {
      const x = (e.clientX / innerWidth - .5), y = (e.clientY / innerHeight - .5);
      ht.style.transform = 'perspective(900px) rotateY(' + (x * 5).toFixed(2) + 'deg) rotateX(' + (-y * 4).toFixed(2) + 'deg)';
    }, { passive: true });
  }
})();

/* ================= v20: monitores REC para media provisorio ================= */
(() => {
  const sel = '.prov-none';
  const wrap = () => document.querySelectorAll(sel).forEach((m) => {
    if (m.parentElement && m.parentElement.classList.contains('mon-frame')) return;
    const f = document.createElement('div'); f.className = 'mon-frame';
    m.parentNode.insertBefore(f, m); f.appendChild(m);
  });
  wrap();
  window.addEventListener('langchange', wrap);
})();

/* ================= v26: KNOB de sintonia arrastrable (interaccion firma) ================= */
(() => {
  const knob = document.getElementById('dial-knob');
  if (!knob) return;
  const pinned = () => window.matchMedia('(min-width: 901px)').matches;
  const spec = document.getElementById('espectro');
  const range = () => ScrollTrigger.getAll().find((t) => t.trigger === spec) || null;
  let p = 0, dragging = false, lx = 0, ly = 0;
  const knobSync = () => {
    const deg = ((specState.band + specState.ratio) / bands.length) * 1080;
    knob.style.setProperty('--rot', deg.toFixed(1) + 'deg');
    knob.setAttribute('aria-valuenow', String(Math.round((specState.band + specState.ratio) / bands.length * 100)));
  };
  const apply = (np) => {
    p = Math.min(0.999, Math.max(0, np));
    const st = range();
    if (pinned() && st) window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: 'auto' });
    else { updateSpectrum(p); knobSync(); }
  };
  const cur = () => {
    const st = range();
    return st && pinned() ? (window.scrollY - st.start) / (st.end - st.start) : (specState.band + specState.ratio) / bands.length;
  };
  knob.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; knob.setPointerCapture(e.pointerId); e.preventDefault(); });
  knob.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    apply(cur() + (dx - dy) * 0.00045);
  });
  const up = () => { dragging = false; };
  knob.addEventListener('pointerup', up); knob.addEventListener('pointercancel', up);
  knob.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { apply(cur() + 0.02); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { apply(cur() - 0.02); e.preventDefault(); }
  });
  (function loop() { knobSync(); requestAnimationFrame(loop); })();
})();

/* ============ v30: velo de transicion entre capitulos (P13) ============ */
(() => {
  const veil = document.getElementById('chapter-veil');
  if (!veil || typeof ScrollTrigger === 'undefined') return;
  const folioEl = veil.querySelector('.veil-folio');
  const titleEl = veil.querySelector('.veil-title');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let busy = false, armed = false;
  setTimeout(() => { armed = true; }, 3000);
  document.querySelectorAll('.folio').forEach((f) => {
    const sec = f.closest('section');
    if (!sec || sec.id === 'hero' || sec.id === 'cine') return;
    const h = sec.querySelector('h2, h1');
    if (!h) return;
    const fire = () => {
      if (busy || !armed) return;
      busy = true;
      folioEl.textContent = f.textContent.trim();
      titleEl.textContent = h.textContent.trim();
      veil.classList.add('on');
      setTimeout(() => {
        veil.classList.remove('on');
        setTimeout(() => { busy = false; }, 340);
      }, 640);
    };
    ScrollTrigger.create({ trigger: sec, start: 'top 55%', onEnter: fire, onEnterBack: fire });
  });
})();
