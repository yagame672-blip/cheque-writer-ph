// Cheque Writer PH — live cheque demo, copy button, and GitHub release metadata
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
  const amountBox = document.getElementById('cq-amount');
  const wordsLine = document.getElementById('cq-words');
  let typingTimer = null;

  // Long amounts shrink to stay on one line, like the app fitting text into the words field.
  function fitWords(text) {
    // On phones (--k > 1) the words may wrap to a second line, so they can stay twice as large.
    const scale = parseFloat(getComputedStyle(wordsLine).getPropertyValue('--k')) || 1;
    const fit = (scale > 1 ? 250 : 120) / Math.max(text.length, 1);
    wordsLine.style.fontSize = `min(calc(2.2cqw * var(--k)), ${fit.toFixed(2)}cqw)`;
  }

  // The amount box is narrow; Courier glyphs are ~0.62em wide, so size to the box's inner width.
  function fitAmount(text) {
    const scale = parseFloat(getComputedStyle(amountBox).getPropertyValue('--k')) || 1;
    const fit = (scale > 1 ? 30 : 20) / (0.62 * Math.max(text.length, 1));
    amountBox.style.fontSize = `min(calc(2.5cqw * var(--k)), ${fit.toFixed(2)}cqw)`;
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

  function update(animate) {
    const parsed = parseAmount(input.value);
    if (!parsed) { amountBox.textContent = ''; showWords('', false); return; }
    amountBox.textContent = formatAmount(parsed);
    fitAmount(amountBox.textContent);
    showWords(amountToWords(parsed), animate);
  }

  if (input && amountBox && wordsLine) {
    input.addEventListener('input', () => update(false));
    input.addEventListener('blur', () => { const parsed = parseAmount(input.value); if (parsed) input.value = formatAmount(parsed); });
    const dateField = document.getElementById('cq-date');
    if (dateField) dateField.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    // Type the words in once, when the cheque first scrolls into view.
    const cheque = document.querySelector('.cheque');
    if ('IntersectionObserver' in window && cheque) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); update(true); }
      }, { threshold: 0.5 });
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
      document.querySelectorAll('#main-download-btn, #cta-download-btn').forEach(button => { button.href = asset.browser_download_url; });
      const sizeTag = document.getElementById('file-size');
      if (sizeTag) sizeTag.textContent = `~${Math.round(asset.size / (1024 * 1024))} MB`;
      const versionTag = document.getElementById('version');
      if (versionTag && release.tag_name) versionTag.textContent = ` Pinakabagong bersyon: ${release.tag_name}.`;
    } catch (error) { console.warn('GitHub release info unavailable; fallback download URL remains active.', error); }
  }
  fetchLatestRelease();
})();
