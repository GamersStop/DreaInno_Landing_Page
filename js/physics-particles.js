/**
 * DreaInno Physics Particle Engine
 * Pure Vanilla HTML5 Canvas 2D - Zero WASM / Zero CORS - 100% compatible with file:/// & http://
 * Recreating the signature Pixel Point falling & flowing physics particles:
 * - Floating & buoyant physics inside the browser window at top
 * - Dynamic mouse repulsion & hover tilt
 * - "Falling & flowing down" cascade on scroll
 * - Spring recall back into the window when scrolling up
 * - Interactive click impulse burst
 */

(function () {
  'use strict';

  // Check for canvas support
  const canvas = document.getElementById('heroRiveCanvas') || document.getElementById('heroPhysicsCanvas');
  if (!canvas) return;

  // Make sure it uses 2D context
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const wrapper = canvas.closest('.hero-window-wrapper') || canvas.parentElement;

  // Configuration & Colors
  const COLOR_BLUE = '#2B4BEE';
  const COLOR_PINK = '#EE2B6C';
  const COLOR_WHITE = '#FFFFFF';
  const COLOR_DARK = '#0A0A0F';

  // Virtual window dimensions (matching PixelPoint 468x380)
  const WIN_W = 468;
  const WIN_H = 380;

  // Particle shape definitions based on Pixel Point illustration
  const shapeDefs = [
    // 1. Large white semicircle dome (top center-left)
    { id: 'dome', x: 235, y: 75, baseAngle: 0, draw: drawDome },
    // 2. Slanted hot-pink capsule (top right)
    { id: 'pinkCapsuleTop', x: 395, y: 70, baseAngle: 0.55, draw: drawPinkCapsule },
    // 3. Plus sign button in rounded square (top far-right)
    { id: 'plusBox', x: 430, y: 95, baseAngle: 0.18, draw: drawPlusBox },
    // 4. Long blue horizontal pill (upper middle)
    { id: 'blueLongPill', x: 250, y: 155, baseAngle: 0.08, draw: drawBlueLongPill },
    // 5. White oval loop pill (middle)
    { id: 'whiteLoop', x: 215, y: 220, baseAngle: -0.05, draw: drawWhiteLoop },
    // 6. Magenta rectangle pill (middle right)
    { id: 'pinkRectPill', x: 380, y: 245, baseAngle: 0.1, draw: drawPinkRectPill },
    // 7. Large white solid circle (right middle)
    { id: 'whiteCircle', x: 410, y: 240, baseAngle: 0, draw: drawWhiteCircle },
    // 8. White rounded square (left middle)
    { id: 'whiteSquareOutline', x: 65, y: 155, baseAngle: 0.2, draw: drawWhiteSquareOutline },
    // 9. Blue cube / rounded square (middle left)
    { id: 'blueSquare', x: 60, y: 245, baseAngle: 0, draw: drawBlueSquare },
    // 10. Pink round pill (center)
    { id: 'pinkRoundBadge', x: 245, y: 245, baseAngle: 0, draw: drawPinkRoundBadge },
    // 11. Large blue rounded square (center bottom)
    { id: 'blueMainSquare', x: 275, y: 310, baseAngle: -0.22, draw: drawBlueMainSquare },
    // 12. Hot pink rounded block (lower left)
    { id: 'pinkSquareBlock', x: 75, y: 335, baseAngle: 0.15, draw: drawPinkSquareBlock },
    // 13. Heart pill (bottom center)
    { id: 'heartPill', x: 340, y: 360, baseAngle: 0.45, draw: drawHeartPill },
    // 14. Striped round badge (bottom right)
    { id: 'stripedCircle', x: 440, y: 305, baseAngle: -0.4, draw: drawStripedCircle },
    // 15. Concentric rings (bottom right)
    { id: 'concentricRings', x: 405, y: 360, baseAngle: 0, draw: drawConcentricRings },
    // 16. White Search Bar (bottom center-spanning)
    { id: 'searchBar', x: 225, y: 395, baseAngle: 0, draw: drawSearchBar },
  ];

  // Particle instances
  class Particle {
    constructor(def) {
      this.id = def.id;
      this.homeX = def.x;
      this.homeY = def.y;
      this.x = def.x;
      this.y = def.y;
      this.vx = 0;
      this.vy = 0;
      this.homeAngle = def.baseAngle;
      this.angle = def.baseAngle;
      this.vAngle = 0;
      this.drawFn = def.draw;

      // Unique oscillation parameters
      this.phaseX = Math.random() * Math.PI * 2;
      this.phaseY = Math.random() * Math.PI * 2;
      this.phaseAngle = Math.random() * Math.PI * 2;
      this.floatSpeed = 0.0018 + Math.random() * 0.0012;
      this.floatAmp = 3.5 + Math.random() * 3.5;
      this.rotAmp = 0.04 + Math.random() * 0.03;

      // Fall / cascade state
      this.fallSpeed = 1.2 + Math.random() * 2.2;
      this.fallDrift = (Math.random() - 0.5) * 1.5;
      this.fallRotSpeed = (Math.random() - 0.5) * 0.025;
    }

    update(time, scrollProgress, mouse) {
      // 1. Floating oscillation inside window
      const floatX = Math.cos(time * this.floatSpeed + this.phaseX) * (this.floatAmp * 0.6);
      const floatY = Math.sin(time * this.floatSpeed + this.phaseY) * this.floatAmp;
      const floatAngle = Math.sin(time * this.floatSpeed * 0.8 + this.phaseAngle) * this.rotAmp;

      // Target resting coordinate inside window
      let targetX = this.homeX + floatX;
      let targetY = this.homeY + floatY;
      let targetAngle = this.homeAngle + floatAngle;

      // 2. Mouse Repulsion when inside window
      if (mouse.inside && scrollProgress < 0.15) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 110;
        if (dist < maxDist && dist > 0.1) {
          const force = (1 - dist / maxDist) * 35;
          targetX += (dx / dist) * force;
          targetY += (dy / dist) * force;
          targetAngle += (dx / dist) * 0.2;
        }
      }

      // 3. Falling & Flowing Down on Scroll
      if (scrollProgress > 0.02) {
        // Linear & gravity cascade downwards
        const cascadeFactor = Math.min(scrollProgress * 2.5, 1.0);
        const easeCascade = cascadeFactor * cascadeFactor;

        // Vertical drop + horizontal flow
        const fallDist = easeCascade * (700 * this.fallSpeed);
        const flowX = Math.sin(time * 0.002 + this.phaseX) * (40 * cascadeFactor) + (this.fallDrift * easeCascade * 180);
        
        targetY += fallDist;
        targetX += flowX;
        targetAngle += this.fallRotSpeed * fallDist * 0.02;
      }

      // 4. Spring Physics (Damped Harmonic Oscillator)
      const spring = 0.08;
      const damping = 0.76;

      const ax = (targetX - this.x) * spring;
      const ay = (targetY - this.y) * spring;
      const aAngle = (targetAngle - this.angle) * spring;

      this.vx = (this.vx + ax) * damping;
      this.vy = (this.vy + ay) * damping;
      this.vAngle = (this.vAngle + aAngle) * damping;

      this.x += this.vx;
      this.y += this.vy;
      this.angle += this.vAngle;
    }

    render(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      this.drawFn(ctx);
      ctx.restore();
    }
  }

  // Floating Micro Ambient Sparkles
  class Sparkle {
    constructor() {
      this.reset(true);
    }
    reset(initial = false) {
      this.x = Math.random() * WIN_W;
      this.y = initial ? Math.random() * WIN_H : WIN_H + 20;
      this.size = 1.5 + Math.random() * 3.5;
      this.speed = 0.4 + Math.random() * 0.8;
      this.color = Math.random() > 0.5 ? COLOR_BLUE : (Math.random() > 0.5 ? COLOR_PINK : '#FFFFFF');
      this.alpha = 0.2 + Math.random() * 0.6;
      this.drift = (Math.random() - 0.5) * 0.5;
    }
    update(scrollProgress) {
      if (scrollProgress > 0.05) {
        this.y += this.speed * 2.5;
      } else {
        this.y -= this.speed * 0.5;
      }
      this.x += this.drift;
      if (this.y < -20 || this.y > WIN_H + 500) {
        this.reset();
      }
    }
    render(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // DRAW FUNCTIONS FOR EACH SIGNATURE GEOMETRIC SHAPE
  function drawDome(ctx) {
    // White semicircle dome
    ctx.fillStyle = COLOR_WHITE;
    ctx.beginPath();
    ctx.arc(0, 0, 52, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }

  function drawPinkCapsule(ctx) {
    // Slanted hot pink pill
    ctx.fillStyle = COLOR_PINK;
    drawPill(ctx, -14, -40, 28, 80, 14);
  }

  function drawPlusBox(ctx) {
    // Rounded square outline with plus
    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, -22, -22, 44, 44, 12, false, true);
    // Plus sign
    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 10);
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();
  }

  function drawBlueLongPill(ctx) {
    // Cobalt long pill
    ctx.fillStyle = COLOR_BLUE;
    drawPill(ctx, -130, -18, 260, 36, 18);
  }

  function drawWhiteLoop(ctx) {
    // White oval loop outline
    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 14;
    drawPill(ctx, -68, -26, 136, 52, 26, false, true);
  }

  function drawPinkRectPill(ctx) {
    ctx.fillStyle = COLOR_PINK;
    drawRoundedRect(ctx, -18, -36, 36, 72, 8, true, false);
  }

  function drawWhiteCircle(ctx) {
    ctx.fillStyle = COLOR_WHITE;
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWhiteSquareOutline(ctx) {
    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 10;
    drawRoundedRect(ctx, -28, -28, 56, 56, 18, false, true);
    ctx.fillStyle = COLOR_WHITE;
    ctx.beginPath();
    ctx.arc(10, 12, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBlueSquare(ctx) {
    ctx.fillStyle = COLOR_BLUE;
    drawRoundedRect(ctx, -18, -24, 36, 48, 8, true, false);
  }

  function drawPinkRoundBadge(ctx) {
    ctx.fillStyle = COLOR_PINK;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBlueMainSquare(ctx) {
    ctx.fillStyle = COLOR_BLUE;
    drawRoundedRect(ctx, -48, -48, 96, 96, 24, true, false);
  }

  function drawPinkSquareBlock(ctx) {
    ctx.fillStyle = COLOR_PINK;
    drawRoundedRect(ctx, -42, -42, 84, 84, 22, true, false);
  }

  function drawHeartPill(ctx) {
    ctx.fillStyle = COLOR_PINK;
    drawPill(ctx, -28, -14, 56, 28, 14);
    // White heart in center
    ctx.fillStyle = COLOR_WHITE;
    ctx.beginPath();
    const x = 0, y = -3;
    ctx.moveTo(x, y + 4);
    ctx.bezierCurveTo(x - 5, y - 4, x - 10, y + 1, x, y + 10);
    ctx.bezierCurveTo(x + 10, y + 1, x + 5, y - 4, x, y + 4);
    ctx.fill();
  }

  function drawStripedCircle(ctx) {
    // Circle with diagonal stripes
    ctx.save();
    ctx.fillStyle = COLOR_BLUE;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.clip();

    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 4;
    for (let i = -40; i <= 40; i += 12) {
      ctx.beginPath();
      ctx.moveTo(i - 20, -30);
      ctx.lineTo(i + 20, 30);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawConcentricRings(ctx) {
    ctx.strokeStyle = COLOR_BLUE;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = COLOR_WHITE;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSearchBar(ctx) {
    // White search pill with magnifying glass
    ctx.fillStyle = COLOR_WHITE;
    drawPill(ctx, -140, -22, 280, 44, 22);

    // Magnifying glass icon inside pill on left
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-112, 0, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-106, 6);
    ctx.lineTo(-98, 14);
    ctx.stroke();
  }

  // Utility drawing helpers
  function drawRoundedRect(ctx, x, y, width, height, radius, fill = true, stroke = false) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function drawPill(ctx, x, y, width, height, radius, fill = true, stroke = false) {
    drawRoundedRect(ctx, x, y, width, height, radius, fill, stroke);
  }

  // Initialize Particles & Simulation
  const particles = shapeDefs.map(def => new Particle(def));
  const sparkles = Array.from({ length: 22 }, () => new Sparkle());

  // Mouse & Scroll State
  const mouse = { x: 0, y: 0, inside: false };
  let scrollProgress = 0;
  let targetScrollProgress = 0;

  function handleResize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = wrapper.getBoundingClientRect();
    
    // Canvas dimensions (expanded height for falling particles cascade)
    canvas.width = rect.width * dpr;
    canvas.height = Math.max(rect.height, 900) * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${Math.max(rect.height, 900)}px`;

    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', handleResize);
  handleResize();

  // Mouse Listeners
  wrapper.addEventListener('mousemove', (e) => {
    const rect = wrapper.getBoundingClientRect();
    const scaleX = WIN_W / rect.width;
    const scaleY = WIN_H / rect.height;
    mouse.x = (e.clientX - rect.left) * scaleX;
    mouse.y = (e.clientY - rect.top) * scaleY;
    mouse.inside = true;
  });

  wrapper.addEventListener('mouseleave', () => {
    mouse.inside = false;
  });

  // Click to trigger impulse explosion
  wrapper.addEventListener('click', () => {
    particles.forEach(p => {
      p.vx += (Math.random() - 0.5) * 24;
      p.vy += (Math.random() - 0.8) * 20;
      p.vAngle += (Math.random() - 0.5) * 0.4;
    });
  });

  // Scroll listener for "falling and flowing down"
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    // Calculate progress between 0 (at top) and 1 (scrolled past hero)
    const heroHeight = window.innerHeight || 800;
    targetScrollProgress = Math.min(Math.max((scrollY - 30) / (heroHeight * 0.75), 0), 1.5);
  }, { passive: true });

  // Main Render Loop
  let lastTime = performance.now();

  function render(time) {
    const dt = time - lastTime;
    lastTime = time;

    // Smooth scrollProgress interpolation
    scrollProgress += (targetScrollProgress - scrollProgress) * 0.08;

    const dpr = window.devicePixelRatio || 1;
    const rect = wrapper.getBoundingClientRect();
    const scale = rect.width / WIN_W;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.scale(scale, scale);

    // 1. Draw Browser Window Frame & Dots
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, 1, 1, WIN_W - 2, WIN_H - 2, 13, false, true);

    // Top-left dots
    ctx.fillStyle = COLOR_WHITE;
    ctx.beginPath();
    ctx.arc(20, 20, 3.8, 0, Math.PI * 2);
    ctx.arc(34, 20, 3.8, 0, Math.PI * 2);
    ctx.arc(48, 20, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Render Micro Sparkles
    sparkles.forEach(s => {
      s.update(scrollProgress);
      s.render(ctx);
    });

    // 3. Update and Render Shapes / Particles
    particles.forEach(p => {
      p.update(time, scrollProgress, mouse);
      p.render(ctx);
    });

    ctx.restore();

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  // 4. Background Ambient Particles Canvas
  (function initAmbientBackground() {
    const bgContainer = document.querySelector('.hero-canvas-bg');
    if (!bgContainer) return;

    const bgCanvas = document.createElement('canvas');
    bgCanvas.className = 'hero-ambient-particles-canvas';
    bgCanvas.style.position = 'absolute';
    bgCanvas.style.inset = '0';
    bgCanvas.style.width = '100%';
    bgCanvas.style.height = '100%';
    bgCanvas.style.pointerEvents = 'none';
    bgContainer.appendChild(bgCanvas);

    const bgCtx = bgCanvas.getContext('2d');
    if (!bgCtx) return;

    let w = bgCanvas.width = bgContainer.clientWidth || window.innerWidth;
    let h = bgCanvas.height = bgContainer.clientHeight || window.innerHeight;

    window.addEventListener('resize', () => {
      w = bgCanvas.width = bgContainer.clientWidth || window.innerWidth;
      h = bgCanvas.height = bgContainer.clientHeight || window.innerHeight;
    });

    const dots = Array.from({ length: 45 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -0.15 - Math.random() * 0.35,
      size: 1 + Math.random() * 2.2,
      color: Math.random() > 0.6 ? '#2B4BEE' : (Math.random() > 0.4 ? '#EE2B6C' : '#FFFFFF'),
      alpha: 0.15 + Math.random() * 0.45
    }));

    function animBg() {
      bgCtx.clearRect(0, 0, w, h);

      dots.forEach(d => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.y < -10) { d.y = h + 10; d.x = Math.random() * w; }
        if (d.x < -10) d.x = w + 10;
        if (d.x > w + 10) d.x = -10;

        bgCtx.save();
        bgCtx.globalAlpha = d.alpha;
        bgCtx.fillStyle = d.color;
        bgCtx.shadowColor = d.color;
        bgCtx.shadowBlur = 6;
        bgCtx.beginPath();
        bgCtx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        bgCtx.fill();
        bgCtx.restore();
      });

      requestAnimationFrame(animBg);
    }
    requestAnimationFrame(animBg);
  })();

  console.log('[DreaInno Physics] 100% Offline Canvas Particle Physics & Ambient Flow active.');
})();
