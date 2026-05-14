(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  applyStoredTheme();

  document.addEventListener('DOMContentLoaded', () => {
    initYear();
    initMobileMenu();
    initScrollReveal();
    initWorksFilter();
    initContactForm();
    initThemeSwitch();
  });

  function applyStoredTheme() {
    try {
      const saved = localStorage.getItem('vr-theme');
      if (saved === 'clasico') {
        document.documentElement.setAttribute('data-theme', 'clasico');
      }
    } catch (_) { /* localStorage blocked */ }
  }

  function initThemeSwitch() {
    const toggle = $('#themeToggle');
    const panel = $('#themePanel');
    const switchEl = $('#themeSwitch');
    const options = $$('.theme-option');
    if (!toggle || !panel) return;

    const current = document.documentElement.getAttribute('data-theme') || 'expresivo';
    options.forEach(opt => {
      const active = opt.dataset.theme === current;
      opt.classList.toggle('is-active', active);
      opt.setAttribute('aria-checked', String(active));
    });

    const openPanel = () => {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
    };
    const closePanel = () => {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.hidden ? openPanel() : closePanel();
    });

    options.forEach(opt => {
      opt.addEventListener('click', () => {
        const theme = opt.dataset.theme;
        if (theme === 'expresivo') {
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.setAttribute('data-theme', theme);
        }
        try { localStorage.setItem('vr-theme', theme); } catch (_) {}

        options.forEach(o => {
          const active = o === opt;
          o.classList.toggle('is-active', active);
          o.setAttribute('aria-checked', String(active));
        });
      });
    });

    document.addEventListener('click', (e) => {
      if (!panel.hidden && !switchEl.contains(e.target)) closePanel();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) closePanel();
    });
  }

  function initYear() {
    const el = $('#year');
    if (el) el.textContent = new Date().getFullYear();
  }

  function initMobileMenu() {
    const toggle = $('#navToggle');
    const menu = $('#navMenu');
    if (!toggle || !menu) return;

    const close = () => {
      toggle.classList.remove('is-open');
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
      const open = !menu.classList.contains('is-open');
      menu.classList.toggle('is-open', open);
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });

    $$('a', menu).forEach(a => a.addEventListener('click', close));

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });
  }

  function initScrollReveal() {
    const targets = $$('.hero__content, .about__text, .about__visual, .works__head, .work, .timeline__item, .contact__intro, .contact__form');
    targets.forEach(el => el.classList.add('reveal'));

    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => io.observe(el));
  }

  function initWorksFilter() {
    const buttons = $$('.works__filter-btn');
    const works = $$('.work');
    if (!buttons.length) return;

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        buttons.forEach(b => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', String(active));
        });

        works.forEach(w => {
          const show = filter === 'all' || w.dataset.category === filter;
          w.classList.toggle('is-hidden', !show);
        });
      });
    });
  }

  function initContactForm() {
    const form = $('#contactForm');
    const status = $('#formStatus');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const data = new FormData(form);
      const nombre = (data.get('nombre') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const asunto = (data.get('asunto') || '').toString().trim();
      const mensaje = (data.get('mensaje') || '').toString().trim();

      if (!nombre || !email || !asunto || !mensaje) {
        status.textContent = 'Por favor, completa todos los campos.';
        status.style.color = 'var(--burgundy)';
        return;
      }

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) {
        status.textContent = 'Revisa tu email.';
        status.style.color = 'var(--burgundy)';
        return;
      }

      const subject = encodeURIComponent(`[Portafolio] ${asunto}`);
      const body = encodeURIComponent(`Hola Valentina,\n\nMi nombre es ${nombre}.\n\n${mensaje}\n\n— ${email}`);
      window.location.href = `mailto:hola@valentinarojas.art?subject=${subject}&body=${body}`;

      status.textContent = '¡Listo! Abriendo tu correo…';
      status.style.color = 'var(--teal)';
      form.reset();
    });
  }
})();
