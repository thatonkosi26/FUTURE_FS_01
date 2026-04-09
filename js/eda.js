const cb = document.getElementById('theme-checkbox'), html = document.documentElement;
  if (localStorage.getItem('portfolio-theme') === 'light') { html.classList.add('light'); cb.checked = true; }
  cb.addEventListener('change', () => {
    const flash = document.createElement('div');
    flash.style.cssText = `position:fixed;inset:0;z-index:9990;pointer-events:none;background:${cb.checked?'#d0d8e8':'#020408'};opacity:0;transition:opacity 0.15s;`;
    document.body.appendChild(flash);
    requestAnimationFrame(() => { flash.style.opacity = '0.35'; setTimeout(() => { cb.checked ? html.classList.add('light') : html.classList.remove('light'); localStorage.setItem('portfolio-theme', cb.checked ? 'light' : 'dark'); flash.style.opacity = '0'; setTimeout(() => flash.remove(), 200); }, 120); });
  });
  const cursor = document.getElementById('cursor'), trail = document.getElementById('cursor-trail');
  let mx = 0, my = 0, tx = 0, ty = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; cursor.style.transform = `translate(${mx-6}px,${my-6}px)`; });
  (function a() { tx += (mx-tx)*0.12; ty += (my-ty)*0.12; trail.style.transform = `translate(${tx-16}px,${ty-16}px)`; requestAnimationFrame(a); })();
  const obs = new IntersectionObserver(entries => entries.forEach((e,i) => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('visible'), i*80); obs.unobserve(e.target); } }), { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  function handleImage(input, zoneId) {
    const file = input.files[0]; if (!file) return;
    const zone = document.getElementById(zoneId);
    const reader = new FileReader();
    reader.onload = e => { zone.innerHTML = `<img src="${e.target.result}" alt="screenshot"><div class="upload-hover-label">↑ CHANGE IMAGE</div><input type="file" accept="image/*" class="upload-input" onchange="handleImage(this,'${zoneId}')">`; };
    reader.readAsDataURL(file);
  }
  let cardCount = 2;
  function addCard() {
    const zoneId = `zone-${cardCount}`;
    const card = document.createElement('div');
    card.className = 'proj-card';
    card.style.cssText = 'opacity:0;transform:translateY(24px);transition:opacity 0.5s,transform 0.5s';
    card.innerHTML = `<a href="#" class="card-corner">↗</a><div class="upload-zone" id="${zoneId}"><input type="file" accept="image/*" class="upload-input" onchange="handleImage(this,'${zoneId}')"><div class="upload-placeholder"><div class="upload-icon">◈</div><div class="upload-text">CLICK TO UPLOAD IMAGE</div></div><div class="upload-hover-label">↑ UPLOAD SCREENSHOT</div></div><div class="card-body"><div class="card-num">PROJECT_0${cardCount}</div><div class="card-tags"><span class="card-tag" contenteditable="true">TAG</span></div><h3 class="card-title" contenteditable="true">Project Title</h3><p class="card-desc" contenteditable="true">Click to edit description...</p><div class="card-tech"><span class="tech-pill" contenteditable="true">TECH</span></div><div class="card-footer"><a href="#" class="card-link" contenteditable="true">VIEW PROJECT ↗</a><span class="card-date" contenteditable="true">2026</span></div></div>`;
    document.getElementById('projects-grid').appendChild(card);
    requestAnimationFrame(() => requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }));
    attachTilt(card); cardCount++;
  }
  function attachTilt(card) {
    card.addEventListener('mousemove', e => { const r = card.getBoundingClientRect(); const x = (e.clientX-r.left)/r.width-0.5, y = (e.clientY-r.top)/r.height-0.5; card.style.transform = `perspective(800px) rotateY(${x*6}deg) rotateX(${-y*6}deg) translateY(-6px)`; });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  }
  document.querySelectorAll('.proj-card').forEach(attachTilt);