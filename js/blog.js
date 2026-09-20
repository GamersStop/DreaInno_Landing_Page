/**
 * DreaInno Blog Client-Side Scripts
 * Reading progress bar, category filter, mobile menu toggle
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Reading Progress Bar
  const progressBar = document.getElementById('readingProgressBar');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const scrolled = (window.scrollY / docHeight) * 100;
        progressBar.style.width = Math.min(100, Math.max(0, scrolled)) + '%';
      }
    }, { passive: true });
  }

  // 2. Category Filter (Hub page)
  const filterBtns = document.querySelectorAll('.filter-btn');
  const blogCards = document.querySelectorAll('.blog-card[data-category]');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      blogCards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 3. Mobile Menu Toggle
  const menuToggle = document.getElementById('mobileMenuToggle') || document.querySelector('.mobile-menu-toggle');
  const mobileDrawer = document.getElementById('mobileDrawer');

  if (menuToggle && mobileDrawer) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', !expanded);
      mobileDrawer.classList.toggle('is-active');
      document.body.classList.toggle('drawer-open');
    });

    const drawerLinks = mobileDrawer.querySelectorAll('a');
    drawerLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('is-active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('drawer-open');
      });
    });
  }

  // 4. Header Scroll State
  const siteHeader = document.getElementById('siteHeader');
  if (siteHeader) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        siteHeader.classList.add('is-scrolled');
      } else {
        siteHeader.classList.remove('is-scrolled');
      }
    }, { passive: true });
  }

  // 5. Studio Clock UTC
  const clockEl = document.getElementById('studioClock');
  if (clockEl) {
    function updateClock() {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      clockEl.textContent = `${h}:${m}:${s} UTC`;
    }
    updateClock();
    setInterval(updateClock, 1000);
  }
});
