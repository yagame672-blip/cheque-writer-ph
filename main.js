// Cheque Writer PH — live cheque demo, send-to-PC, copy button, and GitHub release metadata
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  const input = document.getElementById('demo-amount');
  const wordsLine = document.getElementById('cq-words');
  const hint = document.getElementById('demo-hint');
  const status = document.getElementById('demo-status');
  const defaultHint = hint ? hint.textContent : '';
  let typingTimer = null;
  let statusTimer = null;

  function chequeScale() {
    return parseFloat(getComputedStyle(wordsLine).getPropertyValue('--k')) || 1;
  }

  // Fit the words to the line like the app does: shrink first, then wrap to a second
  // (phone: third) line rather than going below a readable size.
  function fitWords(text) {
    const scale = chequeScale();
    const base = 2.2 * scale;
    const avail = scale > 1 ? 88 : 82; // usable line width in cqw
    const glyph = 0.62 * Math.max(text.length, 1);
    let size = Math.min(base, avail / glyph);
    if (size < 1.6 * scale) size = Math.min(base, (avail * (scale > 1 ? 3 : 2) * 0.9) / glyph);
    wordsLine.style.fontSize = `${size.toFixed(2)}cqw`;
  }

  // Keep typed amounts inside the box. While a phone user is typing it stays at 16px or more,
  // because iOS zooms the page into any smaller input on focus; it shrinks to fit on blur.
  function fitAmount(text) {
    const scale = chequeScale();
    const fit = (scale > 1 ? 26 : 17) / (0.62 * Math.max(text.length, 1));
    const size = `min(calc(2.5cqw * var(--k)), ${fit.toFixed(2)}cqw)`;
    input.style.fontSize = scale > 1 && document.activeElement === input ? `max(16px, ${size})` : size;
  }

  function showWords(text, animate) {
    window.clearInterval(typingTimer);
    wordsLine.classList.remove('typing');
    fitWords(text);
    if (!animate || reduceMotion) { wordsLine.textContent = text; return; }
    let shown = 0;
    wordsLine.textContent = '';
    wordsLine.classList.add('typing');
    typingTimer = window.setInterval(() => {
      shown += 1;
      wordsLine.textContent = text.slice(0, shown);
      if (shown >= text.length) { window.clearInterval(typingTimer); wordsLine.classList.remove('typing'); }
    }, 38);
  }

  function setHint(message, isError) {
    hint.textContent = message;
    hint.classList.toggle('is-error', isError);
    input.setAttribute('aria-invalid', isError ? 'true' : 'false');
  }

  // Screen readers hear the result once typing pauses, not on every keystroke.
  function announce(text) {
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => { status.textContent = text; }, 700);
  }

  function update(animate) {
    fitAmount(input.value);
    if (input.value.trim() === '') {
      setHint('Mag-type ng halaga sa amount box.', false);
      showWords('', false);
      return;
    }
    const parsed = parseAmount(input.value);
    if (!parsed) {
      // Keep the last good words on the cheque; say what the box accepts.
      setHint('Numero lang ang puwede, hanggang 999,999,999,999.99.', true);
      return;
    }
    setHint(defaultHint, false);
    const words = amountToWords(parsed);
    showWords(words, animate);
    announce(words);
  }

  if (input && wordsLine && hint && status) {
    input.addEventListener('input', () => update(false));
    input.addEventListener('focus', () => fitAmount(input.value));
    input.addEventListener('blur', () => {
      const parsed = parseAmount(input.value);
      if (parsed) input.value = formatAmount(parsed);
      fitAmount(input.value);
    });
    const dateField = document.getElementById('cq-date');
    if (dateField) {
      const today = new Date();
      dateField.textContent = [today.getMonth() + 1, today.getDate()].map(n => String(n).padStart(2, '0')).join('/') + `/${today.getFullYear()}`;
    }
    // Type the words in once, when the cheque first comes into view.
    const cheque = document.querySelector('.cheque');
    if ('IntersectionObserver' in window && cheque) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); update(true); }
      }, { threshold: 0.4 });
      observer.observe(cheque);
    } else {
      update(false);
    }
  }

  // Security-paper pattern behind the cheque: layered sine bands, drawn once.
  const guilloche = document.getElementById('guilloche');
  if (guilloche) {
    const W = 1000, H = 425, ns = 'http://www.w3.org/2000/svg';
    guilloche.setAttribute('viewBox', `0 0 ${W} ${H}`);
    for (let band = 0; band < 14; band++) {
      let d = '';
      const base = 20 + band * 30, amp = 9 + (band % 3) * 4, freq = 0.018 + (band % 4) * 0.004;
      for (let x = 0; x <= W; x += 6) {
        const y = base + Math.sin(x * freq + band) * amp + Math.sin(x * freq * 2.7) * 3;
        d += `${x ? 'L' : 'M'}${x} ${y.toFixed(1)}`;
      }
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', '0.8');
      guilloche.appendChild(path);
    }
  }

  // The installer only runs on Windows, so everyone else gets a way to send the link to their PC.
  const shareButton = document.getElementById('share-link');
  if (shareButton && !/Windows/i.test(navigator.userAgent)) {
    shareButton.hidden = false;
    document.body.classList.add('not-windows');
    const label = shareButton.lastChild;
    const original = label.textContent;
    const siteUrl = `${location.origin}/`;
    shareButton.addEventListener('click', async () => {
      if (navigator.share) {
        try { await navigator.share({ title: 'Cheque Writer PH', text: 'I-download sa Windows PC:', url: siteUrl }); } catch (_) { /* closed the share sheet */ }
        return;
      }
      try { await navigator.clipboard.writeText(siteUrl); label.textContent = ' Nakopya ang link. I-paste sa email o Messenger.'; }
      catch (_) { label.textContent = ` Buksan sa PC: ${siteUrl}`; }
      window.setTimeout(() => { label.textContent = original; }, 3000);
    });
  }

  const copyButton = document.getElementById('copy-maya');
  if (copyButton) copyButton.addEventListener('click', async () => {
    const original = 'Kopyahin';
    try { await navigator.clipboard.writeText('09636737972'); copyButton.textContent = 'Nakopya na'; }
    catch (_) { copyButton.textContent = 'Kopyahin nang mano-mano'; }
    window.setTimeout(() => { copyButton.textContent = original; }, 1800);
  });

  async function fetchLatestRelease() {
    const user = 'yagame672-blip'; const repo = 'cheque-writer-ph';
    try {
      const response = await fetch(`https://api.github.com/repos/${user}/${repo}/releases/latest`);
      if (!response.ok) return;
      const release = await response.json();
      const assets = release.assets || [];
      const asset = assets.find(item => item.name === 'ChequeWriter_Setup.exe') || assets.find(item => /\.exe$/i.test(item.name));
      if (!asset) return;
      document.querySelectorAll('#main-download-btn, #pricing-download-btn, #cta-download-btn').forEach(button => { button.href = asset.browser_download_url; });
      const sizeTag = document.getElementById('file-size');
      if (sizeTag) sizeTag.textContent = `~${Math.round(asset.size / (1024 * 1024))} MB`;
      const versionTag = document.getElementById('version');
      if (versionTag && release.tag_name) versionTag.textContent = ` Pinakabagong bersyon: ${release.tag_name}.`;
    } catch (error) { console.warn('GitHub release info unavailable; fallback download URL remains active.', error); }
  }
  fetchLatestRelease();
})();
