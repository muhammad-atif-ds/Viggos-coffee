(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Load sequence ---------- */
  const reveal = () => requestAnimationFrame(() => root.classList.add('is-loaded'));
  if (document.readyState === 'complete') reveal();
  else window.addEventListener('load', reveal);
  setTimeout(reveal, 1800); // don't hold the page hostage to a slow image
  window.addEventListener('pageshow', e => { if (e.persisted) root.classList.remove('is-leaving'); });

  /* ---------- Page transitions ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !url.pathname.endsWith('.html') && url.pathname !== '/') return;
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    root.classList.add('is-leaving');
    setTimeout(() => { location.href = url.href; }, reduce ? 0 : 420);
  });

  /* ---------- Header: solid on scroll, hide on scroll down ---------- */
  const header = document.querySelector('.site-header');
  const bar = document.querySelector('.progress');
  let lastY = scrollY;

  /* ---------- Parallax ---------- */
  const para = [...document.querySelectorAll('[data-parallax]')];

  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 40);
      header.classList.toggle('is-hidden', y > 300 && y > lastY && !root.classList.contains('nav-open'));
    }
    lastY = y;
    if (bar) {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }
    if (!reduce) {
      for (const el of para) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) continue;
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        const center = r.top + r.height / 2 - innerHeight / 2;
        el.style.setProperty('--py', `${(-center * speed).toFixed(1)}px`);
      }
    }
    timelineFill();
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);

  /* ---------- Mobile drawer ---------- */
  const burger = document.querySelector('.burger');
  if (burger) {
    const toggle = open => {
      root.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => toggle(!root.classList.contains('nav-open')));
    addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
  }

  /* ---------- Scroll reveals + count-ups ---------- */
  const countUp = el => {
    const end = parseFloat(el.dataset.count);
    if (reduce) { el.textContent = end.toLocaleString(); return; }
    const t0 = performance.now(), dur = 1600;
    const step = t => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(entries => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add('in');
      en.target.querySelectorAll('[data-count]').forEach(countUp);
      if (en.target.dataset.count) countUp(en.target);
      io.unobserve(en.target);
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal], [data-count]').forEach(el => io.observe(el));

  /* ---------- Timeline fill ---------- */
  const tl = document.querySelector('.timeline');
  const fill = tl && tl.querySelector('.fill');
  function timelineFill() {
    if (!fill) return;
    const r = tl.getBoundingClientRect();
    const p = Math.min(Math.max((innerHeight * 0.7 - r.top) / r.height, 0), 1);
    fill.style.transform = `scaleY(${p})`;
  }

  /* ---------- Testimonials ---------- */
  document.querySelectorAll('[data-slides]').forEach(box => {
    const slides = [...box.querySelectorAll('.slide')];
    const dots = [...box.querySelectorAll('.dots button')];
    let i = 0, timer;
    const go = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle('is-active', k === i); s.setAttribute('aria-hidden', k !== i); });
      dots.forEach((d, k) => d.setAttribute('aria-current', k === i));
    };
    const play = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => go(i + 1), 6000); };
    dots.forEach((d, k) => d.addEventListener('click', () => { go(k); play(); }));
    box.addEventListener('mouseenter', () => clearInterval(timer));
    box.addEventListener('mouseleave', play);
    go(0); play();
  });

  /* ---------- Open now ---------- */
  // Café time (Antwerp), whatever the visitor's timezone. Sun 10–17, Mon–Fri 8–17, Sat closed.
  const hoursByDay = [[10, 17], [8, 17], [8, 17], [8, 17], [8, 17], [8, 17], null];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
    .formatToParts(new Date()).map(p => [p.type, p.value]));
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  const h = +parts.hour + +parts.minute / 60;
  const today = hoursByDay[day];
  const open = !!today && h >= today[0] && h < today[1];
  let label = `Open now · until ${today && today[1]}h`;
  if (!open) {
    for (let k = 0; k < 7; k++) {
      const d = (day + k) % 7, slot = hoursByDay[d];
      if (!slot || (k === 0 && h >= slot[0])) continue;
      label = `Closed · opens ${k === 0 ? 'today' : k === 1 ? 'tomorrow' : dayNames[d]} at ${slot[0]}h`;
      break;
    }
  }
  document.querySelectorAll('[data-open-badge]').forEach(b => {
    b.classList.toggle('closed', !open);
    b.querySelector('.txt').textContent = label;
  });
  document.querySelectorAll('.hours li[data-days]').forEach(li => {
    if (li.dataset.days.split(',').map(Number).includes(day)) li.classList.add('today');
  });

  /* ---------- Menu filter + preview ---------- */
  const tabs = [...document.querySelectorAll('.tab')];
  const items = [...document.querySelectorAll('.menu-item')];
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.setAttribute('aria-selected', t === tab));
    const cat = tab.dataset.cat;
    items.forEach(it => it.classList.add('is-out'));
    setTimeout(() => {
      let k = 0;
      items.forEach(it => {
        const show = cat === 'all' || it.dataset.cat === cat;
        it.hidden = !show;
        if (show) setTimeout(() => it.classList.remove('is-out'), 40 * k++);
      });
    }, reduce ? 0 : 280);
  }));
  const frame = document.querySelector('.menu-frame');
  if (frame) {
    const imgs = [...frame.querySelectorAll('img')];
    const cap = frame.querySelector('figcaption');
    let front = 0;
    const show = (src, name) => {
      if (imgs[front].getAttribute('src') === src) return;
      front = 1 - front;
      imgs[front].src = src;
      imgs[front].classList.add('is-on');
      imgs[1 - front].classList.remove('is-on');
      cap.textContent = name;
    };
    items.forEach(it => {
      if (!it.dataset.img) return;
      const name = it.querySelector('h3').firstChild.textContent.trim();
      it.addEventListener('mouseenter', () => show(it.dataset.img, name));
      it.addEventListener('focusin', () => show(it.dataset.img, name));
    });
  }

  /* ---------- Forms (client-side validation) ---------- */
  document.querySelectorAll('form[data-validate]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      form.querySelectorAll('[required]').forEach(input => {
        const field = input.closest('.field');
        let msg = '';
        if (!input.value.trim()) msg = 'Fill in this field.';
        else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) msg = 'Enter an email like name@example.com.';
        if (field) { field.classList.toggle('invalid', !!msg); const err = field.querySelector('.err'); if (err) err.textContent = msg; }
        if (msg) ok = false;
      });
      const status = form.querySelector('.form-status');
      if (!ok) { if (status) status.textContent = ''; form.querySelector('.invalid input, .invalid textarea, .invalid select')?.focus(); return; }
      if (status) status.textContent = form.dataset.success;
      form.reset();
    });
  });

  /* ---------- Scroll-expansion hero ----------
     Holds the page at the top while the centre photo grows to fill the screen,
     then hands scrolling back. Scrolling up at the top shrinks it again. */
  const xh = document.querySelector('[data-xhero]');
  if (xh) {
    const bg = xh.querySelector('.xhero-bg');
    const media = xh.querySelector('.xhero-media');
    const mImg = media.querySelector('img, video');
    // Video: smaller file on phones; reduced-motion visitors keep the still poster
    if (mImg.tagName === 'VIDEO' && !reduce) {
      mImg.src = innerWidth < 768 ? mImg.dataset.srcSmall : mImg.dataset.src;
      mImg.play().catch(() => {});
    }
    const dim = media.querySelector('.dim');
    const [t1, t2] = xh.querySelectorAll('.xl');
    const sub = xh.querySelector('.xhero-sub');
    const [s1, s2] = xh.querySelectorAll('.xs');
    const after = xh.querySelector('.xhero-after');

    let target = 0, shown = 0, expanded = false, touchY = 0, raf = 0;

    const render = () => {
      const mobile = innerWidth < 768;
      const W = media.offsetWidth, H = media.offsetHeight;
      // Start as a 3:4 card sized to the screen (≈55% of a phone's width, 340px max on desktop),
      // never taller than 60% of the viewport, then grow to the full frame
      let sw = Math.min(Math.max(innerWidth * 0.55, 200), 340), sh = sw * 4 / 3;
      if (sh > innerHeight * 0.6) { sh = innerHeight * 0.6; sw = sh * 0.75; }
      const endH = mobile ? Math.min(600, H) : H;
      const w = sw + shown * (W - sw);
      const h = sh + shown * (endH - sh);
      const sx = w / W, sy = h / H, cover = Math.max(sx, sy);
      media.style.transform = `scale(${sx}, ${sy})`;
      media.style.borderRadius = `${16 / sx}px / ${16 / sy}px`;
      mImg.style.transform = `scale(${cover / sx}, ${cover / sy})`;
      dim.style.opacity = 1 - shown * 0.6;
      bg.style.opacity = 1 - shown;
      const tx = shown * (mobile ? 180 : 150);
      t1.style.transform = `translateX(-${tx}vw)`;
      t2.style.transform = `translateX(${tx}vw)`;
      sub.style.transform = `translateY(${h / 2 + 22}px)`;
      s1.style.transform = `translateX(-${tx}vw)`;
      s2.style.transform = `translateX(${tx}vw)`;
    };
    const tick = () => {
      shown += (target - shown) * 0.16;
      if (Math.abs(target - shown) < 0.0005) shown = target;
      render();
      raf = shown === target ? 0 : requestAnimationFrame(tick);
    };
    const setTarget = p => {
      target = Math.min(Math.max(p, 0), 1);
      if (target >= 1) { expanded = true; after.classList.add('is-shown'); }
      else if (target < 0.75) after.classList.remove('is-shown');
      if (reduce) { shown = target; render(); } else if (!raf) raf = requestAnimationFrame(tick);
    };
    // Shared by wheel, touch and keys: returns true when the hero used the gesture
    const nudge = delta => {
      if (expanded && delta < 0 && scrollY <= 5) { expanded = false; return true; }
      if (!expanded) { setTarget(target + delta); return true; }
      return false;
    };

    if (reduce || scrollY > 5) {
      // Reduced motion, or returning mid-page: start fully open
      target = shown = 1; expanded = true; after.classList.add('is-shown'); render();
    } else {
      render();
    }

    if (!reduce) {
      addEventListener('wheel', e => { if (nudge(e.deltaY * 0.0009)) e.preventDefault(); }, { passive: false });
      addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
      addEventListener('touchmove', e => {
        if (!touchY) return;
        const y = e.touches[0].clientY, d = touchY - y;
        if (nudge(d * (d < 0 ? 0.008 : 0.005))) e.preventDefault();
        touchY = y;
      }, { passive: false });
      addEventListener('touchend', () => { touchY = 0; });
      addEventListener('scroll', () => { if (!expanded) scrollTo(0, 0); });
      addEventListener('keydown', e => {
        if (e.target.closest('input, textarea, select') || root.classList.contains('nav-open')) return;
        const step = { ArrowDown: .12, PageDown: .4, ' ': .4, End: 1, ArrowUp: -.12, PageUp: -.4, Home: -1 }[e.key];
        if (step !== undefined && nudge(e.shiftKey && e.key === ' ' ? -step : step)) e.preventDefault();
      });
    }
    addEventListener('resize', render);
  }

  onScroll();
})();
