(() => {
  const tiles = Array.from(document.querySelectorAll('.tile'));
  const chips = Array.from(document.querySelectorAll('.chip'));
  const lightbox = document.getElementById('lightbox');
  if (!tiles.length) return;

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      chips.forEach(c => {
        const active = c === chip;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-selected', String(active));
      });
      tiles.forEach(tile => {
        const cats = (tile.dataset.category || '').split(/\s+/);
        const show = filter === 'all' || cats.includes(filter);
        tile.classList.toggle('is-hidden', !show);
      });
    });
  });

  if (!lightbox) return;

  const imgEl = lightbox.querySelector('#lightboxImg');
  const yearEl = lightbox.querySelector('.lightbox__year');
  const titleEl = lightbox.querySelector('.lightbox__title');
  const roleEl = lightbox.querySelector('.lightbox__role');
  const descEl = lightbox.querySelector('.lightbox__description');
  const counterEl = lightbox.querySelector('.lightbox__counter');
  const closeBtn = lightbox.querySelector('.lightbox__close');
  const prevBtn = lightbox.querySelector('.lightbox__nav--prev');
  const nextBtn = lightbox.querySelector('.lightbox__nav--next');

  let currentIdx = 0;
  let lastFocus = null;

  const visibleTiles = () => tiles.filter(t => !t.classList.contains('is-hidden'));

  const render = (idx) => {
    const list = visibleTiles();
    if (!list.length) return;
    currentIdx = (idx + list.length) % list.length;
    const tile = list[currentIdx];
    const fullImg = tile.dataset.img || (tile.querySelector('img') && tile.querySelector('img').src) || '';
    imgEl.src = fullImg;
    imgEl.alt = tile.dataset.title || '';
    yearEl.textContent = tile.dataset.year || '';
    titleEl.textContent = tile.dataset.title || '';
    roleEl.textContent = tile.dataset.role || '';
    descEl.textContent = tile.dataset.description || '';
    counterEl.textContent = `${currentIdx + 1} / ${list.length}`;
  };

  const open = (idx) => {
    lastFocus = document.activeElement;
    render(idx);
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };

  const close = () => {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  tiles.forEach(tile => {
    tile.addEventListener('click', () => {
      const visible = visibleTiles();
      const idx = visible.indexOf(tile);
      if (idx >= 0) open(idx);
    });
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => render(currentIdx - 1));
  nextBtn.addEventListener('click', () => render(currentIdx + 1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') render(currentIdx - 1);
    else if (e.key === 'ArrowRight') render(currentIdx + 1);
  });

  if ('IntersectionObserver' in window) {
    tiles.forEach(t => t.classList.add('reveal'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    tiles.forEach(t => io.observe(t));
  }
})();
