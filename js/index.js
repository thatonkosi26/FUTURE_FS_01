// ── THEME TOGGLE ────────────────────────────────────
const themeCheckbox = document.getElementById('theme-checkbox');
const html = document.documentElement;

// Restore saved preference
const savedTheme = localStorage.getItem('portfolio-theme');
if (savedTheme === 'light') {
  html.classList.add('light');
  themeCheckbox.checked = true;
}

themeCheckbox.addEventListener('change', () => {
  // Flash effect on switch
  const flash = document.createElement('div');
  flash.style.cssText = `
    position:fixed;inset:0;z-index:9990;pointer-events:none;
    background:${themeCheckbox.checked ? '#d0d8e8' : '#020408'};
    opacity:0;transition:opacity 0.15s;
  `;
  document.body.appendChild(flash);
  requestAnimationFrame(() => {
    flash.style.opacity = '0.35';
    setTimeout(() => {
      if (themeCheckbox.checked) {
        html.classList.add('light');
        localStorage.setItem('portfolio-theme', 'light');
      } else {
        html.classList.remove('light');
        localStorage.setItem('portfolio-theme', 'dark');
      }
      flash.style.opacity = '0';
      setTimeout(() => flash.remove(), 200);
    }, 120);
  });
});

// ── LOADER ──────────────────────────────────────────────
let pct = 0;
const pctEl = document.getElementById('loader-percent');
const loaderInterval = setInterval(() => {
  pct = Math.min(pct + Math.random() * 12, 99);
  pctEl.textContent = Math.floor(pct) + '%';
}, 120);

window.addEventListener('load', () => {
  clearInterval(loaderInterval);
  pctEl.textContent = '100%';
  setTimeout(() => {
    document.getElementById('loader').classList.add('done');
  }, 600);
});

// Fallback
setTimeout(() => {
  document.getElementById('loader').classList.add('done');
}, 2500);

// ── CURSOR ──────────────────────────────────────────────
const cursor = document.getElementById('cursor');
const trail = document.getElementById('cursor-trail');
let mx = 0, my = 0, tx = 0, ty = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.transform = `translate(${mx - 6}px, ${my - 6}px)`;
});

function animTrail() {
  tx += (mx - tx) * 0.12;
  ty += (my - ty) * 0.12;
  trail.style.transform = `translate(${tx - 16}px, ${ty - 16}px)`;
  requestAnimationFrame(animTrail);
}
animTrail();

document.addEventListener('mousedown', () => {
  cursor.style.transform += ' scale(1.8)';
  cursor.style.background = 'var(--cyan)';
});
document.addEventListener('mouseup', () => {
  cursor.style.background = 'transparent';
});

// ── SCROLL REVEAL ───────────────────────────────────────
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 60);
      // Trigger skill bars
      entry.target.querySelectorAll('.skill-bar-fill').forEach(bar => {
        const w = parseFloat(bar.style.getPropertyValue('--w') || 1);
        bar.style.width = (w * 100) + '%';
      });
      entry.target.classList.add('animated');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

reveals.forEach(el => observer.observe(el));

// ── PARALLAX HERO BG ────────────────────────────────────
const heroBg = document.getElementById('hero-bg');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (heroBg) heroBg.style.transform = `scale(1.05) translateY(${y * 0.3}px)`;
}, { passive: true });

// ── GLITCH RANDOM ───────────────────────────────────────
function randomGlitch() {
  const glitches = document.querySelectorAll('.glitch');
  glitches.forEach(el => {
    if (Math.random() < 0.3) {
      el.style.transform = `translateX(${(Math.random()-0.5)*6}px)`;
      setTimeout(() => el.style.transform = '', 80);
    }
  });
  setTimeout(randomGlitch, 800 + Math.random() * 1500);
}
randomGlitch();

// ── COUNTER ANIMATION ───────────────────────────────────
function animCounter(el, target, dur) {
  let start = 0;
  const step = target / (dur / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { el.textContent = target + (el.dataset.suffix || ''); clearInterval(timer); }
    else el.textContent = Math.floor(start) + (el.dataset.suffix || '');
  }, 16);
}

// Observe stats
const statNums = document.querySelectorAll('.stat-num');
const statObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const text = e.target.textContent;
      const num = parseInt(text);
      const suf = text.replace(/\d/g, '');
      e.target.dataset.suffix = suf;
      animCounter(e.target, num, 1200);
      statObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
statNums.forEach(n => statObs.observe(n));

// ── SKILLS FAN DECK ─────────────────────────────────
(function () {
  const track  = document.getElementById('skills-track');
  const vp     = document.getElementById('skills-viewport');
  if (!track || !vp) return;

  const items  = Array.from(track.querySelectorAll('.skill-item'));
  const total  = items.length;
  if (!total) return;

  // Inject BR corner bracket into every frame
  items.forEach((el, i) => {
    const frame = el.querySelector('.skill-frame');
    if (frame && !frame.querySelector('.skill-frame-br')) {
      const br = document.createElement('div');
      br.className = 'skill-frame-br';
      frame.appendChild(br);
    }
    el.setAttribute('data-idx', i);
  });

  let current   = 0;
  let isHovered = false;
  let autoTimer = null;

  /* ── FAN GEOMETRY ──────────────────────────────────────
     Cards stack perfectly on each other at rest.
     On hover the whole deck fans out: cards spread
     symmetrically left and right around the active card,
     each one slightly rotated and translated so you can
     see every card fully — just like the reference image.
  ─────────────────────────────────────────────────────── */
  const CARD_W      = 180;   // matches CSS width
  const FAN_SPREAD  = 200;   // px between card centres when fanned
  const FAN_ROT     = 12;    // max rotation in degrees per step
  const STACK_PEEK  = 6;     // px of each card peeking when stacked

  function layout(fanned) {
    items.forEach((el, i) => {
      // offset from active card (-ve = left, +ve = right)
      let offset = i - current;

      // wrap so cards always pick the shortest path
      if (offset >  total / 2) offset -= total;
      if (offset < -total / 2) offset += total;

      let tx = 0, ty = 0, rot = 0, scale = 1, opacity = 1, z = 0;

      if (fanned) {
        // ── FANNED STATE ──
        tx      = offset * FAN_SPREAD;
        ty      = Math.abs(offset) * 14;   // arc: outer cards drop slightly
        rot     = offset * FAN_ROT;
        scale   = 1 - Math.abs(offset) * 0.04;
        opacity = 1 - Math.abs(offset) * 0.08;
        z       = total - Math.abs(offset);
      } else {
        // ── STACKED STATE ──
        // Active card on top; others peek a few px behind
        const absOff = Math.abs(offset);
        tx      = offset * STACK_PEEK;
        ty      = absOff * STACK_PEEK * 0.5;
        rot     = offset * 3;
        scale   = 1 - absOff * 0.025;
        opacity = absOff > 3 ? 0 : 1 - absOff * 0.15;
        z       = total - absOff;
      }

      el.style.transition = 'transform 0.65s cubic-bezier(0.34,1.4,0.64,1), opacity 0.4s ease, filter 0.4s ease';
      el.style.transform  = `translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg) scale(${scale})`;
      el.style.opacity    = opacity;
      el.style.zIndex     = z;
      el.style.filter     = `brightness(${fanned && offset !== 0 ? 0.72 : 1})`;

      el.classList.toggle('is-active',  offset === 0);
      el.classList.toggle('is-hovered', false);
    });
    updateUI();
  }

  function updateUI() {
    // dots
    document.querySelectorAll('.skills-dot').forEach((d, i) =>
      d.classList.toggle('active', i === current)
    );
    // counter
    const num = document.querySelector('.skills-counter-num');
    if (num) num.textContent =
      String(current + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
  }

  function goTo(idx, fan = isHovered) {
    current = ((idx % total) + total) % total;
    layout(fan);
  }
  function next() { goTo(current + 1, isHovered); }
  function prev() { goTo(current - 1, isHovered); }

  // ── BUILD DOTS ──
  const dotsWrap = document.querySelector('.skills-dots');
  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    items.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'skills-dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => { goTo(i); scheduleNext(); });
      dotsWrap.appendChild(d);
    });
  }

  // ── HOVER — FAN OUT ──
  vp.addEventListener('mouseenter', () => {
    isHovered = true;
    clearTimeout(autoTimer);
    layout(true);   // spread the deck
  });
  vp.addEventListener('mouseleave', () => {
    isHovered = false;
    // remove per-card hover state
    items.forEach(el => el.classList.remove('is-hovered'));
    layout(false);  // collapse back
    scheduleNext();
  });

  // ── HOVER ON INDIVIDUAL CARD — highlight it ──
  items.forEach((el, i) => {
    el.addEventListener('mouseenter', () => {
      if (!isHovered) return;
      items.forEach(c => c.classList.remove('is-hovered'));
      el.classList.add('is-hovered');
    });
    el.addEventListener('mouseleave', () => {
      el.classList.remove('is-hovered');
    });
    // click a card to make it active
    el.addEventListener('click', () => {
      goTo(i, true);
      scheduleNext();
    });
  });

  // ── AUTO CYCLE — non-linear delays ──
  const delays = [3400, 2600, 3800, 2200, 4000, 2800, 3200, 3600, 2400, 3000];
  let delayIdx = 0;

  function scheduleNext() {
    clearTimeout(autoTimer);
    if (isHovered) return;
    const d = delays[delayIdx % delays.length];
    delayIdx++;
    autoTimer = setTimeout(() => { next(); scheduleNext(); }, d);
  }

  // ── NAV BUTTONS ──
  document.getElementById('skill-prev')?.addEventListener('click', () => { prev(); scheduleNext(); });
  document.getElementById('skill-next')?.addEventListener('click', () => { next(); scheduleNext(); });

  // ── TOUCH SWIPE ──
  let tx0 = 0;
  vp.addEventListener('touchstart', e => { tx0 = e.touches[0].clientX; }, { passive: true });
  vp.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx0;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); scheduleNext(); }
  });

  // ── INIT ──
  layout(false);
  scheduleNext();
})();

// ── CARD TILT ───────────────────────────────────────────
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-6px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ── CONTACT FORM (EmailJS) ─────────────────────────────
(function () {
  // ─────────────────────────────────────────────────────────────────
  // SETUP INSTRUCTIONS:
  //  1. Go to https://www.emailjs.com and create a free account
  //  2. Add an Email Service (Gmail, Outlook, etc.) → copy the Service ID
  //  3. Create an Email Template with these variables:
  //       {{from_name}}  {{from_email}}  {{subject}}  {{message}}  {{reply_to}}
  //     Copy the Template ID
  //  4. Go to Account → API Keys → copy your Public Key
  //  5. Replace the three placeholder strings below with your real values
  // ─────────────────────────────────────────────────────────────────
  const EMAILJS_PUBLIC_KEY  = 'pzATnF4Gl96EUhrPD';   // ← replace
  const EMAILJS_SERVICE_ID  = 'service_iuxqh3m';   // ← replace
  const EMAILJS_TEMPLATE_ID = 'template_diebehm';  // ← replace

  // Load EmailJS SDK dynamically so it doesn't block page load
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  script.onload = () => {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  };
  document.head.appendChild(script);

  const form    = document.getElementById('contact-form');
  const btn     = document.getElementById('form-submit-btn');
  const status  = document.getElementById('form-status');
  const spinner = btn ? btn.querySelector('.btn-spinner') : null;
  const label   = btn ? btn.querySelector('.btn-label') : null;

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Basic validation
    const name    = form.querySelector('#cf-name').value.trim();
    const email   = form.querySelector('#cf-email').value.trim();
    const subject = form.querySelector('#cf-subject').value;
    const message = form.querySelector('#cf-message').value.trim();

    if (!name || !email || !subject || !message) {
      showStatus('error', '✗ ALL FIELDS REQUIRED // TRANSMISSION INCOMPLETE');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showStatus('error', '✗ INVALID EMAIL // CHECK TRANSMISSION VECTOR');
      return;
    }

    // Loading state
    setLoading(true);
    hideStatus();

    const templateParams = {
      from_name:  name,
      from_email: email,
      reply_to:   email,
      subject:    subject,
      message:    message,
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
      showStatus('success', '✓ TRANSMISSION SENT // UPLINK ESTABLISHED — WILL RESPOND WITHIN 24H');
      form.reset();
    } catch (err) {
      console.error('EmailJS error:', err);
      showStatus('error', '✗ TRANSMISSION FAILED // RETRY OR USE DIRECT UPLINK BELOW');
    } finally {
      setLoading(false);
    }
  });

  function setLoading(on) {
    if (!btn) return;
    btn.disabled = on;
    btn.classList.toggle('loading', on);
  }
  function showStatus(type, msg) {
    if (!status) return;
    status.textContent = msg;
    status.className = 'form-status ' + type;
  }
  function hideStatus() {
    if (!status) return;
    status.className = 'form-status';
  }
})();