// ==============================
// CHEQUE WRITER PH – main.js
// ==============================

// ── Navbar scroll shadow ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ── Smooth scroll for anchor links ──
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── Intersection Observer: animate feature cards on scroll ──
const cards = document.querySelectorAll('.feature-card');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

cards.forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(24px)';
  card.style.transition = `opacity 0.5s ease ${card.style.getPropertyValue('--delay')}, transform 0.5s ease ${card.style.getPropertyValue('--delay')}`;
  observer.observe(card);
});

// ── Fetch latest release info from GitHub API ──
async function fetchLatestRelease() {
  // TODO: Replace with your actual GitHub username and repo name
  const GITHUB_USER = 'yagame672-blip';
  const GITHUB_REPO = 'cheque-writer-ph';

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases/latest`);
    if (!res.ok) return;
    const data = await res.json();

    const asset = data.assets?.find(a => a.name.endsWith('.zip') || a.name.endsWith('.exe'));
    if (!asset) return;

    const downloadUrl = asset.browser_download_url;
    const sizeMB = (asset.size / (1024 * 1024)).toFixed(0);
    const version = data.tag_name || '';

    // Update all download buttons
    document.querySelectorAll('[id$="download-btn"]').forEach(btn => {
      btn.href = downloadUrl;
    });

    // Update file size badge
    const sizeTag = document.getElementById('file-size');
    if (sizeTag) sizeTag.textContent = `~${sizeMB} MB`;

    // Show version if available
    if (version) {
      const badge = document.querySelector('.hero-badge span:last-child');
      if (badge) badge.textContent = `Libre ang Download · 100% Offline · ${version}`;
    }

    console.log(`✅ Cheque Writer PH ${version} – Download: ${downloadUrl}`);
  } catch (err) {
    // Silently fail – download buttons retain the fallback href
    console.warn('Could not fetch release info from GitHub:', err.message);
  }
}

fetchLatestRelease();
