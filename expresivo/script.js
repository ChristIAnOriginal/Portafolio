(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  document.addEventListener('DOMContentLoaded', () => {
    initYear();
    initMobileMenu();
    initScrollReveal();
    initGalleryFilter();
    initReelSound();
    initAutoevalBook();
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
    const targets = $$('.hero__content, .about__text, .about__visual, .manifesto__inner, .selfeval__head, .evalcard, .gallery__head, .gphoto, .book__preview, .book__text, .testimonials__head, .testimonial');
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

  function initReelSound() {
    const video = $('#reelVideo');
    const btn = $('#reelSoundToggle');
    if (!video || !btn) return;

    const frame = $('#reelFrame');
    const label = $('.hero__photo-sound-label', btn);
    let userPaused = false;
    let inView = true;
    let burstTimer = null;

    const safePlay = () => {
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };

    const sync = () => {
      const on = !video.muted;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? 'Silenciar el reel' : 'Activar sonido del reel');
      if (label) label.textContent = on ? 'Silenciar' : 'Sonido';
    };

    const burst = () => {
      if (!frame) return;
      frame.classList.remove('is-bursting');
      // Force reflow so the animation restarts on rapid clicks
      void frame.offsetWidth;
      frame.classList.add('is-bursting');
      clearTimeout(burstTimer);
      burstTimer = setTimeout(() => frame.classList.remove('is-bursting'), 600);
    };

    // Reflect paused / playing state on the frame for the overlay
    video.addEventListener('play', () => frame && frame.classList.remove('is-paused'));
    video.addEventListener('pause', () => frame && frame.classList.add('is-paused'));

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      if (!video.muted) safePlay();
      sync();
    });

    // Click on the video toggles play/pause + burst feedback
    video.addEventListener('click', () => {
      burst();
      if (video.paused) {
        userPaused = false;
        safePlay();
      } else {
        userPaused = true;
        video.pause();
      }
    });

    // Pause when the reel scrolls out of view, resume when it comes back
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          inView = entry.isIntersecting;
          if (inView) {
            if (!userPaused && !document.hidden) safePlay();
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.25 });
      io.observe(video);
    }

    // Pause when the tab loses focus
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        video.pause();
      } else if (!userPaused && inView) {
        safePlay();
      }
    });

    sync();
    if (frame) frame.classList.toggle('is-paused', video.paused);
  }

  function initAutoevalBook() {
    const trigger = $('#openAutoevalBook');
    const modal = $('#autoevalBook');
    if (!trigger || !modal) return;

    const closeBtn = $('#closeAutoevalBook');
    const inner = $('.book-modal__inner', modal);

    const open = () => {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      modal.scrollTop = 0;
      if (closeBtn) closeBtn.focus();
    };

    const close = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      trigger.focus();
    };

    trigger.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);

    modal.addEventListener('click', (e) => {
      if (!inner.contains(e.target)) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });
  }

  function initGalleryFilter() {
    const buttons = $$('.gallery__filter-btn');
    const photos = $$('.gphoto');
    if (!buttons.length) return;

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        buttons.forEach(b => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', String(active));
        });

        photos.forEach(p => {
          const show = filter === 'all' || p.dataset.category === filter;
          p.classList.toggle('is-hidden', !show);
        });
      });
    });
  }
})();
