(() => {
  const gallery = document.querySelector('[data-gallery]');
  if (!gallery) return;
  const slides = [...gallery.querySelectorAll('.gallery-slide')];
  const track = gallery.querySelector('.gallery-track');
  const toggle = gallery.querySelector('[data-gallery-toggle]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const captions = ['The ebook + MIDI collection', 'Harmony you can put into practice', 'A closer look inside the guide'];
  let index = 0;
  let playing = !motion.matches;
  let hovered = false;
  let timer;
  let start;
  let swiped = false;

  function schedule() {
    clearTimeout(timer);
    if (playing && !hovered && !document.hidden && (!gallery.contains(document.activeElement) || document.activeElement === toggle)) {
      timer = setTimeout(() => { show(index + 1); }, 6500);
    }
  }

  function updateToggle() {
    const label = playing ? 'Pause slideshow' : 'Play slideshow';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    toggle.querySelector('use').setAttribute('href', `/assets/icons.svg#${playing ? 'pause' : 'play'}`);
    schedule();
  }

  function show(next, manual = false) {
    index = (next + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, i) => {
      slide.inert = i !== index;
      slide.setAttribute('aria-hidden', String(i !== index));
    });
    gallery.querySelector('[data-gallery-count]').textContent = `0${index + 1} / 03`;
    gallery.querySelector('[data-gallery-caption]').textContent = captions[index];
    if (manual) {
      playing = false;
      gallery.querySelector('.gallery-status').textContent = slides[index].getAttribute('aria-label');
      updateToggle();
    }
    schedule();
  }

  gallery.querySelector('[data-gallery-prev]').addEventListener('click', () => show(index - 1, true));
  gallery.querySelector('[data-gallery-next]').addEventListener('click', () => show(index + 1, true));
  toggle.addEventListener('click', () => { playing = !playing; updateToggle(); });
  gallery.addEventListener('keydown', event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    // Keep focus out of the slide that is about to become inert.
    if (event.target.closest('.gallery-slide')) toggle.focus();
    show(index + (event.key === 'ArrowRight' ? 1 : -1), true);
  });
  gallery.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; schedule(); } });
  gallery.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  gallery.addEventListener('focusin', event => { if (event.target !== toggle) playing = false; updateToggle(); });
  gallery.addEventListener('focusout', () => setTimeout(schedule, 0));
  const viewport = gallery.querySelector('.gallery-window');
  viewport.addEventListener('pointerdown', event => { swiped = false; if (event.pointerType !== 'mouse') start = { x: event.clientX, y: event.clientY }; });
  viewport.addEventListener('pointercancel', () => { start = null; });
  viewport.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { swiped = true; show(index + (dx < 0 ? 1 : -1), true); }
  });
  viewport.addEventListener('click', event => {
    if (swiped) { event.preventDefault(); event.stopPropagation(); swiped = false; }
  }, true);
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => { if (motion.matches) playing = false; updateToggle(); });
  gallery.querySelector('.gallery-bar').hidden = false;
  updateToggle();
})();
