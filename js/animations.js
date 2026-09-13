/**
 * DreaInno Portfolio — Animations JS
 * Genuine PixelPoint Rive WebAssembly Animation Engine
 * 
 * Features:
 * 1. Hero 3,000px Continuous Rive Canvas with dynamic physics & Fall Trigger
 * 2. Sequential Word-by-Word Title Animations with color-flash transitions
 * 3. Services 2,050px Rive Canvas Companion
 * 4. Features Sequential & Interactive Rive Micro-Animations (1.riv - 6.riv)
 * 5. General Scroll-Reveal System
 * 6. Spotlight Cards, Filter Tabs, Modal, Studio Clock, and Navigation
 */

(function () {
  'use strict';

  /* ============================================================
     1. HERO RIVE PHYSICS ANIMATION
     Runs animations/pages/home/hero.riv on a 3,000px canvas.
     Fires 'Fall Trigger' when the user scrolls past the first section.
     ============================================================ */

  function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  function getRiveSource(key, fallbackPath) {
    if (window._RIVE_DATA && window._RIVE_DATA[key]) {
      try {
        return { buffer: base64ToArrayBuffer(window._RIVE_DATA[key]) };
      } catch (e) {
        console.warn('Error decoding base64 buffer for ' + key, e);
      }
    }
    return { src: fallbackPath };
  }

  let heroRive = null;
  let fallTrigger = null;
  let fallFired = false;

  function initHeroRive() {
    const canvas = document.getElementById('heroRiveCanvas');
    if (!canvas || typeof rive === 'undefined') return;

    // Determine viewport-matched dimensions
    function getHeroDimensions() {
      const isLg = window.innerWidth <= 1279;
      return {
        width: isLg ? 846 : 1100,
        height: isLg ? 2307 : 3000
      };
    }

    function resizeHeroCanvas() {
      if (window.innerWidth <= 1023) {
        if (heroRive && typeof heroRive.pause === 'function') heroRive.pause();
        return;
      }
      const dims = getHeroDimensions();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = dims.width * dpr;
      const targetH = dims.height * dpr;

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        canvas.style.width = dims.width + 'px';
        canvas.style.height = dims.height + 'px';
        if (heroRive && typeof heroRive.resizeDrawingSurfaceToCanvas === 'function') {
          heroRive.resizeDrawingSurfaceToCanvas();
        }
      }
    }

    // Initial sizing
    resizeHeroCanvas();

    try {
      const srcOpt = getRiveSource('hero', 'animations/pages/home/hero.riv');
      heroRive = new rive.Rive(Object.assign({}, srcOpt, {
        canvas: canvas,
        autoplay: false,
        stateMachines: 'State Machine',
        layout: new rive.Layout({
          fit: rive.Fit.FitWidth,
          alignment: rive.Alignment.TopCenter,
        }),
        onLoad: function () {
          heroRive.resizeDrawingSurfaceToCanvas();
          const inputs = heroRive.stateMachineInputs('State Machine');
          if (inputs && inputs.length) {
            fallTrigger = inputs.find(function (i) { return i.name === 'Fall Trigger'; });
          }
          // Start playing the initial floating state machine
          heroRive.play('State Machine');

          // Check if already scrolled past trigger
          checkHeroScroll();
        },
        onLoadError: function (err) {
          console.warn('Hero Rive load notice:', err);
        }
      }));
    } catch (e) {
      console.warn('Error initializing hero Rive:', e);
    }

    // Window resize handler
    window.addEventListener('resize', function () {
      resizeHeroCanvas();
    }, { passive: true });

    // Scroll trigger handler
    function checkHeroScroll() {
      if (fallFired || !fallTrigger || !heroRive) return;
      const stage1 = document.getElementById('heroStage1');
      const stage1Height = stage1 ? stage1.offsetHeight : window.innerHeight;

      if (window.scrollY > stage1Height - 600) {
        fallFired = true;
        fallTrigger.fire();
      }
    }

    window.addEventListener('scroll', checkHeroScroll, { passive: true });

    // Pause when off-screen to save battery and GPU
    if ('IntersectionObserver' in window) {
      const heroSection = document.getElementById('heroStory');
      if (heroSection) {
        const heroObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!heroRive) return;
            if (entry.isIntersecting) {
              if (typeof heroRive.startRendering === 'function') heroRive.startRendering();
            } else {
              if (typeof heroRive.stopRendering === 'function') heroRive.stopRendering();
            }
          });
        }, { threshold: 0.05 });
        heroObserver.observe(heroSection);
      }
    }
  }


  /* ============================================================
     2. WORD-BY-WORD TITLE ANIMATION
     Exact replica of PixelPoint title-animation component:
     - Words fade in sequentially (opacity 0 -> 1)
     - Highlight words render with color, hold for 280ms, then fade to white
     ============================================================ */

  function animateTitleElement(el, onComplete) {
    if (!el || el.dataset.animated === 'true') return;
    el.dataset.animated = 'true';

    const rawText = el.getAttribute('data-title-animation') || el.textContent.trim();
    const highlightsJson = el.getAttribute('data-highlights') || '[]';
    let highlights = [];
    try { highlights = JSON.parse(highlightsJson); } catch (e) { highlights = []; }

    const words = rawText.split(/\s+/);
    el.innerHTML = '';

    const WORD_INTERVAL = 55;
    const COLOR_HOLD = 280;
    const COLOR_FADE = 180;

    let delay = 0;

    words.forEach(function (word, idx) {
      const span = document.createElement('span');
      span.className = 'title-word';
      span.textContent = idx < words.length - 1 ? word + ' ' : word;
      span.style.opacity = '0';
      span.style.transition = 'opacity 60ms ease, color ' + COLOR_FADE + 'ms ease';

      const normalised = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = highlights.find(function (h) {
        const hw = h.word.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalised.indexOf(hw) !== -1 || hw.indexOf(normalised) !== -1;
      });

      if (match) {
        span.style.color = match.color;
      } else {
        span.style.color = '#ffffff';
      }

      el.appendChild(span);

      const capturedDelay = delay;
      setTimeout(function () {
        span.style.opacity = '1';
        if (match) {
          setTimeout(function () {
            span.style.color = '#ffffff';
          }, COLOR_HOLD);
        }
      }, capturedDelay);

      delay += match ? WORD_INTERVAL + 40 : WORD_INTERVAL;
    });

    if (onComplete) {
      setTimeout(onComplete, delay + 100);
    }
  }

  function initTitleAnimations() {
    // Stage 1 animates on page load
    const stage1 = document.getElementById('heroStage1');
    if (stage1) {
      const title1 = stage1.querySelector('[data-title-animation]');
      if (title1) {
        setTimeout(function () {
          animateTitleElement(title1);
        }, 300);
      }
    }

    // Subsequent stages trigger as they scroll into view
    const stages = [document.getElementById('heroStage2'), document.getElementById('heroStage3')];
    if ('IntersectionObserver' in window) {
      const stageObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const title = entry.target.querySelector('[data-title-animation]');
            if (title) animateTitleElement(title);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.35 });

      stages.forEach(function (st) {
        if (st) stageObserver.observe(st);
      });
    }
  }


  /* ============================================================
     3. SERVICES RIVE COMPANION (2,050px continuous canvas)
     Runs animations/pages/home/services.riv alongside Web Design & Dev
     ============================================================ */

  let servicesRive = null;

  function initServicesRive() {
    const canvas = document.getElementById('servicesRiveCanvas');
    const container = document.getElementById('servicesContainer');
    if (!canvas || !container || typeof rive === 'undefined') return;

    function resizeServicesCanvas() {
      if (window.innerWidth <= 1023) {
        if (servicesRive && typeof servicesRive.pause === 'function') servicesRive.pause();
        return;
      }
      const isLg = window.innerWidth <= 1279;
      const w = isLg ? 726 : 1090;
      const h = isLg ? 1366 : 2050;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      if (servicesRive && typeof servicesRive.resizeDrawingSurfaceToCanvas === 'function') {
        servicesRive.resizeDrawingSurfaceToCanvas();
      }
    }

    resizeServicesCanvas();

    window.addEventListener('resize', resizeServicesCanvas, { passive: true });

    let isInitialized = false;

    function loadServicesRive() {
      if (isInitialized) return;
      isInitialized = true;

      try {
        const srcOpt = getRiveSource('services', 'animations/pages/home/services.riv');
        servicesRive = new rive.Rive(Object.assign({}, srcOpt, {
          canvas: canvas,
          autoplay: true,
          layout: new rive.Layout({
            fit: rive.Fit.FitWidth,
            alignment: rive.Alignment.TopCenter,
          }),
          onLoad: function () {
            servicesRive.resizeDrawingSurfaceToCanvas();
          }
        }));
      } catch (e) {
        console.warn('Error loading services Rive:', e);
      }
    }

    if ('IntersectionObserver' in window) {
      const servicesObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!isInitialized) {
              loadServicesRive();
            } else if (servicesRive && typeof servicesRive.play === 'function') {
              servicesRive.play();
            }
          } else {
            if (servicesRive && typeof servicesRive.pause === 'function') {
              servicesRive.pause();
            }
          }
        });
      }, { rootMargin: '200px' });

      servicesObserver.observe(container);
    } else {
      loadServicesRive();
    }
  }


  /* ============================================================
     4. FEATURES RIVE MICRO-ANIMATIONS (1.riv – 6.riv)
     Runs the 6 interactive vector animations sequentially & on hover
     ============================================================ */

  const featureRiveInstances = [];

  function initFeaturesRive() {
    if (typeof rive === 'undefined') return;

    const items = [1, 2, 3, 4, 5, 6];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    items.forEach(function (num, idx) {
      const canvas = document.getElementById('featureCanvas' + num);
      if (!canvas) return;

      canvas.width = 80 * dpr;
      canvas.height = 62 * dpr;
      canvas.style.width = '80px';
      canvas.style.height = '62px';

      try {
        const srcOpt = getRiveSource('f' + num, 'animations/pages/home/features/' + num + '.riv');
        const instance = new rive.Rive(Object.assign({}, srcOpt, {
          canvas: canvas,
          autoplay: false,
          layout: new rive.Layout({
            fit: rive.Fit.FitWidth,
            alignment: rive.Alignment.Center,
          }),
          onLoad: function () {
            instance.resizeDrawingSurfaceToCanvas();
          }
        }));

        featureRiveInstances.push(instance);

        // Hover interaction
        const card = canvas.closest('.feature-item');
        if (card) {
          card.addEventListener('mouseenter', function () {
            instance.play();
          });
        }
      } catch (e) {
        console.warn('Feature rive error:', e);
      }
    });

    // Sequential chain execution when features section is visible
    const featuresSection = document.getElementById('features');
    if (featuresSection && 'IntersectionObserver' in window) {
      let chainStarted = false;

      function startSequentialLoop() {
        if (!featureRiveInstances.length || chainStarted) return;
        chainStarted = true;

        function playNext(i) {
          if (!chainStarted) return;
          const inst = featureRiveInstances[i];
          if (!inst) return;
          inst.play();

          // Wait 2.2s before advancing to next icon
          setTimeout(function () {
            playNext((i + 1) % featureRiveInstances.length);
          }, 2200);
        }

        playNext(0);
      }

      const featuresObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            startSequentialLoop();
          } else {
            chainStarted = false;
          }
        });
      }, { threshold: 0.2 });

      featuresObserver.observe(featuresSection);
    }
  }


  /* ============================================================
     5. GENERAL SCROLL REVEAL (.reveal-on-scroll)
     ============================================================ */

  function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal-on-scroll');
    if (!revealEls.length) return;

    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

      revealEls.forEach(function (el) { revealObserver.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-revealed'); });
    }
  }


  /* ============================================================
     6. SPOTLIGHT MOUSE TRACKING
     ============================================================ */

  function initSpotlightCards() {
    const cards = document.querySelectorAll('.spotlight-card');
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
        const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
        card.style.setProperty('--mouse-x', x + '%');
        card.style.setProperty('--mouse-y', y + '%');
      });
    });
  }


  /* ============================================================
     7. FILTER TABS (Case Studies)
     ============================================================ */

  function initFilterTabs() {
    const filterBtns = document.querySelectorAll('.filter-btn-dark');
    const cards = document.querySelectorAll('.case-card-dark[data-category]');
    if (!filterBtns.length) return;

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const filter = btn.getAttribute('data-filter');

        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        cards.forEach(function (card) {
          if (filter === 'all' || card.getAttribute('data-category') === filter) {
            card.style.display = '';
            card.style.opacity = '1';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }


  /* ============================================================
     8. MODAL (Project Inquiry)
     ============================================================ */

  function initModal() {
    const modal = document.getElementById('inquiryModal');
    if (!modal) return;

    function openModal() {
      modal.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('is-active');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-open-modal="inquiry"]').forEach(function (btn) {
      btn.addEventListener('click', openModal);
    });

    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-active')) closeModal();
    });

    const budgetChips = modal.querySelectorAll('.budget-chip');
    const budgetInput = document.getElementById('selectedBudget');
    budgetChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        budgetChips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        if (budgetInput) budgetInput.value = chip.getAttribute('data-budget');
      });
    });

    const form = document.getElementById('inquiryForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.textContent = 'Sent! We\'ll be in touch.';
          submitBtn.disabled = true;
          setTimeout(closeModal, 1800);
        }
      });
    }
  }


  /* ============================================================
     9. MOBILE MENU
     ============================================================ */

  function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const drawer = document.getElementById('mobileDrawer');
    if (!toggle || !drawer) return;

    toggle.addEventListener('click', function () {
      const isOpen = drawer.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        drawer.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }


  /* ============================================================
     10. HEADER SCROLL STATE
     ============================================================ */

  function initHeader() {
    const header = document.getElementById('siteHeader');
    if (!header) return;

    function updateHeader() {
      header.classList.toggle('is-scrolled', window.scrollY > 48);
    }

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }


  /* ============================================================
     11. STUDIO CLOCK (UTC)
     ============================================================ */

  function initStudioClock() {
    const clockEl = document.getElementById('studioClock');
    if (!clockEl) return;

    function tick() {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      clockEl.textContent = h + ':' + m + ':' + s + ' UTC';
    }

    tick();
    setInterval(tick, 1000);
  }


  /* ============================================================
     12. NAV ACTIVE LINK
     ============================================================ */

  function initNavActiveLinks() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    if (!sections.length || !navLinks.length || !('IntersectionObserver' in window)) return;

    const sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { threshold: 0.35 });

    sections.forEach(function (s) { sectionObserver.observe(s); });
  }


  /* ============================================================
     13. FOGO AUTOMATIC CAROUSEL
     - 3-slide smooth automatic transition (every 4000ms)
     - Animated progress indicator bar
     - Next / Prev controls
     - Pause on hover / touch
     - Runs only when visible in viewport via IntersectionObserver
     ============================================================ */

  function initFogoCarousel() {
    const carousel = document.getElementById('fogoCarousel');
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.fogo-slide');
    const indicators = carousel.querySelectorAll('.fogo-indicator-dot');
    const prevBtn = document.getElementById('fogoPrevBtn');
    const nextBtn = document.getElementById('fogoNextBtn');
    const total = slides.length;
    if (total < 2) return;

    let currentIndex = 0;
    let timer = null;
    let isPaused = false;
    let isIntersecting = false;
    const INTERVAL = 4000;

    function goToSlide(idx) {
      currentIndex = (idx + total) % total;

      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === currentIndex);
      });

      indicators.forEach(function (ind, i) {
        ind.classList.toggle('is-active', i === currentIndex);
        const prog = ind.querySelector('.indicator-progress');
        if (prog) {
          prog.style.transition = 'none';
          prog.style.width = '0%';
          if (i === currentIndex && !isPaused) {
            void prog.offsetWidth;
            prog.style.transition = 'width ' + (INTERVAL - 150) + 'ms linear';
            prog.style.width = '100%';
          }
        }
      });
    }

    function nextSlide() {
      goToSlide(currentIndex + 1);
    }

    function prevSlide() {
      goToSlide(currentIndex - 1);
    }

    function startTimer() {
      stopTimer();
      if (!isPaused && isIntersecting) {
        const activeDot = indicators[currentIndex];
        if (activeDot) {
          const prog = activeDot.querySelector('.indicator-progress');
          if (prog) {
            prog.style.transition = 'none';
            prog.style.width = '0%';
            void prog.offsetWidth;
            prog.style.transition = 'width ' + (INTERVAL - 150) + 'ms linear';
            prog.style.width = '100%';
          }
        }
        timer = setInterval(function () {
          nextSlide();
        }, INTERVAL);
      }
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    // Button actions
    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        prevSlide();
        startTimer();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        nextSlide();
        startTimer();
      });
    }

    // Dot indicators
    indicators.forEach(function (dot) {
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        const slideIdx = parseInt(dot.getAttribute('data-slide'), 10);
        if (!isNaN(slideIdx)) {
          goToSlide(slideIdx);
          startTimer();
        }
      });
    });

    // Hover pause / resume
    const card = document.getElementById('fogoCaseCard') || carousel;
    card.addEventListener('mouseenter', function () {
      isPaused = true;
      stopTimer();
      const activeDot = indicators[currentIndex];
      if (activeDot) {
        const prog = activeDot.querySelector('.indicator-progress');
        if (prog) prog.style.width = '100%';
      }
    });

    card.addEventListener('mouseleave', function () {
      isPaused = false;
      startTimer();
    });

    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
      isPaused = true;
      stopTimer();
    }, { passive: true });

    carousel.addEventListener('touchend', function (e) {
      touchEndX = e.changedTouches[0].screenX;
      isPaused = false;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff < 0) nextSlide();
        else prevSlide();
      }
      startTimer();
    }, { passive: true });

    // Keyboard navigation
    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        prevSlide();
        startTimer();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
        startTimer();
      }
    });

    // Run only when card is visible in viewport
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          isIntersecting = entry.isIntersecting;
          if (isIntersecting) {
            startTimer();
          } else {
            stopTimer();
          }
        });
      }, { threshold: 0.15 });
      obs.observe(card);
    } else {
      isIntersecting = true;
      startTimer();
    }
  }


  /* ============================================================
     14. AFFISCOPE PRO INTERNAL IMAGE CAROUSEL
     ============================================================ */

  function initAffiscopeCarousel() {
    const carousel = document.getElementById('affiscopeCarousel');
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.affi-slide');
    const indicators = carousel.querySelectorAll('#affiIndicators .fogo-indicator-dot');
    const prevBtn = document.getElementById('affiPrevBtn');
    const nextBtn = document.getElementById('affiNextBtn');
    const total = slides.length;
    if (total < 2) return;

    let currentIndex = 0;
    let timer = null;
    let isPaused = false;
    let isIntersecting = false;
    const INTERVAL = 4000;

    function goToSlide(idx) {
      currentIndex = (idx + total) % total;

      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === currentIndex);
      });

      indicators.forEach(function (ind, i) {
        ind.classList.toggle('is-active', i === currentIndex);
        const prog = ind.querySelector('.indicator-progress');
        if (prog) {
          prog.style.transition = 'none';
          prog.style.width = '0%';
          if (i === currentIndex && !isPaused) {
            void prog.offsetWidth;
            prog.style.transition = 'width ' + (INTERVAL - 150) + 'ms linear';
            prog.style.width = '100%';
          }
        }
      });
    }

    function nextSlide() {
      goToSlide(currentIndex + 1);
    }

    function prevSlide() {
      goToSlide(currentIndex - 1);
    }

    function startTimer() {
      stopTimer();
      if (!isPaused && isIntersecting) {
        const activeDot = indicators[currentIndex];
        if (activeDot) {
          const prog = activeDot.querySelector('.indicator-progress');
          if (prog) {
            prog.style.transition = 'none';
            prog.style.width = '0%';
            void prog.offsetWidth;
            prog.style.transition = 'width ' + (INTERVAL - 150) + 'ms linear';
            prog.style.width = '100%';
          }
        }
        timer = setInterval(function () {
          nextSlide();
        }, INTERVAL);
      }
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        prevSlide();
        startTimer();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        nextSlide();
        startTimer();
      });
    }

    indicators.forEach(function (dot) {
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        const slideIdx = parseInt(dot.getAttribute('data-slide'), 10);
        if (!isNaN(slideIdx)) {
          goToSlide(slideIdx);
          startTimer();
        }
      });
    });

    const card = document.getElementById('projectSlide1') || carousel;
    card.addEventListener('mouseenter', function () {
      isPaused = true;
      stopTimer();
    });

    card.addEventListener('mouseleave', function () {
      isPaused = false;
      startTimer();
    });

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          isIntersecting = entry.isIntersecting;
          if (isIntersecting) {
            startTimer();
          } else {
            stopTimer();
          }
        });
      }, { threshold: 0.15 });
      obs.observe(card);
    } else {
      isIntersecting = true;
      startTimer();
    }
  }


  /* ============================================================
     14B. AFFISTYLE INTERNAL IMAGE CAROUSEL (WordPress Plugin)
     ============================================================ */

  function initAffistyleCarousel() {
    const carousel = document.getElementById('affistyleCarousel');
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.affistyle-slide');
    const indicators = carousel.querySelectorAll('#affistyleIndicators .fogo-indicator-dot');
    const prevBtn = document.getElementById('affistylePrevBtn');
    const nextBtn = document.getElementById('affistyleNextBtn');
    const total = slides.length;
    if (total < 2) return;

    let currentIndex = 0;
    let timer = null;
    let isPaused = false;
    let isIntersecting = false;
    const INTERVAL = 4000;

    function goToSlide(idx) {
      currentIndex = (idx + total) % total;

      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === currentIndex);
      });

      indicators.forEach(function (ind, i) {
        ind.classList.toggle('is-active', i === currentIndex);
        const prog = ind.querySelector('.indicator-progress');
        if (prog) {
          prog.style.transition = 'none';
          prog.style.width = '0%';
          if (i === currentIndex && !isPaused) {
            void prog.offsetWidth;
            prog.style.transition = 'width ' + (INTERVAL - 150) + 'ms linear';
            prog.style.width = '100%';
          }
        }
      });
    }

    function nextSlide() {
      goToSlide(currentIndex + 1);
    }

    function prevSlide() {
      goToSlide(currentIndex - 1);
    }

    function startTimer() {
      stopTimer();
      if (!isPaused && isIntersecting) {
        const activeDot = indicators[currentIndex];
        if (activeDot) {
          const prog = activeDot.querySelector('.indicator-progress');
          if (prog) {
            prog.style.transition = 'none';
            prog.style.width = '0%';
            void prog.offsetWidth;
            prog.style.transition = 'width ' + (INTERVAL - 150) + 'ms linear';
            prog.style.width = '100%';
          }
        }
        timer = setInterval(function () {
          nextSlide();
        }, INTERVAL);
      }
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        prevSlide();
        startTimer();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        nextSlide();
        startTimer();
      });
    }

    indicators.forEach(function (dot) {
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        const slideIdx = parseInt(dot.getAttribute('data-slide'), 10);
        if (!isNaN(slideIdx)) {
          goToSlide(slideIdx);
          startTimer();
        }
      });
    });

    const card = document.getElementById('projectSlide2') || carousel;
    card.addEventListener('mouseenter', function () {
      isPaused = true;
      stopTimer();
    });

    card.addEventListener('mouseleave', function () {
      isPaused = false;
      startTimer();
    });

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          isIntersecting = entry.isIntersecting;
          if (isIntersecting) {
            startTimer();
          } else {
            stopTimer();
          }
        });
      }, { threshold: 0.15 });
      obs.observe(card);
    } else {
      isIntersecting = true;
      startTimer();
    }
  }


  /* ============================================================
     14C. AI PROMPT FIREWALL INTERNAL IMAGE CAROUSEL (NPM Package)
     ============================================================ */

  function initFirewallCarousel() {
    const carousel = document.getElementById('firewallCarousel');
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.firewall-slide');
    const indicators = carousel.querySelectorAll('#firewallIndicators .fogo-indicator-dot');
    const prevBtn = document.getElementById('firewallPrevBtn');
    const nextBtn = document.getElementById('firewallNextBtn');
    const total = slides.length;
    if (total < 2) return;

    let currentIndex = 0;
    let timer = null;
    let isPaused = false;
    let isIntersecting = false;
    const INTERVAL = 4000;

    function goToSlide(idx) {
      currentIndex = (idx + total) % total;

      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === currentIndex);
      });

      indicators.forEach(function (ind, i) {
        ind.classList.toggle('is-active', i === currentIndex);
        const prog = ind.querySelector('.indicator-progress');
        if (prog) {
          prog.style.transition = 'none';
          prog.style.width = '0%';
          if (i === currentIndex && !isPaused) {
            void prog.offsetWidth;
            prog.style.transition = 'width ' + (INTERVAL - 150) + 'ms linear';
            prog.style.width = '100%';
          }
        }
      });
    }

    function nextSlide() {
      goToSlide(currentIndex + 1);
    }

    function prevSlide() {
      goToSlide(currentIndex - 1);
    }

    function startTimer() {
      stopTimer();
      if (!isPaused && isIntersecting) {
        const activeDot = indicators[currentIndex];
        if (activeDot) {
          const prog = activeDot.querySelector('.indicator-progress');
          if (prog) {
            prog.style.transition = 'none';
            prog.style.width = '0%';
            void prog.offsetWidth;
            prog.style.transition = 'width ' + (INTERVAL - 150) + 'ms linear';
            prog.style.width = '100%';
          }
        }
        timer = setInterval(function () {
          nextSlide();
        }, INTERVAL);
      }
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        prevSlide();
        startTimer();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        nextSlide();
        startTimer();
      });
    }

    indicators.forEach(function (dot) {
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        const slideIdx = parseInt(dot.getAttribute('data-slide'), 10);
        if (!isNaN(slideIdx)) {
          goToSlide(slideIdx);
          startTimer();
        }
      });
    });

    const card = document.getElementById('projectSlide4') || carousel;
    card.addEventListener('mouseenter', function () {
      isPaused = true;
      stopTimer();
    });

    card.addEventListener('mouseleave', function () {
      isPaused = false;
      startTimer();
    });

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          isIntersecting = entry.isIntersecting;
          if (isIntersecting) {
            startTimer();
          } else {
            stopTimer();
          }
        });
      }, { threshold: 0.15 });
      obs.observe(card);
    } else {
      isIntersecting = true;
      startTimer();
    }
  }


  /* ============================================================
     15. MASTER PROJECTS CAROUSEL (7 Projects Across 4 Categories)
     ============================================================ */

  function initProjectsCarousel() {
    const showcase = document.getElementById('projectsShowcase');
    if (!showcase) return;

    const slides = Array.from(document.querySelectorAll('.project-slide'));
    const tabBtns = Array.from(document.querySelectorAll('.proj-tab-btn'));
    const filterBtns = Array.from(document.querySelectorAll('#projectFilterTabs .filter-btn-dark'));
    const prevBtn = document.getElementById('masterProjPrev');
    const nextBtn = document.getElementById('masterProjNext');
    const counterEl = document.getElementById('projectsCounter');
    const badgeEl = document.getElementById('projectsCategoryBadge');
    const deck = document.getElementById('projectsDeck');

    if (!slides.length) return;

    let currentFilter = 'all';
    let availableIndices = slides.map(function (_, i) { return i; });
    let activeGlobalIndex = 0;

    const categoryLabels = {
      'extension': 'Chrome Extension • In-House',
      'wordpress': 'WordPress Plugin • Ecosystem',
      'npm': 'NPM Package • Architecture SDK',
      'opensource': 'Open Source • GitHub Community'
    };

    function updateActiveProject(index) {
      if (index < 0 || index >= slides.length) return;
      activeGlobalIndex = index;

      // Update slides active class
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === activeGlobalIndex);
      });

      // Update quick tab active state
      tabBtns.forEach(function (tab, i) {
        tab.classList.toggle('is-active', i === activeGlobalIndex);
      });

      // Update counter and badge
      const activeSlide = slides[activeGlobalIndex];
      const cat = activeSlide ? activeSlide.getAttribute('data-category') : 'extension';
      const humanNum = String(activeGlobalIndex + 1).padStart(2, '0');
      const totalNum = String(slides.length).padStart(2, '0');

      if (counterEl) {
        counterEl.textContent = 'Project ' + humanNum + ' / ' + totalNum;
      }
      if (badgeEl) {
        badgeEl.textContent = categoryLabels[cat] || 'In-House Venture';
      }

      // Kick off project-specific carousels if active
      if (activeGlobalIndex === 0) {
        initFogoCarousel();
      } else if (activeGlobalIndex === 1) {
        initAffiscopeCarousel();
      } else if (activeGlobalIndex === 2) {
        initAffistyleCarousel();
      } else if (activeGlobalIndex === 4) {
        initFirewallCarousel();
      }
    }

    function applyCategoryFilter(filter) {
      currentFilter = filter;

      // Update filter tabs
      filterBtns.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-filter') === currentFilter);
      });

      // Filter available indices
      availableIndices = [];
      slides.forEach(function (slide, i) {
        const cat = slide.getAttribute('data-category');
        const match = (currentFilter === 'all' || cat === currentFilter);
        if (match) availableIndices.push(i);
      });

      // Show/hide or highlight quick tabs based on category
      tabBtns.forEach(function (tab) {
        const cat = tab.getAttribute('data-cat');
        const match = (currentFilter === 'all' || cat === currentFilter);
        tab.style.display = match ? '' : 'none';
      });

      // If active project is not in filtered list, jump to first match
      if (!availableIndices.includes(activeGlobalIndex)) {
        if (availableIndices.length > 0) {
          updateActiveProject(availableIndices[0]);
        }
      }
    }

    // Previous / Next across available (filtered) projects
    function navigateProject(direction) {
      if (!availableIndices.length) return;
      const currentPos = availableIndices.indexOf(activeGlobalIndex);
      let nextPos;
      if (currentPos === -1) {
        nextPos = 0;
      } else {
        nextPos = (currentPos + direction + availableIndices.length) % availableIndices.length;
      }
      updateActiveProject(availableIndices[nextPos]);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        navigateProject(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        navigateProject(1);
      });
    }

    // Quick jump tabs
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const idx = parseInt(btn.getAttribute('data-project-index'), 10);
        if (!isNaN(idx)) {
          updateActiveProject(idx);
        }
      });
    });

    // Category filter button listeners
    filterBtns.forEach(function (fBtn) {
      fBtn.addEventListener('click', function () {
        const filter = fBtn.getAttribute('data-filter');
        if (filter) {
          applyCategoryFilter(filter);
        }
      });
    });

    // Touch swipe support on project deck
    if (deck) {
      let touchStartX = 0;
      let touchEndX = 0;
      deck.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      deck.addEventListener('touchend', function (e) {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) > 50) {
          if (diff < 0) navigateProject(1);
          else navigateProject(-1);
        }
      }, { passive: true });
    }

    // Initial state
    updateActiveProject(0);
  }


  /* ============================================================
     16. DIRECT CONTACT FORM WITH JS CAPTCHA (dreainno@gmail.com)
     ============================================================ */

  function initDirectContactForm() {
    const form = document.getElementById('directContactForm');
    if (!form) return;

    const canvas = document.getElementById('ctaCaptchaCanvas');
    const reloadBtn = document.getElementById('ctaCaptchaReload');
    const captchaInput = document.getElementById('ctaCaptchaInput');
    const statusEl = document.getElementById('ctaFormStatus');
    const submitBtn = document.getElementById('ctaSubmitBtn');
    const btnText = submitBtn ? submitBtn.querySelector('.cta-btn-text') : null;
    const btnSpinner = submitBtn ? submitBtn.querySelector('.cta-btn-spinner') : null;
    const budgetChips = Array.from(document.querySelectorAll('#ctaBudgetChips .cta-chip'));
    const budgetInput = document.getElementById('ctaSelectedBudget');

    let currentCaptcha = '';

    // Budget chips selection
    budgetChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        budgetChips.forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        if (budgetInput) {
          budgetInput.value = chip.getAttribute('data-budget') || '';
        }
      });
    });

    // Start Project buttons redirect & smooth scroll to this form
    const startProjectBtns = document.querySelectorAll('#headerStartProjectBtn, #mobileStartProjectBtn, a[href="#contact"], button[data-open-modal="inquiry"]');
    startProjectBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
          e.preventDefault();
          const drawer = document.getElementById('mobileDrawer');
          if (drawer && drawer.classList.contains('is-open')) {
            drawer.classList.remove('is-open');
            const toggle = document.querySelector('.mobile-menu-toggle');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
          }
          contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(function () {
            const nameInput = document.getElementById('ctaName');
            if (nameInput) {
              nameInput.focus();
              nameInput.style.borderColor = '#2563eb';
              nameInput.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.25)';
              setTimeout(function () {
                nameInput.style.borderColor = '';
                nameInput.style.boxShadow = '';
              }, 2000);
            }
          }, 650);
        }
      });
    });

    // Generate random alphanumeric string
    function generateCaptchaText(length) {
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let text = '';
      for (let i = 0; i < length; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return text;
    }

    // Render Canvas Captcha
    function drawCaptcha() {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      currentCaptcha = generateCaptchaText(5);

      const w = canvas.width;
      const h = canvas.height;

      // Dark futuristic slate background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Add background interference lines
      const lineColors = ['rgba(56, 189, 248, 0.4)', 'rgba(52, 211, 153, 0.4)', 'rgba(244, 63, 94, 0.3)'];
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = lineColors[i % lineColors.length];
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(Math.random() * w, Math.random() * h);
        ctx.bezierCurveTo(
          Math.random() * w, Math.random() * h,
          Math.random() * w, Math.random() * h,
          Math.random() * w, Math.random() * h
        );
        ctx.stroke();
      }

      // Render each character with random rotation and color
      const charColors = ['#38bdf8', '#34d399', '#fbbf24', '#c084fc', '#f43f5e', '#60a5fa'];
      ctx.font = 'bold 20px "IBM Plex Mono", monospace';
      ctx.textBaseline = 'middle';

      const startX = 16;
      const spacing = (w - 32) / currentCaptcha.length;

      for (let i = 0; i < currentCaptcha.length; i++) {
        const char = currentCaptcha[i];
        const x = startX + i * spacing;
        const y = h / 2 + (Math.random() * 4 - 2);
        const angle = (Math.random() * 24 - 12) * (Math.PI / 180);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = charColors[i % charColors.length];
        ctx.fillText(char, 0, 0);
        ctx.restore();
      }
    }

    // Initialize captcha
    drawCaptcha();

    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        drawCaptcha();
        if (captchaInput) {
          captchaInput.value = '';
          captchaInput.focus();
        }
      });
    }

    // Form Submission with delivery to dreainno@gmail.com
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const nameVal = (form.querySelector('[name="name"]').value || '').trim();
      const emailVal = (form.querySelector('[name="email"]').value || '').trim();
      const serviceVal = (form.querySelector('[name="service"]').value || '').trim();
      const budgetVal = budgetInput ? budgetInput.value : '';
      const messageVal = (form.querySelector('[name="message"]').value || '').trim();
      const enteredCaptcha = (captchaInput ? captchaInput.value : '').trim().toUpperCase();

      // Clear status
      if (statusEl) {
        statusEl.className = 'cta-form-status';
        statusEl.style.display = 'none';
        statusEl.textContent = '';
      }

      // Validate required fields
      if (!nameVal || !emailVal || !messageVal) {
        if (statusEl) {
          statusEl.className = 'cta-form-status error';
          statusEl.textContent = 'Please fill out all required fields (*).';
        }
        return;
      }

      // Validate JS Captcha
      if (enteredCaptcha !== currentCaptcha) {
        if (statusEl) {
          statusEl.className = 'cta-form-status error';
          statusEl.textContent = '❌ Security code is incorrect. Please try again.';
        }
        drawCaptcha();
        if (captchaInput) {
          captchaInput.value = '';
          captchaInput.focus();
          captchaInput.style.borderColor = '#ef4444';
          setTimeout(function () { captchaInput.style.borderColor = ''; }, 2000);
        }
        return;
      }

      // Enter loading state
      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnSpinner) btnSpinner.style.display = 'inline-flex';

      try {
        const response = await fetch('https://formsubmit.co/ajax/dreainno@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            Name: nameVal,
            Email: emailVal,
            Service: serviceVal,
            Budget: budgetVal,
            Message: messageVal,
            _subject: 'New Project Inquiry from ' + nameVal + ' (' + serviceVal + ')',
            _template: 'table',
            _captcha: 'false'
          })
        });

        const data = await response.json();

        if (response.ok && (data.success === 'true' || data.success === true || data.message)) {
          if (statusEl) {
            statusEl.className = 'cta-form-status success';
            statusEl.innerHTML = '<strong>✓ Message Received!</strong> Your inquiry was delivered to <code>admin@dreainno.website</code>. We will respond within 24 hours.';
          }
          form.reset();
          drawCaptcha();
        } else {
          throw new Error(data.message || 'Submission failed');
        }
      } catch (err) {
        console.warn('FormSubmit AJAX fallback:', err);
        if (statusEl) {
          statusEl.className = 'cta-form-status error';
          const mailtoFallback = 'mailto:admin@dreainno.website?subject=' + encodeURIComponent('Inquiry from ' + nameVal) + '&body=' + encodeURIComponent(messageVal + '\n\nFrom: ' + nameVal + ' <' + emailVal + '>\nService: ' + serviceVal + '\nBudget: ' + budgetVal);
          statusEl.innerHTML = 'Delivery service is confirming. <a href="' + mailtoFallback + '" style="color:#2563eb;text-decoration:underline;font-weight:600;">Click here to send directly via email client →</a>';
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnSpinner) btnSpinner.style.display = 'none';
      }
    });
  }


  /* ============================================================
     BOOTSTRAP
     ============================================================ */

  function boot() {
    // If rive runtime is ready, initialize directly, otherwise wait a tick
    function startRiveEngines() {
      if (typeof rive !== 'undefined') {
        initHeroRive();
        initServicesRive();
        initFeaturesRive();
      } else {
        setTimeout(startRiveEngines, 100);
      }
    }

    initTitleAnimations();
    initScrollReveal();
    initSpotlightCards();
    initModal();
    initMobileMenu();
    initHeader();
    initStudioClock();
    initNavActiveLinks();
    initFogoCarousel();
    initAffiscopeCarousel();
    initAffistyleCarousel();
    initFirewallCarousel();
    initProjectsCarousel();
    initDirectContactForm();

    startRiveEngines();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
