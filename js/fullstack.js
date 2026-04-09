  /* ── THEME ── */
  const cb = document.getElementById('theme-checkbox'), html = document.documentElement;
  if (localStorage.getItem('portfolio-theme') === 'light') { html.classList.add('light'); cb.checked = true; }
  cb.addEventListener('change', () => {
    const flash = document.createElement('div');
    flash.style.cssText = `position:fixed;inset:0;z-index:9990;pointer-events:none;background:${cb.checked?'#d0d8e8':'#020408'};opacity:0;transition:opacity 0.15s;`;
    document.body.appendChild(flash);
    requestAnimationFrame(() => {
      flash.style.opacity = '0.35';
      setTimeout(() => {
        cb.checked ? html.classList.add('light') : html.classList.remove('light');
        localStorage.setItem('portfolio-theme', cb.checked ? 'light' : 'dark');
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 200);
      }, 120);
    });
  });

  /* ── CURSOR ── */
  const cursor = document.getElementById('cursor'), trail = document.getElementById('cursor-trail');
  let mx = 0, my = 0, tx = 0, ty = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; cursor.style.transform = `translate(${mx-6}px,${my-6}px)`; });
  (function a() { tx += (mx-tx)*0.12; ty += (my-ty)*0.12; trail.style.transform = `translate(${tx-16}px,${ty-16}px)`; requestAnimationFrame(a); })();

  /* ── REVEAL ── */
  const obs = new IntersectionObserver(entries => entries.forEach((e,i) => {
    if (e.isIntersecting) { setTimeout(() => e.target.classList.add('visible'), i * 100); obs.unobserve(e.target); }
  }), { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  /* ── CARD TILT ── */
  document.querySelectorAll('.proj-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x*6}deg) rotateX(${-y*6}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });