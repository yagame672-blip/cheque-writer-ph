// Cheque Writer PH — calibration guide: the step stage, the alignment simulator, and the motion layer.
(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = !reduced && root.classList.contains('motion') && window.gsap && window.ScrollTrigger;
  window.__cwReady = true;
  if (!animate) root.classList.remove('motion');

  // ---------- The stage follows whichever step sits mid-screen ----------
  const stage = document.getElementById('cal-stage');
  const steps = [...document.querySelectorAll('.cal-step')];
  const show = (n) => {
    stage.dataset.step = n;
    steps.forEach((s) => s.classList.toggle('is-active', s.dataset.step === n));
  };
  show('1');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) show(e.target.dataset.step); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));
  }

  // Phone: a pinned stage would sit on top of the text, so every step gets its own copy of the
  // scene, which plays the first time that step comes into view.
  steps.forEach((s) => {
    const copy = stage.cloneNode(true);
    copy.removeAttribute('id');
    copy.dataset.step = '1';
    s.prepend(copy);
  });
  if ('IntersectionObserver' in window) {
    const seen = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      seen.unobserve(e.target);
      const copy = e.target.querySelector('.cal-stage');
      copy.dataset.step = e.target.dataset.step;
    }), { threshold: 0.35 });
    steps.forEach((s) => seen.observe(s));
  } else {
    steps.forEach((s) => { s.querySelector('.cal-stage').dataset.step = s.dataset.step; });
  }

  // The typewriter loop plays only while it is on screen, and never under reduced motion.
  const clip = document.querySelector('.cal-then video');
  if (clip && !reduced && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { clip.preload = 'auto'; clip.play().catch(() => {}); } else clip.pause();
    }), { threshold: 0.25 }).observe(clip);
  }

  // ---------- The simulator ----------
  // Same convention as the app: +X moves the print right, +Y moves it up. Work in hundredths of an inch.
  const CHEQUE_IN = 8.75;
  const cheque = document.getElementById('sim-cheque');
  const print = document.getElementById('sim-print');
  const outX = document.getElementById('out-x');
  const outY = document.getElementById('out-y');
  const status = document.getElementById('sim-status');
  let err = { x: 8, y: -5 };   // where the printer actually lands: 0.08 in right, 0.05 in low
  let off = { x: 0, y: 0 };    // what the visitor has entered

  const fmt = (h) => `${h > 0 ? '+' : h < 0 ? '−' : ''}${(Math.abs(h) / 100).toFixed(2)}`;
  const inches = (h) => (Math.abs(h) / 100).toFixed(2);

  function describe(x, y) {
    const parts = [];
    if (x) parts.push(`${x > 0 ? 'pakanan' : 'pakaliwa'} ng ${inches(x)}`);
    if (y) parts.push(`${y > 0 ? 'pataas' : 'pababa'} ng ${inches(y)}`);
    return `${parts.join(' at ')} pulgada ang print.`;
  }

  function render() {
    const ppi = cheque.clientWidth / CHEQUE_IN;
    const x = err.x + off.x;
    const y = err.y + off.y;
    print.style.transform = `translate(${(x / 100) * ppi}px, ${(-y / 100) * ppi}px)`;
    outX.textContent = fmt(off.x);
    outY.textContent = fmt(off.y);
    const ok = x === 0 && y === 0;
    cheque.classList.toggle('is-ok', ok);
    status.classList.toggle('is-ok', ok);
    status.textContent = ok
      ? `Tugma na. Sa app, ito ang ilalagay mo sa Global Fine Offset: X ${fmt(off.x)}, Y ${fmt(off.y)}.`
      : `${describe(x, y).charAt(0).toUpperCase()}${describe(x, y).slice(1)}`;
  }

  function nudge(axis, d) { off[axis] = Math.max(-50, Math.min(50, off[axis] + d)); render(); }

  document.querySelectorAll('.sim-axis button').forEach((b) => b.addEventListener('click', () => nudge(b.dataset.axis, Number(b.dataset.d))));
  cheque.addEventListener('keydown', (e) => {
    const map = { ArrowLeft: ['x', -1], ArrowRight: ['x', 1], ArrowUp: ['y', 1], ArrowDown: ['y', -1] };
    if (!map[e.key]) return;
    e.preventDefault();
    nudge(...map[e.key]);
  });
  document.getElementById('sim-new').addEventListener('click', () => {
    const pick = () => { let v = 0; while (Math.abs(v) < 2) v = Math.round(Math.random() * 24) - 12; return v; };
    err = { x: pick(), y: pick() };
    off = { x: 0, y: 0 };
    render();
  });
  window.addEventListener('resize', render, { passive: true });
  render();

  if (!animate) return;

  // ---------- Motion ----------
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    const lenis = new window.Lenis({ anchors: { offset: -72 } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // The hero arrives within a second; the banknote settles in after the words.
  gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.8 } })
    .fromTo('.cal-hero h1', { clipPath: 'inset(0 0 100% 0)', y: 28 }, { clipPath: 'inset(0 0 -10% 0)', y: 0 })
    .from('.cal-lead, .cal-jump', { y: 18, opacity: 0, stagger: 0.06 }, '<0.1')
    .from('.cal-hero-pic', { y: 36, opacity: 0, duration: 1 }, '<0.1');

  // A slow drift on the banknote as the page moves.
  gsap.to('.cal-hero-pic img', { yPercent: -6, scale: 1.04, ease: 'none', scrollTrigger: { trigger: '.cal-hero', start: 'top top', end: 'bottom top', scrub: true } });

  [
    ['.cal-story', '.cal-story-title, .cal-stage-wrap'],
    ['.sim', '.sim-title, .sim-lead, .sim-cheque, .sim-panel'],
    ['.cal-then', '.cal-then-copy h2, .cal-then-copy p, .cal-then figure'],
    ['.ref', '.ref-title, .ref-note, .ref-table, .tips li'],
  ].forEach(([section, parts]) => {
    gsap.from(document.querySelectorAll(`${section} :is(${parts})`), {
      opacity: 0, y: 28, duration: 1, ease: 'expo.out', stagger: 0.07,
      scrollTrigger: { trigger: section, start: 'top 80%', once: true },
    });
  });

  gsap.fromTo('.foot-name', { yPercent: 30 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
