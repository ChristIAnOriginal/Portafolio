(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const BOOK_BASE_URL = 'https://pub-0386d34e2f994f25a884385478309a44.r2.dev/Book/';
  const BOOK_IMAGE_NAMES = [
    'A7401111', 'A7401114', 'A7401125', 'A7401139', 'A7401143',
    'A7401159', 'A7401177', 'A7401178', 'A7401179', 'A7401180',
    'A7401184', 'A7401186', 'A7401190', 'A7401191', 'A7401196',
    'A7401213', 'A7401218', 'A7401224', 'A7401236', 'A7401246',
    'A7401247', 'A7401253', 'A7401254', 'A7401259', 'A7401265'
  ];
  const BOOK_IMAGES = BOOK_IMAGE_NAMES.map((name, i) => ({
    name,
    url: `${BOOK_BASE_URL}${name}.jpg`,
    index: i
  }));

  let stripLoopWidth = 0;

  document.addEventListener('DOMContentLoaded', () => {
    initYear();
    initMobileMenu();
    initScrollReveal();
    initGalleryFilter();
    initReelSound();
    initReelProgress();
    initAutoevalBook();
    initEvals();
    initBookGallery();
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
    const targets = $$('.hero__content, .about__text, .about__visual, .manifesto__inner, .selfeval__head, .evalcard, .gallery__head, .gphoto, .book__strip-wrap, .book__text, .evals__head, .eval-card');
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

  function initReelProgress() {
    const video = $('#reelVideo');
    const bar = $('#reelProgress');
    const fill = $('#reelProgressFill');
    const thumb = $('#reelProgressThumb');
    const buffered = $('#reelProgressBuffered');
    if (!video || !bar || !fill) return;

    let isScrubbing = false;
    let wasPlaying = false;

    const setVisual = (ratio) => {
      const pct = Math.max(0, Math.min(1, ratio)) * 100;
      fill.style.width = `${pct}%`;
      if (thumb) thumb.style.left = `${pct}%`;
      bar.setAttribute('aria-valuenow', String(Math.round(pct)));
    };

    const updateBuffered = () => {
      if (!buffered) return;
      if (!isFinite(video.duration) || video.duration <= 0) return;
      if (video.buffered.length === 0) {
        buffered.style.width = '0%';
        return;
      }
      // Pick the buffered range that contains currentTime; fall back to the furthest range
      let end = 0;
      const t = video.currentTime;
      for (let i = 0; i < video.buffered.length; i++) {
        const start = video.buffered.start(i);
        const e = video.buffered.end(i);
        if (start <= t + 0.001 && e > end) end = e;
      }
      if (end === 0) end = video.buffered.end(video.buffered.length - 1);
      const pct = Math.min(1, end / video.duration) * 100;
      buffered.style.width = `${pct}%`;
    };

    const seekTo = (clientX) => {
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      if (isFinite(video.duration) && video.duration > 0) {
        video.currentTime = ratio * video.duration;
      }
      setVisual(ratio);
    };

    const refresh = () => {
      if (isScrubbing) return;
      if (!isFinite(video.duration) || video.duration <= 0) return;
      setVisual(video.currentTime / video.duration);
    };

    video.addEventListener('timeupdate', refresh);
    video.addEventListener('loadedmetadata', () => { refresh(); updateBuffered(); });
    video.addEventListener('seeked', () => { refresh(); updateBuffered(); });
    video.addEventListener('progress', updateBuffered);
    video.addEventListener('canplay', updateBuffered);
    video.addEventListener('canplaythrough', updateBuffered);

    bar.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      isScrubbing = true;
      wasPlaying = !video.paused;
      if (wasPlaying) video.pause();
      bar.classList.add('is-active');
      try { bar.setPointerCapture(e.pointerId); } catch (_) {}
      seekTo(e.clientX);
    });

    bar.addEventListener('pointermove', (e) => {
      if (!isScrubbing) return;
      seekTo(e.clientX);
    });

    const endScrub = (e) => {
      if (!isScrubbing) return;
      isScrubbing = false;
      bar.classList.remove('is-active');
      try { bar.releasePointerCapture(e.pointerId); } catch (_) {}
      if (wasPlaying) {
        const p = video.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    };
    bar.addEventListener('pointerup', endScrub);
    bar.addEventListener('pointercancel', endScrub);

    // Block click bubbling so the frame's play/pause toggle doesn't fire
    bar.addEventListener('click', (e) => e.stopPropagation());

    // Keyboard control: arrows = ±5s
    bar.addEventListener('keydown', (e) => {
      if (!isFinite(video.duration) || video.duration <= 0) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const delta = e.key === 'ArrowLeft' ? -5 : 5;
        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + delta));
      }
    });

    refresh();
    updateBuffered();
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

  function initBookGallery() {
    const strip = $('#bookStrip');
    const grid = $('#bookGalleryGrid');
    const modal = $('#bookGallery');
    const openBtn = $('#openBookGallery');
    const closeBtn = $('#closeBookGallery');
    const countEl = $('#bookGalleryCount');
    const statEl = $('#bookCountStat');
    if (!strip || !grid || !modal) return;

    const total = BOOK_IMAGES.length;
    if (statEl) statEl.textContent = `${total} imágenes`;
    if (countEl) countEl.textContent = `${total} fotografías`;

    const stripItems = [...BOOK_IMAGES, ...BOOK_IMAGES];
    stripItems.forEach((img) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'book__strip-item';
      btn.dataset.idx = String(img.index);
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-label', `Foto ${img.index + 1} de ${total}`);
      btn.innerHTML = `<img src="${img.url}" alt="Foto ${img.index + 1} del book actoral" loading="lazy" />`;
      btn.addEventListener('click', () => openGallery(img.index));
      strip.appendChild(btn);
    });

    BOOK_IMAGES.forEach((img) => {
      const fig = document.createElement('button');
      fig.type = 'button';
      fig.className = 'book-gallery__item';
      fig.dataset.idx = String(img.index);
      fig.setAttribute('aria-label', `Ampliar foto ${img.index + 1} de ${total}`);
      fig.innerHTML = `<img src="${img.url}" alt="Foto ${img.index + 1} del book actoral" loading="lazy" />`;
      fig.addEventListener('click', () => openLightbox(img.index));
      grid.appendChild(fig);
    });

    initBookStripDrag(strip);
    initBookStripInfinite(strip);
    initBookStripFade(strip);
    initBookStripNav(strip);

    function openGallery(focusIndex) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      modal.scrollTop = 0;
      if (typeof focusIndex === 'number') {
        const target = grid.querySelector(`[data-idx="${focusIndex}"]`);
        if (target) target.focus({ preventScroll: true });
      } else if (closeBtn) {
        closeBtn.focus();
      }
    }

    function closeGallery() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      if (openBtn) openBtn.focus();
    }

    if (openBtn) openBtn.addEventListener('click', () => openGallery());
    if (closeBtn) closeBtn.addEventListener('click', closeGallery);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeGallery();
    });

    initBookLightbox(closeGallery);

    document.addEventListener('keydown', (e) => {
      const lightbox = $('#bookLightbox');
      if (e.key === 'Escape' && modal.classList.contains('is-open') && !(lightbox && lightbox.classList.contains('is-open'))) {
        closeGallery();
      }
    });
  }

  function getStripStep(strip) {
    const item = strip.querySelector('.book__strip-item');
    if (!item) return 260;
    const gap = parseFloat(getComputedStyle(strip).columnGap || getComputedStyle(strip).gap) || 18;
    return item.offsetWidth + gap;
  }

  function initBookStripInfinite(strip) {
    const compute = () => {
      const items = strip.querySelectorAll('.book__strip-item');
      const half = BOOK_IMAGES.length;
      if (items.length < half * 2) return;
      const firstOfSecondLoop = items[half];
      if (firstOfSecondLoop) stripLoopWidth = firstOfSecondLoop.offsetLeft;
    };

    compute();
    const firstImg = strip.querySelector('img');
    if (firstImg && !firstImg.complete) {
      firstImg.addEventListener('load', compute, { once: true });
    }
    window.addEventListener('resize', compute);

    // Wrap when user-driven scroll (drag, wheel, button) settles past the boundary
    let settleTimer = null;
    strip.addEventListener('scroll', () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        if (stripLoopWidth <= 0) return;
        if (strip.scrollLeft >= stripLoopWidth) {
          strip.scrollLeft -= stripLoopWidth;
        } else if (strip.scrollLeft < 0) {
          strip.scrollLeft += stripLoopWidth;
        }
      }, 60);
    }, { passive: true });
  }

  function initBookStripFade(strip) {
    const FADE_RATIO = 0.85;
    const FADE_MIN = 0.15;

    let metrics = [];
    let rafPending = false;

    const computeMetrics = () => {
      const items = strip.querySelectorAll('.book__strip-item');
      metrics = Array.from(items).map(item => ({
        item,
        left: item.offsetLeft,
        width: item.offsetWidth,
        currentOpacity: -1
      }));
      const half = BOOK_IMAGES.length;
      if (items.length >= half * 2 && items[half]) {
        stripLoopWidth = items[half].offsetLeft;
      }
      update();
    };

    const update = () => {
      rafPending = false;
      if (!metrics.length) return;
      const scrollLeft = strip.scrollLeft;
      const viewportRight = scrollLeft + strip.clientWidth;
      for (let i = 0; i < metrics.length; i++) {
        const m = metrics[i];
        const right = m.left + m.width;
        let opacity = 1;
        if (right <= scrollLeft || m.left >= viewportRight) {
          opacity = 0;
        } else if (right > viewportRight) {
          opacity = Math.max(FADE_MIN, 1 - (right - viewportRight) / (m.width * FADE_RATIO));
        } else if (m.left < scrollLeft) {
          opacity = Math.max(FADE_MIN, 1 - (scrollLeft - m.left) / (m.width * FADE_RATIO));
        }
        const rounded = Math.round(opacity * 100) / 100;
        if (Math.abs(m.currentOpacity - rounded) > 0.005) {
          m.item.style.opacity = String(rounded);
          m.currentOpacity = rounded;
        }
      }
    };

    const schedule = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(update);
    };

    // Compute metrics now, again on first image load, and on resize
    computeMetrics();
    const firstImg = strip.querySelector('img');
    if (firstImg && !firstImg.complete) {
      firstImg.addEventListener('load', computeMetrics, { once: true });
    }
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(computeMetrics, 100);
    });

    strip.addEventListener('scroll', schedule, { passive: true });
  }

  function initBookStripNav(strip) {
    const prev = $('#bookStripPrev');
    const next = $('#bookStripNext');
    if (!prev || !next) return;

    const stepScroll = (dir) => {
      const step = getStripStep(strip);
      if (dir < 0 && strip.scrollLeft < step && stripLoopWidth > 0) {
        // Wrap forward instantly so the leftward smooth scroll has room
        strip.scrollLeft += stripLoopWidth;
      }
      strip.scrollBy({ left: dir * step, behavior: 'smooth' });
    };

    prev.addEventListener('click', () => stepScroll(-1));
    next.addEventListener('click', () => stepScroll(1));
  }


  function initBookStripDrag(strip) {
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;

    strip.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.book__strip-item') && e.pointerType === 'mouse') {
        return;
      }
      isDown = true;
      startX = e.clientX;
      scrollStart = strip.scrollLeft;
      strip.setPointerCapture(e.pointerId);
    });

    strip.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      strip.scrollLeft = scrollStart - dx;
    });

    const endDrag = (e) => {
      if (!isDown) return;
      isDown = false;
      try { strip.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    strip.addEventListener('pointerup', endDrag);
    strip.addEventListener('pointercancel', endDrag);
    strip.addEventListener('pointerleave', endDrag);
  }

  function initBookLightbox(closeGalleryFn) {
    const lightbox = $('#bookLightbox');
    const img = $('#bookLightboxImg');
    const caption = $('#bookLightboxCaption');
    const closeBtn = $('#closeBookLightbox');
    const prevBtn = $('#bookLightboxPrev');
    const nextBtn = $('#bookLightboxNext');
    if (!lightbox || !img) return;

    let currentIndex = 0;
    const total = BOOK_IMAGES.length;

    window.openLightbox = (index) => {
      currentIndex = ((index % total) + total) % total;
      const item = BOOK_IMAGES[currentIndex];
      img.src = item.url;
      img.alt = `Foto ${currentIndex + 1} del book actoral`;
      if (caption) caption.textContent = `${currentIndex + 1} / ${total}`;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      if (closeBtn) closeBtn.focus();
    };

    const close = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      img.removeAttribute('src');
    };

    const step = (delta) => window.openLightbox(currentIndex + delta);

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (prevBtn) prevBtn.addEventListener('click', () => step(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => step(1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) close();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
  }

  function initEvals() {
    const cards = $$('.eval-card');
    const filters = $$('.evals__filter-btn');
    const modal = $('#evalModal');
    if (!modal) return;

    const modalInner = $('.eval-modal__inner', modal);
    const closeBtn = $('#closeEvalModal');
    const badge = $('#evalModalBadge');
    const titleEl = $('#evalModalTitle');
    const roleEl = $('#evalModalRole');
    const body = $('#evalModalBody');
    let lastTrigger = null;

    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        filters.forEach(b => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', String(active));
        });
        cards.forEach(card => {
          const show = filter === 'all' || card.dataset.category === filter;
          card.classList.toggle('is-hidden', !show);
        });
      });
    });

    const openModal = (card) => {
      const isProf = card.classList.contains('eval-card--prof');
      const author = $('.eval-card__author', card)?.textContent.trim() || '';
      const role = $('.eval-card__role', card)?.textContent.trim() || '';
      const full = $('.eval-card__full', card);

      badge.textContent = isProf ? 'Profesor' : 'Par';
      badge.classList.toggle('is-prof', isProf);
      titleEl.textContent = author;
      roleEl.textContent = role;
      roleEl.style.color = isProf ? 'var(--teal)' : 'var(--burgundy)';

      body.innerHTML = '';
      if (full) {
        Array.from(full.children).forEach(child => {
          body.appendChild(child.cloneNode(true));
        });
      }

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      modal.scrollTop = 0;
      lastTrigger = card;
      if (closeBtn) closeBtn.focus();
    };

    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      if (lastTrigger) lastTrigger.focus();
    };

    cards.forEach(card => {
      card.addEventListener('click', () => openModal(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(card);
        }
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (!modalInner.contains(e.target)) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
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
