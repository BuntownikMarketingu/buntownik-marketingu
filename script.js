/* BUNTOWNIK MARKETINGU – skrypty strony */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Rok w stopce
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  // Nawigacja: cień po przewinięciu + menu mobilne
  const nav = document.getElementById('nav');
  const onScroll = () => nav && nav.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Otwórz menu' : 'Zamknij menu');
      menu.classList.toggle('is-open', !open);
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false'); menu.classList.remove('is-open');
    }));
  }

  // Paralaksa zdjęć w skośnej ramie (strona główna i „O mnie”):
  // warstwy przesuwają się w przeciwnych kierunkach, czerwona ramka odjeżdża na bok,
  // a całość lekko obraca się w 3D. Bez myszki obraz delikatnie „oddycha”.
  function parallax(stage, layers) {
    if (!stage || reduce) return;
    const ptr = { nx: 0, ny: 0, last: 0 };
    window.addEventListener('pointermove', e => {
      const s = stage.getBoundingClientRect();
      ptr.nx = Math.max(-1, Math.min(1, (e.clientX - (s.left + s.width / 2)) / (window.innerWidth / 2)));
      ptr.ny = Math.max(-1, Math.min(1, (e.clientY - (s.top + s.height / 2)) / (window.innerHeight / 2)));
      ptr.last = performance.now();
    }, { passive: true });
    let tx = 0, ty = 0, visible = true, raf = 0;
    const t0 = performance.now();
    function loop(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      const idle = now - ptr.last > 2500, t = (now - t0) / 1000;
      const gx = idle ? Math.sin(t / 2.6) * 0.35 : ptr.nx;
      const gy = idle ? Math.cos(t / 3.1) * 0.25 : ptr.ny;
      tx += (gx - tx) * 0.06; ty += (gy - ty) * 0.06;
      layers.forEach(([el, kx, ky]) => { if (el) el.style.transform = `translate3d(${tx * kx}px, ${ty * ky}px, 0)`; });
      stage.style.transform = `perspective(1100px) rotateY(${tx * 5}deg) rotateX(${-ty * 4}deg)`;
      raf = requestAnimationFrame(loop);
    }
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(stage);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !raf) raf = requestAnimationFrame(loop); });
    raf = requestAnimationFrame(loop);
  }
  const home = document.getElementById('stage');
  if (home) parallax(home, [[home.querySelector('.hero__bg'), -12, -9], [home.querySelector('.hero__fg'), 9, 6], [home.querySelector('.hero__shape'), -16, -12]]);
  const about = document.getElementById('stage-omnie');
  if (about) parallax(about, [[about.querySelector('.about-hero__photo'), 10, 7], [about.querySelector('.about-hero__shape'), -16, -12]]);

  // Sekcja „O mnie”: elementy pojawiają się podczas przewijania
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add('is-in'));

  // Kontakt: adres i telefon składane dopiero po kliknięciu (nie ma ich w kodzie HTML)
  const MAILP = ['biuro', 'auris-media', 'pl'], TELP = ['+48', '608', '641', '421'];
  document.querySelectorAll('.js-mail').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const sub = a.dataset.subject ? '?subject=' + encodeURIComponent(a.dataset.subject) : '';
    window.location.href = 'mai' + 'lto:' + MAILP[0] + '@' + MAILP[1] + '.' + MAILP[2] + sub;
  }));
  document.querySelectorAll('.js-tel').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); window.location.href = 'tel:' + TELP.join('');
  }));

  // Film z YouTube: odtwarzacz (wersja bez ciasteczek) ładuje się dopiero po kliknięciu
  document.querySelectorAll('.video[data-yt]').forEach(v => {
    v.querySelector('.video__play').addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + v.dataset.yt + '?autoplay=1&rel=0';
      f.title = 'Film o książce Natura Biznesu';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      v.appendChild(f); v.classList.add('is-playing');
    });
  });

  // Opinie – przyciski przewijania
  const track = document.getElementById('quotes');
  document.querySelectorAll('[data-scroll]').forEach(btn => btn.addEventListener('click', () => {
    if (!track) return;
    const card = track.querySelector('li');
    const step = card ? card.getBoundingClientRect().width + 16 : 400;
    track.scrollBy({ left: step * Number(btn.dataset.scroll), behavior: reduce ? 'auto' : 'smooth' });
  }));

  // Podgląd zdjęć (lightbox)
  const lb = document.getElementById('lightbox');
  if (lb) {
    const img = lb.querySelector('img');
    let list = [], idx = 0, lastFocus = null;
    const show = i => { idx = (i + list.length) % list.length; img.src = list[idx].dataset.full; };
    const close = () => { lb.classList.remove('is-open'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); };
    document.querySelectorAll('.mosaic').forEach(m => {
      const btns = [...m.querySelectorAll('button[data-full]')];
      btns.forEach((b, i) => b.addEventListener('click', () => {
        list = btns; lastFocus = b; show(i);
        lb.classList.add('is-open'); document.body.style.overflow = 'hidden';
        lb.querySelector('.lightbox__close').focus();
      }));
    });
    lb.querySelector('.lightbox__close').addEventListener('click', close);
    lb.querySelector('.lightbox__prev').addEventListener('click', () => show(idx - 1));
    lb.querySelector('.lightbox__next').addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }
})();
