(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  document.addEventListener('DOMContentLoaded', () => {
    initYear();
    initMobileMenu();
    initActiveSection();
    initRepertoireDetail();
    initContactForm();
    initReveal();
  });

  function initYear() {
    const el = $('#year');
    if (el) el.textContent = new Date().getFullYear();
  }

  function initMobileMenu() {
    const toggle = $('#navToggle');
    const menu = $('#navMenu');
    if (!toggle || !menu) return;

    const close = () => {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
      const open = !menu.classList.contains('is-open');
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });

    $$('a', menu).forEach(a => a.addEventListener('click', close));

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });
  }

  function initActiveSection() {
    const sections = $$('main .section[id]');
    const links = $$('.frame__nav a');
    if (!sections.length || !links.length) return;

    const setActive = (id) => {
      links.forEach(a => {
        const href = a.getAttribute('href') || '';
        a.classList.toggle('is-active', href === `#${id}`);
      });
    };

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      }, { rootMargin: '-40% 0px -50% 0px' });

      sections.forEach(s => io.observe(s));
    }
  }

  function initRepertoireDetail() {
    const items = $$('.repertoire__item');
    const panel = $('#detailPanel');
    if (!items.length || !panel) return;

    const yearEl = $('#detailYear');
    const titleEl = $('#detailTitle');
    const roleEl = $('#detailRole');
    const descEl = $('#detailDescription');
    const closeBtn = $('#detailClose');

    const close = () => { panel.hidden = true; };

    items.forEach(item => {
      item.addEventListener('click', () => {
        const year = item.querySelector('.repertoire__year')?.textContent || '';
        const title = item.querySelector('.repertoire__title')?.textContent || '';
        const role = item.querySelector('.repertoire__role')?.textContent || '';
        const desc = item.dataset.description || '';

        yearEl.textContent = `${year} · Acto`;
        titleEl.textContent = title;
        roleEl.textContent = role;
        descEl.textContent = desc;
        panel.hidden = false;
      });
    });

    closeBtn.addEventListener('click', close);

    document.addEventListener('click', (e) => {
      if (panel.hidden) return;
      const insidePanel = panel.contains(e.target);
      const onItem = e.target.closest('.repertoire__item');
      if (!insidePanel && !onItem) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) close();
    });
  }

  function initContactForm() {
    const form = $('#contactForm');
    const status = $('#formStatus');
    if (!form || !status) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const nombre = (data.get('nombre') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const asunto = (data.get('asunto') || '').toString().trim();
      const mensaje = (data.get('mensaje') || '').toString().trim();

      if (!nombre || !email || !asunto || !mensaje) {
        status.textContent = 'Completa todos los campos.';
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.textContent = 'Revisa tu email.';
        return;
      }

      const subject = encodeURIComponent(`[Portafolio] ${asunto}`);
      const body = encodeURIComponent(
        `Hola Valentina,\n\nMi nombre es ${nombre}.\n\n${mensaje}\n\n— ${email}`
      );
      window.location.href = `mailto:hola@valentinarojas.art?subject=${subject}&body=${body}`;
      status.textContent = 'Abriendo tu correo…';
      form.reset();
    });
  }

  function initReveal() {
    const targets = $$('.section, .repertoire__item, .timeline__item');
    if (!('IntersectionObserver' in window)) return;

    targets.forEach(el => el.classList.add('reveal'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => io.observe(el));
  }
})();
