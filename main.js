// Cheque Writer PH — live cheque demo, feature switches, send-the-link form, release metadata and the motion layer.
(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = !reduced && root.classList.contains('motion') && window.gsap && window.ScrollTrigger;
  window.__cwReady = true;
  if (!animate) root.classList.remove('motion');

  // Same rules as convert_amount_to_words() in the desktop app: no "and", commas between scales.
  const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
    'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const SCALES = ['', 'Thousand', 'Million', 'Billion'];

  function belowThousand(n) {
    const words = [];
    if (n >= 100) { words.push(`${ONES[Math.floor(n / 100)]} Hundred`); n %= 100; }
    if (n >= 20) { words.push(TENS[Math.floor(n / 10)]); if (n % 10) words.push(ONES[n % 10]); }
    else if (n > 0) words.push(ONES[n]);
    return words.join(' ');
  }

  function intToWords(n) {
    if (n === 0) return 'Zero';
    const last = n % 1000;
    const chunks = [];
    for (let scale = 0; n > 0; scale++, n = Math.floor(n / 1000)) {
      const chunk = n % 1000;
      if (chunk) chunks.push(SCALES[scale] ? `${belowThousand(chunk)} ${SCALES[scale]}` : belowThousand(chunk));
    }
    chunks.reverse();
    // num2words writes "one thousand and one" (no comma) when the final group is under 100.
    if (chunks.length > 1 && last > 0 && last < 100) return `${chunks.slice(0, -1).join(', ')} ${chunks[chunks.length - 1]}`;
    return chunks.join(', ');
  }

  // Up to 999,999,999,999.99 — the largest amount the Billion scale can spell.
  function parseAmount(text) {
    const clean = String(text).replace(/[,₱\s]/g, '');
    if (!/^\d{1,12}(\.\d{0,2})?$/.test(clean)) return null;
    const [whole, frac = ''] = clean.split('.');
    return { pesos: Number(whole), cents: Number((frac + '00').slice(0, 2)) };
  }

  function amountToWords({ pesos, cents }) {
    return cents > 0 ? `${intToWords(pesos)} Pesos ${String(cents).padStart(2, '0')}/100 Only` : `${intToWords(pesos)} Pesos Only`;
  }

  function formatAmount({ pesos, cents }) {
    return `${pesos.toLocaleString('en-US')}.${String(cents).padStart(2, '0')}`;
  }

  // ---------- The live cheque ----------
  const input = document.getElementById('demo-amount');
  const amountBox = document.getElementById('cq-amount');
  const wordsLine = document.getElementById('cq-words');
  const hint = document.getElementById('demo-hint');
  const status = document.getElementById('demo-status');
  const defaultHint = hint.textContent;
  let typingTimer = null;
  let statusTimer = null;

  const chequeScale = () => parseFloat(getComputedStyle(wordsLine).getPropertyValue('--k')) || 1;

  // Shrink long words first, then wrap to a second (phone: third) line before they get unreadable.
  function fitWords(text) {
    const scale = chequeScale();
    const base = 2.2 * scale;
    const avail = scale > 1 ? 88 : 82;
    const glyph = 0.62 * Math.max(text.length, 1);
    let size = Math.min(base, avail / glyph);
    if (size < 1.6 * scale) size = Math.min(base, (avail * (scale > 1 ? 3 : 2) * 0.9) / glyph);
    wordsLine.style.fontSize = `${size.toFixed(2)}cqw`;
  }

  function fitAmount(text) {
    const fit = (chequeScale() > 1 ? 26 : 17) / (0.62 * Math.max(text.length, 1));
    amountBox.style.fontSize = `min(calc(2.5cqw * var(--k)), ${fit.toFixed(2)}cqw)`;
  }

  function showWords(text, animateIt) {
    window.clearInterval(typingTimer);
    wordsLine.classList.remove('typing');
    fitWords(text);
    if (!animateIt || reduced) { wordsLine.textContent = text; return; }
    let shown = 0;
    wordsLine.textContent = '';
    wordsLine.classList.add('typing');
    typingTimer = window.setInterval(() => {
      shown += 1;
      wordsLine.textContent = text.slice(0, shown);
      if (shown >= text.length) { window.clearInterval(typingTimer); wordsLine.classList.remove('typing'); }
    }, 32);
  }

  function setHint(message, isError) {
    hint.textContent = message;
    hint.classList.toggle('is-error', isError);
    input.setAttribute('aria-invalid', isError ? 'true' : 'false');
  }

  function update(animateIt) {
    if (input.value.trim() === '') {
      setHint('Mag-type ng halaga.', false);
      amountBox.textContent = '';
      showWords('', false);
      return;
    }
    const parsed = parseAmount(input.value);
    if (!parsed) {
      // Keep the last good cheque; say what the line accepts.
      setHint('Numero lang ang puwede, hanggang 999,999,999,999.99.', true);
      return;
    }
    setHint(defaultHint, false);
    amountBox.textContent = formatAmount(parsed);
    fitAmount(amountBox.textContent);
    const words = amountToWords(parsed);
    showWords(words, animateIt);
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => { status.textContent = words; }, 700);
  }

  input.addEventListener('input', () => update(false));
  input.addEventListener('blur', () => { const p = parseAmount(input.value); if (p) input.value = formatAmount(p); });
  document.querySelectorAll('.try-examples button').forEach((b) => b.addEventListener('click', () => {
    input.value = b.dataset.amount;
    update(true);
  }));
  const today = new Date();
  document.getElementById('cq-date').textContent = [today.getMonth() + 1, today.getDate()].map((n) => String(n).padStart(2, '0')).join('/') + `/${today.getFullYear()}`;

  // Type the words in once, the first time the cheque is seen.
  const cheque = document.getElementById('cheque');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); update(true); }
    }, { threshold: 0.5 });
    io.observe(cheque);
  } else {
    update(false);
  }

  // Security-paper pattern behind the live cheque: layered sine bands, drawn once.
  const guilloche = document.getElementById('guilloche');
  if (guilloche) {
    const W = 1000, ns = 'http://www.w3.org/2000/svg';
    guilloche.setAttribute('viewBox', `0 0 ${W} 425`);
    for (let band = 0; band < 14; band++) {
      let d = '';
      const base = 20 + band * 30, amp = 9 + (band % 3) * 4, freq = 0.018 + (band % 4) * 0.004;
      for (let x = 0; x <= W; x += 6) d += `${x ? 'L' : 'M'}${x} ${(base + Math.sin(x * freq + band) * amp + Math.sin(x * freq * 2.7) * 3).toFixed(1)}`;
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', '0.8');
      guilloche.appendChild(path);
    }
  }

  // ---------- Feature switches ----------
  document.querySelectorAll('.band .switch').forEach((sw) => sw.addEventListener('click', () => {
    const on = sw.getAttribute('aria-checked') !== 'true';
    sw.setAttribute('aria-checked', String(on));
    sw.closest('.band').classList.toggle('is-on', on);
  }));

  // ---------- Getting the installer onto a Windows PC ----------
  const siteUrl = 'https://cheque-writer-ph.vercel.app/';
  const shareButton = document.getElementById('share-link');
  if (shareButton && !/Windows/i.test(navigator.userAgent)) {
    shareButton.hidden = false;
    const original = shareButton.textContent;
    shareButton.addEventListener('click', async () => {
      if (navigator.share) {
        try { await navigator.share({ title: 'Cheque Writer PH', text: 'I-download sa Windows PC:', url: siteUrl }); } catch (_) { /* closed */ }
        return;
      }
      try { await navigator.clipboard.writeText(siteUrl); shareButton.textContent = 'Nakopya ang link. I-paste sa email o Messenger.'; }
      catch (_) { shareButton.textContent = `Buksan sa PC: ${siteUrl}`; }
      window.setTimeout(() => { shareButton.textContent = original; }, 3000);
    });
  }

  const sendForm = document.getElementById('send-form');
  sendForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const to = document.getElementById('send-email').value.trim();
    const subject = encodeURIComponent('Cheque Writer PH download link');
    const body = encodeURIComponent(`Buksan ito sa Windows PC para i-download ang Cheque Writer PH:\n${siteUrl}`);
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`;
  });

  const copyButton = document.getElementById('copy-maya');
  copyButton.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('09636737972'); copyButton.textContent = 'Nakopya na'; }
    catch (_) { copyButton.textContent = 'Kopyahin nang mano-mano'; }
    window.setTimeout(() => { copyButton.textContent = 'Kopyahin'; }, 1800);
  });

  (async function fetchLatestRelease() {
    try {
      const response = await fetch('https://api.github.com/repos/yagame672-blip/cheque-writer-ph/releases/latest');
      if (!response.ok) return;
      const release = await response.json();
      const assets = release.assets || [];
      const asset = assets.find((a) => a.name === 'ChequeWriter_Setup.exe') || assets.find((a) => /\.exe$/i.test(a.name));
      if (!asset) return;
      document.querySelectorAll('#pricing-download-btn, #cta-download-btn').forEach((a) => { a.href = asset.browser_download_url; });
      document.getElementById('file-size').textContent = `~${Math.round(asset.size / (1024 * 1024))} MB`;
      if (release.tag_name) document.getElementById('version').textContent = ` Pinakabagong bersyon: ${release.tag_name}.`;
    } catch (error) { console.warn('GitHub release info unavailable; fallback download URL remains active.', error); }
  })();

  // The typewriter loop plays only while it is on screen, and never under reduced motion.
  const clip = document.querySelector('.story-clip video');
  if (clip && !reduced && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { clip.preload = 'auto'; clip.play().catch(() => {}); } else clip.pause();
    }), { threshold: 0.25 }).observe(clip);
  }

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
  const mm = gsap.matchMedia();

  // Hero entrance: the two halves arrive from their edges, the reel rises between them.
  // Settled within about a second, so the title is readable straight away.
  gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.8 } })
    // A clip reveal rather than a fade, so the headline is never shown at low contrast.
    .fromTo('.half-l', { clipPath: 'inset(0 0 100% 0)', y: 24 }, { clipPath: 'inset(0 0 0% 0)', y: 0 })
    .fromTo('.half-r', { clipPath: 'inset(0 0 100% 0)', y: 24 }, { clipPath: 'inset(0 0 0% 0)', y: 0 }, '<0.06')
    .fromTo('.reel', { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.9 }, '<0.1')
    .from('.hero-foot', { opacity: 0, y: 16 }, '<0.15');

  // Phone: the reel's frames take turns in one place.
  mm.add('(max-width: 760px)', () => {
    const track = document.querySelector('.reel-track');
    const frames = [...track.querySelectorAll('.frame')];
    let i = 0;
    track.classList.add('cycling');
    frames[0].classList.add('is-shown');
    const timer = window.setInterval(() => {
      frames[i].classList.remove('is-shown');
      i = (i + 1) % frames.length;
      frames[i].classList.add('is-shown');
    }, 3200);
    return () => { window.clearInterval(timer); track.classList.remove('cycling'); frames.forEach((f) => f.classList.remove('is-shown')); };
  });

  // Signature move (desktop): the sentence holds while the reel passes through it.
  mm.add('(min-width: 761px)', () => {
    const track = document.querySelector('.reel-track');
    const sheet = document.querySelector('.testprint');
    // One scrubbed timeline: the reel advances three frames, and while the calibration
    // frame is centred its test sheet slides onto the cheque lines.
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: 0.6, snap: { snapTo: 1 / 3, duration: 0.4, ease: 'power2.out' } },
    })
      .to(track, { '--step': 3, duration: 3 }, 0)
      .fromTo(sheet, { '--tx': '3.2cqw', '--ty': '2.4cqw' }, { '--tx': '0cqw', '--ty': '0cqw', duration: 0.5, ease: 'power2.out' }, 1.6);
  });

  // Every section's parts enter once: heading, then text, then picture.
  const groups = [
    ['.try', '.try-title, .try-line, .try-answer, .try-examples'],
    ['.story', '.story-copy h2, .story-copy p, .story-machine, .story-clip'],
    ['.features', '.features-title, .band'],
    ['.banks', '.banks-title, .banks-photo, .bank-rows li, .banks-note'],
    ['.how', '.how-title, .stage-notes li'],
    ['.pricing', '.price-say, .price-row > *, .pay h3, .maya, .pay-steps li'],
    ['.faq', '.faq-title, .faq-list details'],
  ];
  groups.forEach(([section, parts]) => {
    gsap.from(document.querySelectorAll(`${section} :is(${parts})`), {
      opacity: 0, y: 28, duration: 1, ease: 'expo.out', stagger: 0.07,
      scrollTrigger: { trigger: section, start: 'top 80%', once: true },
    });
  });

  // The progress bar fills stage by stage.
  gsap.from('.stage', {
    scaleX: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12,
    scrollTrigger: { trigger: '.stages', start: 'top 85%', once: true },
  });

  // The street postcard drifts slowly as it passes.
  gsap.fromTo('.street img', { scale: 1.12, yPercent: -4 }, {
    scale: 1, yPercent: 4, ease: 'none',
    scrollTrigger: { trigger: '.street', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  // The price chip lands on its line.
  // Never hidden: the price is the one fact this section must show even if the trigger never fires.
  gsap.from('.price-chip', {
    scale: 0.7, rotate: -6, duration: 0.9, ease: 'back.out(2.2)',
    scrollTrigger: { trigger: '.price-say', start: 'top 75%', once: true },
  });

  // The name in the footer slides in under the invitation.
  gsap.fromTo('.foot-name', { xPercent: 6 }, {
    xPercent: -4, ease: 'none',
    scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });

  document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
