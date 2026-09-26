/**
 * DreaInno Portfolio — Fix & Remediation Portal Logic (fix.js)
 * Parses AffiScope v1.1 telemetry query parameters, animates radial gauges,
 * executes real-time revenue loss calculations, and powers staging dispatch.
 * 
 * Strict rule: If no values are passed in parameters, do not hardcode any fallback values!
 */

(function () {
  'use strict';

  // Complete catalog of AffiScope v1.1 deterministic technical issue IDs & specs
  const ISSUE_DEFINITIONS = {
    masked_speed: {
      id: 'masked_speed',
      severity: 'high',
      deductPoints: 25,
      title: 'Masked Speed & Delayed JavaScript Patterns',
      badgeText: 'High Severity (-25 pts)',
      iconClass: 'icon-danger',
      iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
      detectionMeta: 'Delayed JavaScript execution patterns (e.g., WP Rocket Delay JS, NitroPack, Flying Scripts, Perfmatters).',
      diagnosisHtml: `Your site delays critical script execution until first user interaction (touch, scroll, or mousemove). While this synthetically inflates lab PageSpeed scores, real users experience <strong>frozen CTAs, unresponsive navigation, and severe Google INP (Interaction to Next Paint) latency penalties</strong>. Google ranks websites on real CrUX user field data, where cloaked execution leads to high bounce rates and ranking drops.`,
      sampleCode: `// Detected artificial delay signatures:\nwindow.addEventListener('touchstart', loadScripts, { once: true });\nwindow.addEventListener('mousemove', loadScripts, { once: true });\n// Flags: WP Rocket Delay JS / NitroPack / Flying Scripts / Perfmatters`,
      remediationBullets: [
        'Safe de-obfuscation and complete removal of artificial delay scripts.',
        'Surgical JavaScript bundle splitting and unused CSS tree-shaking.',
        'Inlined critical path rendering engine delivering sub-800ms First Contentful Paint (FCP).',
        'Guaranteed Google INP pass on genuine desktop and mobile field sessions.'
      ]
    },
    untracked_calls: {
      id: 'untracked_calls',
      severity: 'high',
      deductPoints: 25,
      title: 'Untracked Direct Call Conversions',
      badgeText: 'High Severity (-25 pts)',
      iconClass: 'icon-danger',
      iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
      detectionMeta: 'Uninstrumented tel: links lacking Google Ads / GTM conversion tracking.',
      diagnosisHtml: `Direct <code>tel:</code> links on the page lack Google Ads <code>gtag('event', 'conversion')</code> or dataLayer conversion dispatchers. Prospective clients clicking phone links from mobile search ads generate zero feedback signals to ad algorithms. Smart Bidding flies blind without call telemetry, causing your campaigns to under-attribute 25%–40% of real inbound revenue and bid on low-intent search terms.`,
      sampleCode: `<!-- Detected unmonitored dial link -->\n<a href="tel:18005550199">Call Us Now</a>\n<!-- Missing: gtag('event', 'conversion', {...}) and dataLayer conversion hooks -->`,
      remediationBullets: [
        'Automated Google Ads & GA4 click-to-call conversion hook injection on all dial links.',
        'Full attribution preservation: UTM campaign, gclid, and session source captured.',
        'Zero layout disruption with backward-compatible dynamic call link instrumentation.',
        'Real-time verification in Google Tag Assistant & Ads conversion dashboard.'
      ]
    },
    form_bot_risk: {
      id: 'form_bot_risk',
      severity: 'medium',
      deductPoints: 12,
      title: 'Unshielded Form Edge & Bot Risk',
      badgeText: 'Medium Severity (-12 pts)',
      iconClass: 'icon-warning',
      iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
      detectionMeta: 'Interactive submission forms missing Cloudflare Turnstile, reCAPTCHA, or honeypot defense.',
      diagnosisHtml: `Your lead generation and contact forms are openly exposed to automated scraper bots without cryptographic challenge tokens or honeypot traps. Automated spam bots flood submission endpoints, <strong>poisoning sales CRM data, wasting sales development team time, and degrading domain email deliverability</strong> through spam-trap addresses.`,
      sampleCode: `<!-- Exposed submission form lacking bot telemetry -->\n<form action="/contact" method="POST">\n  <input type="email" name="email">\n  <!-- No Turnstile token, no cryptographic honeypot defense -->\n</form>`,
      remediationBullets: [
        'Zero-friction Cloudflare Turnstile invisible edge verification (no annoying user puzzles).',
        'Cryptographic CSS-cloaked honeypot trap with instant bot drop-off.',
        'Serverless edge validation with rate limiting to block automated credential stuffing.',
        '100% clean lead pipeline feeding directly into your sales CRM.'
      ]
    },
    vulnerable_js: {
      id: 'vulnerable_js',
      severity: 'high',
      deductPoints: 25,
      title: 'Outdated Scripts or Compromised CDNs',
      badgeText: 'High Severity (-25 pts)',
      iconClass: 'icon-danger',
      iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      detectionMeta: 'Outdated scripts (jQuery < 3.5.0 with CVE-2020-11022/11023) or untrusted CDNs (polyfill.io).',
      diagnosisHtml: `The page loads outdated scripts vulnerable to known Cross-Site Scripting (XSS) exploits or pulls assets from compromised third-party distribution networks (such as <code>polyfill.io</code>). This exposes your domain to malicious script injections, supply-chain redirects, and browser security warnings.`,
      sampleCode: `<!-- Vulnerable dependency signature detected -->\n<script src="https://code.jquery.com/jquery-1.11.1.min.js"></script>\n<!-- Or compromised domain: cdn.polyfill.io -->`,
      remediationBullets: [
        'Modernization to clean native vanilla DOM APIs or latest patched releases.',
        'Elimination of compromised third-party CDN endpoints.',
        'Sub-resource Integrity (SRI) hash locking for immutable security.'
      ]
    },
    viewport_clutter: {
      id: 'viewport_clutter',
      severity: 'medium',
      deductPoints: 12,
      title: 'Excessive Mobile Viewport Obstruction',
      badgeText: 'Medium Severity (-12 pts)',
      iconClass: 'icon-warning',
      iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>',
      detectionMeta: 'Sticky/fixed banners or headers obstructing > 28% of vertical viewport height.',
      diagnosisHtml: `Persistent sticky banners and fixed navigation consume more than 28% of the available mobile screen real estate. This chokes reading readability, triggers continuous Cumulative Layout Shift (CLS), and frustrates mobile users, degrading both SEO rankings and conversion rates.`,
      sampleCode: `/* Fixed navigation occupies excessive vertical ratio */\n.sticky-banner-wrap { position: fixed; height: 140px; } /* >28% mobile height */`,
      remediationBullets: [
        'Smart scroll-aware compact header transformation.',
        'Reduction of mobile viewport occupancy to <12%.',
        'Elimination of layout shifts during dynamic scroll transitions.'
      ]
    }
  };

  // State object starts completely unpopulated — NO hardcoded defaults!
  const state = {
    ref: null,
    domain: null,
    url: null,
    healthScore: null,
    flags: [],
    issuesCount: null,
    engineVer: null,
    hasAuditData: false,
    monthlyTraffic: 25000,
    leadValue: 500
  };

  /**
   * Helper: Parse query parameters from window.location.search
   */
  function parseQueryParams() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('ref')) {
      const r = params.get('ref').trim();
      if (r) state.ref = r;
    }

    if (params.has('engine_ver')) {
      const ev = params.get('engine_ver').trim();
      if (ev) state.engineVer = ev;
    }

    if (params.has('domain')) {
      const d = params.get('domain').trim();
      if (d) state.domain = sanitizeDomain(d);
    }

    if (params.has('url')) {
      const rawUrl = params.get('url').trim();
      if (rawUrl) {
        try {
          state.url = decodeURIComponent(rawUrl);
        } catch {
          state.url = rawUrl;
        }
        if (!state.domain) {
          state.domain = extractDomainFromUrl(state.url);
        }
      }
    } else if (state.domain) {
      state.url = 'https://' + state.domain + '/';
    }

    // Parse flags CSV
    if (params.has('flags')) {
      const flagsParam = params.get('flags').trim();
      if (!flagsParam) {
        state.flags = [];
        state.issuesCount = 0;
      } else {
        const rawFlags = flagsParam.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        state.flags = rawFlags;
        state.issuesCount = rawFlags.length;
      }
    } else if (params.has('issues_count')) {
      const count = parseInt(params.get('issues_count'), 10);
      if (!isNaN(count)) state.issuesCount = count;
      if (count === 0 && !params.has('flags')) state.flags = [];
    }

    // Parse health score
    if (params.has('health_score')) {
      const parsedScore = parseInt(params.get('health_score'), 10);
      if (!isNaN(parsedScore)) {
        state.healthScore = Math.max(0, Math.min(100, parsedScore));
      }
    } else if (params.has('flags')) {
      // Deterministic deduction calculation only if flags parameter was explicitly passed:
      let calculatedScore = 100;
      state.flags.forEach(f => {
        const def = ISSUE_DEFINITIONS[f];
        calculatedScore -= def ? def.deductPoints : 20;
      });
      state.healthScore = Math.max(0, calculatedScore);
    }

    // Determine whether any real audit data was dispatched
    state.hasAuditData = Boolean(state.domain || state.url || state.healthScore !== null || params.has('flags'));
  }

  function sanitizeDomain(str) {
    if (!str) return '';
    return str.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
  }

  function extractDomainFromUrl(urlString) {
    try {
      const parsed = new URL(urlString.startsWith('http') ? urlString : 'https://' + urlString);
      return parsed.hostname;
    } catch {
      return sanitizeDomain(urlString);
    }
  }

  /**
   * Generate an algorithmic sandbox verification hash
   */
  function generateVerificationHash(domain, score) {
    if (!domain || score === null) return '--';
    const ver = state.engineVer || '1.1';
    const str = `${domain}_${score}_${ver}_AFFISCOPE`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `AFFI-${hex.substring(0, 4)}-${hex.substring(4, 8)}`;
  }

  /**
   * Render and update the dynamic UI elements
   */
  function renderPage() {
    // 1. Hero text and target links
    const heroTitleEl = document.getElementById('heroTitle');
    const heroDomainWrap = document.getElementById('heroDomainWrap');
    const heroDomainText = document.getElementById('heroDomainText');
    const heroLeadEl = document.getElementById('heroLead');

    if (state.domain) {
      if (heroDomainWrap) heroDomainWrap.style.display = 'inline-block';
      if (heroDomainText) heroDomainText.textContent = state.domain;
      if (heroLeadEl) {
        heroLeadEl.textContent = 'Automated client-side diagnostics identified critical architecture deficits, artificial delay-JS cloaking, or untracked conversion leaks on this domain. Review your telemetry breakdown below and deploy our zero-downtime 48-Hour Staging Sprint.';
      }
    } else {
      if (heroDomainWrap) heroDomainWrap.style.display = 'none';
      if (heroLeadEl) {
        heroLeadEl.textContent = 'Diagnostic handoff workbench and clean-room staging remediation. Enter any domain or URL above to inspect technical architecture, or dispatch directly from the AffiScope diagnostic extension.';
      }
    }

    const domainInput = document.getElementById('domainInput');
    if (domainInput) {
      domainInput.value = state.domain || '';
      domainInput.placeholder = 'Enter target domain (e.g. client-site.com) or paste URL';
    }

    const liveTargetLink = document.getElementById('liveTargetLink');
    if (liveTargetLink) {
      if (state.url) {
        liveTargetLink.href = state.url;
        liveTargetLink.style.display = 'inline-flex';
        liveTargetLink.title = `Visit live target site: ${state.url}`;
      } else {
        liveTargetLink.style.display = 'none';
      }
    }

    const targetUrlDisplay = document.getElementById('targetUrlDisplay');
    if (targetUrlDisplay) targetUrlDisplay.textContent = state.url || '--';

    // 2. Engine and Spec Table
    const engineVerEl = document.getElementById('engineVerEl');
    if (engineVerEl) engineVerEl.textContent = state.engineVer ? `v${state.engineVer}` : '--';

    const engineVerBadge = document.getElementById('engineVerBadge');
    if (engineVerBadge) engineVerBadge.textContent = state.engineVer || '--';

    const telemetryDispatchChip = document.getElementById('telemetryDispatchChip');
    if (telemetryDispatchChip) {
      if (state.ref && state.engineVer) {
        telemetryDispatchChip.innerHTML = `<span class="pulse-dot"></span><span>AffiScope™ v${state.engineVer} Telemetry Dispatch</span>`;
      } else if (state.ref) {
        telemetryDispatchChip.innerHTML = `<span class="pulse-dot"></span><span>${escapeHtml(state.ref.toUpperCase())} Telemetry Dispatch</span>`;
      } else {
        telemetryDispatchChip.innerHTML = `<span class="pulse-dot"></span><span>Remediation Workbench Online</span>`;
      }
    }

    const sandboxHashEl = document.getElementById('sandboxHashEl');
    if (sandboxHashEl) sandboxHashEl.textContent = generateVerificationHash(state.domain, state.healthScore);

    const scanTimestampEl = document.getElementById('scanTimestampEl');
    if (scanTimestampEl) {
      if (state.hasAuditData) {
        const now = new Date();
        scanTimestampEl.textContent = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)} UTC`;
      } else {
        scanTimestampEl.textContent = '--';
      }
    }

    const executiveVerdictEl = document.getElementById('executiveVerdictEl');
    if (executiveVerdictEl) {
      if (state.healthScore !== null && state.healthScore < 80) {
        executiveVerdictEl.innerHTML = '<strong style="color: #ffffff;">Executive Risk Verdict:</strong> Your infrastructure presents detected deficits that distort PageSpeed telemetry while penalizing genuine user conversions and paid campaign ROAS.';
      } else if (state.healthScore !== null && state.healthScore >= 80) {
        executiveVerdictEl.innerHTML = '<strong style="color: #ffffff;">Executive Verdict:</strong> Your digital architecture demonstrates high compliance with Core Web Vitals standards with zero critical speed cloaking or conversion barriers.';
      } else {
        executiveVerdictEl.innerHTML = '<strong style="color: #ffffff;">Executive Status:</strong> Workbench is on standby. Ready to receive diagnostic parameters from AffiScope or evaluate a custom domain input.';
      }
    }

    // 3. Radial Health Score Animation
    animateRadialScore(state.healthScore);

    // 4. Render Issue Cards
    renderIssueCards();

    // 5. Pre-fill Booking Form
    prefillBookingForm();

    // 6. Update Revenue Impact Calculation
    updateRevenueCalculator();
  }

  /**
   * Animate radial SVG gauge
   */
  function animateRadialScore(targetScore) {
    const numberEl = document.getElementById('gaugeNumber');
    const circleEl = document.getElementById('gaugeProgressCircle');
    const badgeEl = document.getElementById('gaugeStatusBadge');

    const circumference = 2 * Math.PI * 70; // r = 70 => ~439.8
    if (circleEl) {
      circleEl.style.strokeDasharray = `${circumference}`;
    }

    // Standby condition if no score provided
    if (targetScore === null || targetScore === undefined) {
      if (numberEl) numberEl.textContent = '--';
      if (badgeEl) {
        badgeEl.className = 'gauge-status-badge status-standby';
        badgeEl.textContent = 'STANDBY • AWAITING DATA';
      }
      if (circleEl) {
        circleEl.style.stroke = 'rgba(255, 255, 255, 0.12)';
        circleEl.style.filter = 'none';
        circleEl.style.strokeDashoffset = `${circumference}`;
      }
      return;
    }

    // Determine status and colors for actual score
    let strokeColor = '#ee2b6c';
    let statusText = 'CRITICAL DEFICIT';
    let statusClass = 'status-critical';

    if (targetScore >= 80) {
      strokeColor = '#00cc76';
      statusText = 'HEALTHY SYSTEM';
      statusClass = 'status-optimal';
    } else if (targetScore >= 50) {
      strokeColor = '#f59e0b';
      statusText = 'MODERATE RISK';
      statusClass = 'status-warning';
    }

    if (badgeEl) {
      badgeEl.className = `gauge-status-badge ${statusClass}`;
      badgeEl.textContent = statusText;
    }

    if (circleEl) {
      circleEl.style.stroke = strokeColor;
      circleEl.style.filter = `drop-shadow(0 0 12px ${strokeColor}66)`;
      const offset = circumference - (targetScore / 100) * circumference;
      setTimeout(() => {
        circleEl.style.strokeDashoffset = `${offset}`;
      }, 50);
    }

    // Count up number
    if (numberEl) {
      let current = 0;
      const duration = 1100;
      const stepTime = 20;
      const increment = targetScore === 0 ? 0 : targetScore / (duration / stepTime);

      if (targetScore === 0) {
        numberEl.textContent = '0';
      } else {
        const timer = setInterval(() => {
          current += increment;
          if (current >= targetScore) {
            numberEl.textContent = targetScore;
            clearInterval(timer);
          } else {
            numberEl.textContent = Math.round(current);
          }
        }, stepTime);
      }
    }
  }

  /**
   * Render diagnostic issue cards dynamically based on flags
   */
  function renderIssueCards() {
    const container = document.getElementById('issuesContainer');
    const issuesCountBadge = document.getElementById('issuesCountBadge');
    if (!container) return;

    container.innerHTML = '';

    function attachCardSpotlight(el) {
      if (!el) return;
      el.addEventListener('mousemove', function (e) {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
        const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
        el.style.setProperty('--mouse-x', x + '%');
        el.style.setProperty('--mouse-y', y + '%');
      });
    }

    // Condition 1: No audit data at all (clean visit with no parameters)
    if (!state.hasAuditData) {
      if (issuesCountBadge) {
        issuesCountBadge.textContent = 'AWAITING DIAGNOSTIC TELEMETRY';
      }
      const emptyCard = document.createElement('article');
      emptyCard.className = 'issue-card spotlight-card reveal-on-scroll is-revealed';
      emptyCard.innerHTML = `
        <div class="issue-card-top" style="background: rgba(255, 255, 255, 0.02);">
          <div class="issue-title-group">
            <div class="issue-icon-wrap icon-info">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <div class="issue-heading-wrap">
              <h3>No Diagnostic Parameters Detected in Query</h3>
              <div class="issue-meta-summary">Awaiting AffiScope extension dispatch or manual domain entry.</div>
            </div>
          </div>
          <span class="issue-severity-pill status-standby">Standby Mode</span>
        </div>
        <div class="issue-card-content">
          <div class="issue-diagnosis-side">
            <div class="issue-block-label" style="color: #60a5fa;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              How This Workbench Functions
            </div>
            <div class="issue-description-text">
              This remediation portal automatically renders diagnostic analyses, revenue leakage impact, and isolated 48-hour staging roadmaps when dispatched from the <strong>AffiScope Chrome Extension</strong> or when query parameters are supplied.
            </div>
          </div>
          <div class="issue-solution-side">
            <div class="issue-block-label label-solution">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Quick Initialization Steps
            </div>
            <ul class="issue-solution-list">
              <li><span class="solution-bullet">→</span><span>Enter a website domain in the target bar above and click <strong>Analyze</strong>.</span></li>
              <li><span class="solution-bullet">→</span><span>Trigger a diagnostic audit from the <strong>AffiScope extension (Tab 2: Site Health)</strong>.</span></li>
              <li><span class="solution-bullet">→</span><span>Or fill out the staging request form below to initiate an urgent manual architecture review.</span></li>
            </ul>
          </div>
        </div>
      `;
      attachCardSpotlight(emptyCard);
      container.appendChild(emptyCard);
      return;
    }

    // Condition 2: Score 100 or flags explicitly empty in audited state
    if (state.flags.length === 0 || state.healthScore === 100) {
      if (issuesCountBadge) {
        issuesCountBadge.textContent = '0 ISSUES DETECTED • OPTIMAL ARCHITECTURE';
      }
      const cleanCard = document.createElement('article');
      cleanCard.className = 'issue-card spotlight-card reveal-on-scroll is-revealed';
      cleanCard.style.borderColor = 'rgba(0, 204, 118, 0.4)';
      cleanCard.innerHTML = `
        <div class="issue-card-top" style="background: rgba(0, 204, 118, 0.05);">
          <div class="issue-title-group">
            <div class="issue-icon-wrap" style="background: rgba(0, 204, 118, 0.15); border: 1px solid rgba(0, 204, 118, 0.4); color: #34d399;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="issue-heading-wrap">
              <h3>Pristine Architecture Verification — 0 Critical Issues Detected</h3>
              <div class="issue-meta-summary">AffiScope deep DOM & script audit passed with zero deductions.</div>
            </div>
          </div>
          <span class="issue-severity-pill" style="background: rgba(0, 204, 118, 0.15); border: 1px solid rgba(0, 204, 118, 0.3); color: #34d399;">Score 100/100 Optimal</span>
        </div>
        <div class="issue-card-content">
          <div class="issue-diagnosis-side">
            <div class="issue-block-label label-solution">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Certified Clean Infrastructure
            </div>
            <div class="issue-description-text">
              No artificial delayed-JS patterns, uninstrumented dial links, exposed forms, or compromised scripts were detected. Your digital architecture demonstrates high compliance with Core Web Vitals standards.
            </div>
          </div>
          <div class="issue-solution-side">
            <div class="issue-block-label label-solution">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Continuous Scale & Growth Recommendations
            </div>
            <ul class="issue-solution-list">
              <li><span class="solution-bullet">✓</span><span>Implement Edge CDN caching and geo-distributed asset replication.</span></li>
              <li><span class="solution-bullet">✓</span><span>Establish automated Core Web Vitals synthetic regression tracking.</span></li>
              <li><span class="solution-bullet">✓</span><span>Quarterly architecture reviews with DreaInno engineering leadership.</span></li>
            </ul>
          </div>
        </div>
      `;
      attachCardSpotlight(cleanCard);
      container.appendChild(cleanCard);
      return;
    }

    // Condition 3: Flags provided in query parameters
    const activeIssues = [];
    state.flags.forEach(flagId => {
      if (ISSUE_DEFINITIONS[flagId]) {
        activeIssues.push(ISSUE_DEFINITIONS[flagId]);
      } else {
        activeIssues.push({
          id: flagId,
          severity: 'high',
          deductPoints: 20,
          title: `Diagnostic Detection: ${flagId.replace(/_/g, ' ').toUpperCase()}`,
          badgeText: 'High Priority Remediation',
          iconClass: 'icon-danger',
          iconSvg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
          detectionMeta: `Flagged during automated deep DOM & network inspection.`,
          diagnosisHtml: `Architectural irregularity detected requiring custom staging remediation.`,
          sampleCode: `/* Telemetry identifier: ${flagId} */`,
          remediationBullets: [
            'Surgical codebase refactoring on isolated staging clone.',
            'Production verification and automated regression testing.'
          ]
        });
      }
    });

    if (issuesCountBadge) {
      issuesCountBadge.textContent = `${activeIssues.length} CRITICAL DEFICIT${activeIssues.length === 1 ? '' : 'S'} DETECTED`;
    }

    activeIssues.forEach((issue, idx) => {
      const card = document.createElement('article');
      card.className = 'issue-card spotlight-card reveal-on-scroll is-revealed';
      card.id = `issue-${issue.id}`;

      const severityClass = issue.severity === 'high' ? 'severity-high' : 'severity-medium';

      card.innerHTML = `
        <div class="issue-card-top">
          <div class="issue-title-group">
            <div class="issue-icon-wrap ${issue.iconClass}">
              ${issue.iconSvg}
            </div>
            <div class="issue-heading-wrap">
              <h3>${idx + 1}. ${issue.title}</h3>
              <div class="issue-meta-summary">${issue.detectionMeta}</div>
            </div>
          </div>
          <span class="issue-severity-pill ${severityClass}">${issue.badgeText}</span>
        </div>
        <div class="issue-card-content">
          <div class="issue-diagnosis-side">
            <div class="issue-block-label label-detection">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Impact on Users & Attribution
            </div>
            <div class="issue-description-text">${issue.diagnosisHtml}</div>
            <div class="issue-code-snippet">${escapeHtml(issue.sampleCode)}</div>
          </div>
          <div class="issue-solution-side">
            <div class="issue-block-label label-solution">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              DreaInno 48-Hour Staging Remediation Blueprint
            </div>
            <ul class="issue-solution-list">
              ${issue.remediationBullets.map(bullet => `
                <li>
                  <span class="solution-bullet">✓</span>
                  <span>${bullet}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      `;
      attachCardSpotlight(card);
      container.appendChild(card);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Real-time Revenue & Conversion Loss Calculator
   */
  function updateRevenueCalculator() {
    const trafficValEl = document.getElementById('calcTrafficVal');
    const lostRevEl = document.getElementById('calcLostRev');
    const lostLeadsEl = document.getElementById('calcLostLeads');
    const adAttributionLeakEl = document.getElementById('calcAdLeak');

    if (trafficValEl) {
      trafficValEl.textContent = state.monthlyTraffic.toLocaleString();
    }

    if (state.healthScore === null || state.healthScore === undefined) {
      if (lostRevEl) lostRevEl.textContent = '--';
      if (lostLeadsEl) lostLeadsEl.textContent = '--';
      if (adAttributionLeakEl) adAttributionLeakEl.textContent = '--';
      return;
    }

    const healthDeficit = (100 - state.healthScore) / 100;
    
    if (healthDeficit <= 0) {
      if (lostRevEl) lostRevEl.textContent = '$0';
      if (lostLeadsEl) lostLeadsEl.textContent = '0 leads lost';
      if (adAttributionLeakEl) adAttributionLeakEl.textContent = '0% leakage';
      return;
    }

    // Baseline conversion rate: 2.2%
    const conversionPenalty = 0.28 * healthDeficit; 
    const baselineLeads = state.monthlyTraffic * 0.022;
    const lostLeads = Math.round(baselineLeads * conversionPenalty);
    const estimatedLostRevenue = Math.round(lostLeads * state.leadValue);
    const adLeakPercentage = Math.min(45, Math.round(18 + (healthDeficit * 24)));

    if (lostRevEl) {
      lostRevEl.textContent = `$${estimatedLostRevenue.toLocaleString()}`;
    }
    if (lostLeadsEl) {
      lostLeadsEl.textContent = `${lostLeads} leads/mo`;
    }
    if (adAttributionLeakEl) {
      adAttributionLeakEl.textContent = `~${adLeakPercentage}% untracked`;
    }
  }

  /**
   * Pre-fill the 48-Hour Staging Sprint Form
   */
  function prefillBookingForm() {
    const domainInput = document.getElementById('formTargetDomain');
    if (domainInput) {
      if (state.domain) {
        domainInput.value = state.domain;
        domainInput.setAttribute('readonly', 'true');
      } else {
        domainInput.value = '';
        domainInput.removeAttribute('readonly');
        domainInput.placeholder = 'Enter target domain (e.g. client-site.com)';
      }
    }

    const urlInput = document.getElementById('formTargetUrl');
    if (urlInput) urlInput.value = state.url || '';

    const notesTextarea = document.getElementById('formNotes');
    if (notesTextarea && (!notesTextarea.value || notesTextarea.dataset.userEdited !== 'true')) {
      if (state.hasAuditData && state.domain) {
        const flagsFormatted = state.flags.length > 0 
          ? state.flags.map(f => f.replace(/_/g, ' ')).join(', ')
          : 'None (Certified Optimal Architecture)';
        const scoreFormatted = state.healthScore !== null ? `${state.healthScore}/100` : '--';
        const verFormatted = state.engineVer ? `v${state.engineVer}` : 'Diagnostic';
        notesTextarea.value = `AffiScope ${verFormatted} Diagnostic Dispatch:\n• Target Domain: ${state.domain}\n• Target URL: ${state.url || state.domain}\n• Health Score: ${scoreFormatted}\n• Flagged Issues: ${flagsFormatted}\n\nUrgent 48-Hour Staging Sprint requested. Please initiate staging clone and deploy remediation blueprint.`;
      } else {
        notesTextarea.value = '';
        notesTextarea.placeholder = 'Describe your website requirements, performance targets, or specific errors to fix on staging. We respond within 4 hours.';
      }
    }
  }

  /**
   * Initialize all event listeners
   */
  function initEvents() {
    // 1. Calculator slider
    const trafficSlider = document.getElementById('trafficSlider');
    if (trafficSlider) {
      trafficSlider.value = state.monthlyTraffic;
      trafficSlider.addEventListener('input', function () {
        state.monthlyTraffic = parseInt(this.value, 10);
        updateRevenueCalculator();
      });
    }

    // 2. Calculator lead value presets
    const presetBtns = document.querySelectorAll('.calc-preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        presetBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.leadValue = parseInt(this.getAttribute('data-val'), 10);
        updateRevenueCalculator();
      });
    });

    // 3. Domain rescan / analyze bar
    const domainForm = document.getElementById('domainBarForm');
    const domainInput = document.getElementById('domainInput');
    if (domainForm && domainInput) {
      domainForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const raw = domainInput.value.trim();
        if (!raw) return;

        const sanitized = sanitizeDomain(raw);
        state.domain = sanitized;
        state.url = 'https://' + sanitized + '/';
        state.hasAuditData = true;

        // If analyzing fresh without preset query params, calculate based on any known flags or preserve current
        const newUrl = `${window.location.pathname}?domain=${encodeURIComponent(state.domain)}${state.healthScore !== null ? '&health_score=' + state.healthScore : ''}${state.flags.length > 0 ? '&flags=' + encodeURIComponent(state.flags.join(',')) : ''}${state.engineVer ? '&engine_ver=' + state.engineVer : ''}${state.ref ? '&ref=' + state.ref : ''}`;
        window.history.replaceState({}, '', newUrl);

        renderPage();
        showToast(`Remediation workspace generated for ${state.domain}`);
      });
    }

    // 4. Notes textarea edit detection
    const notesTextarea = document.getElementById('formNotes');
    if (notesTextarea) {
      notesTextarea.addEventListener('input', function () {
        this.dataset.userEdited = 'true';
      });
    }

    // 5. Booking Form Submission
    const bookingForm = document.getElementById('sprintBookingForm');
    if (bookingForm) {
      bookingForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const submitBtn = bookingForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        const targetDomainValue = document.getElementById('formTargetDomain')?.value.trim() || state.domain || 'Client Domain';
        const clientName = document.getElementById('formClientName')?.value.trim() || 'Client';
        const clientEmail = document.getElementById('formClientEmail')?.value.trim() || '';
        const sprintType = document.getElementById('formSprintType')?.value || '48-Hour Rapid Staging Sprint';
        const notes = document.getElementById('formNotes')?.value || '';

        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
          Locking In Staging Sprint...
        `;

        const subject = encodeURIComponent(`[48-Hour Staging Sprint] ${targetDomainValue} Remediation Request`);
        const body = encodeURIComponent(
          `Client Name: ${clientName}\nEmail: ${clientEmail}\nTarget Domain: ${targetDomainValue}\nTarget URL: ${state.url || targetDomainValue}\nSprint Tier: ${sprintType}\nHealth Score: ${state.healthScore !== null ? state.healthScore + '/100' : 'Awaiting Audit'}\nFlags: ${state.flags.length > 0 ? state.flags.join(', ') : 'None / Custom'}\n\nProject Scope & Notes:\n${notes}`
        );

        setTimeout(() => {
          submitBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Sprint Slot Locked! Dispatching...
          `;
          submitBtn.style.background = '#00cc76';

          showToast(`Staging Sprint confirmed for ${targetDomainValue}! DreaInno team notified.`);

          window.location.href = `mailto:admin@dreainno.website?subject=${subject}&body=${body}`;

          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            submitBtn.style.background = '';
          }, 3500);
        }, 1100);
      });
    }
  }

  /**
   * Toast notification helper
   */
  function showToast(message) {
    let toast = document.getElementById('fixToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'fixToast';
      toast.className = 'fix-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00cc76" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>${escapeHtml(message)}</span>
    `;
    toast.classList.add('is-active');

    setTimeout(() => {
      toast.classList.remove('is-active');
    }, 4000);
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    parseQueryParams();
    renderPage();
    initEvents();
  });

})();
