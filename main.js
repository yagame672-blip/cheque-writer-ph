// Cheque Writer PH — progressive enhancement and GitHub release metadata
(() => {
  const navbar = document.querySelector('.nav-shell');
  window.addEventListener('scroll', () => { if (navbar) navbar.style.boxShadow = window.scrollY > 12 ? '0 8px 28px #10223b0c' : 'none'; }, { passive: true });
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) { event.preventDefault(); target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
    });
  });

  // Reveal sections as they enter the viewport, with a safe fallback.
  const revealTargets = document.querySelectorAll('.section-head, .feature, .step, .banks, .pricing-grid, .final-cta .cta-inner, .trust-item');
  revealTargets.forEach(element => element.classList.add('reveal'));
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealTargets.forEach(element => revealObserver.observe(element));
  } else {
    revealTargets.forEach(element => element.classList.add('is-visible'));
  }

  const copyButton = document.getElementById('copy-maya');
  if (copyButton) copyButton.addEventListener('click', async () => {
    const original = 'Kopyahin #';
    try { await navigator.clipboard.writeText('09636737972'); copyButton.textContent = 'Na-copy na ✓'; }
    catch (_) { copyButton.textContent = 'Maya: 09636737972'; }
    window.setTimeout(() => { copyButton.textContent = original; }, 1800);
  });
  async function fetchLatestRelease() {
    const user = 'yagame672-blip'; const repo = 'cheque-writer-ph';
    try {
      const response = await fetch(`https://api.github.com/repos/${user}/${repo}/releases/latest`);
      if (!response.ok) return;
      const release = await response.json();
      const asset = (release.assets || []).find(item => /\.(zip|exe)$/i.test(item.name));
      if (!asset) return;
      document.querySelectorAll('#main-download-btn, #cta-download-btn').forEach(button => { button.href = asset.browser_download_url; });
      const sizeTag = document.getElementById('file-size');
      if (sizeTag) sizeTag.textContent = `~${Math.round(asset.size / (1024 * 1024))} MB`;
      const version = release.tag_name;
      const badge = document.querySelector('.eyebrow');
      if (version && badge) badge.setAttribute('aria-label', `Latest release ${version}`);
    } catch (error) { console.warn('GitHub release info unavailable; fallback download URL remains active.', error); }
  }
  fetchLatestRelease();
})();
