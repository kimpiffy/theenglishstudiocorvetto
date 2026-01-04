/* jshint esversion: 11, node: true, devel: true, asi: true */
/* jshint -W030, -W033 */

// main/static/js/flyers.js
document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('.flyer-cf');
  if (!root) return;

  const track   = root.querySelector('.flyer-cf-track');
  const slides  = Array.from(track.querySelectorAll('.flyer-cf-slide'));
  const prevBtn = root.querySelector('.cf-prev');
  const nextBtn = root.querySelector('.cf-next');

  const N = slides.length;
  if (N < 3) return; // desktop carousel only with 3+

  // ------------ Tunables (tweak to taste) -----------------
  const MAX_SIDE = Math.min(2, Math.floor((N - 1) / 2)); // visible per side
  const BASE_OFFSET = 240;  // px offset for the first neighbor
  const GAP_SHRINK  = 0.86; // spacing falls off for outer neighbor(s)
  const SCALE_STEP  = 0.88; // scale factor per step from center
  const OPACITY_0   = 0.95; // opacity for the 1st neighbor
  const OPACITY_STEP = 0.15;// fade for the 2nd neighbor
  // --------------------------------------------------------

  let idx = 0;
  let timer = null;
  const delay = parseInt(root.dataset.autoplay || '0', 10) || 0;

  function seriesOffset(k) {
    // geometric spacing so 2nd neighbor is closer than 1st*2
    let x = 0;
    for (let j = 1; j <= k; j++) x += BASE_OFFSET * Math.pow(GAP_SHRINK, j - 1);
    return x;
  }

  function place(el, x, scale, opacity, z, interactive) {
    el.style.transform =
      `translateX(-50%) translateX(${x}px) scale(${scale})`;
    el.style.zIndex = String(z);
    el.style.opacity = String(opacity);
    el.style.pointerEvents = interactive ? 'auto' : 'none';
  }

  function layout() {
    const Z = 1000;

    slides.forEach((el, i) => {
      if (i === idx) {
        // center
        place(el, 0, 1, 1, Z, true);
        return;
      }

      // distance going right and left from center
      const dRight = ((i - idx) % N + N) % N; // 1..N-1
      const dLeft  = ((idx - i) % N + N) % N; // 1..N-1

      // show only the closest up to MAX_SIDE on either side
      if (dRight <= MAX_SIDE) {
        const k = dRight;                      // 1 or 2
        const x = +seriesOffset(k);
        const s = Math.pow(SCALE_STEP, k);
        const o = Math.max(0, OPACITY_0 - OPACITY_STEP * (k - 1));
        place(el, x, s, o, Z - k, true);
      } else if (dLeft <= MAX_SIDE) {
        const k = dLeft;                       // 1 or 2
        const x = -seriesOffset(k);
        const s = Math.pow(SCALE_STEP, k);
        const o = Math.max(0, OPACITY_0 - OPACITY_STEP * (k - 1));
        place(el, x, s, o, Z - k, true);
      } else {
        // hide everything else so only 3 (or 5) are ever visible
        place(el, 0, 0.7, 0, 0, false);
      }
    });
  }

  function next() { idx = (idx + 1) % N; layout(); }
  function prev() { idx = (idx - 1 + N) % N; layout(); }

  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);

  // click a tucked card to bring it to front (shortest path)
  slides.forEach((el, i) => {
    el.addEventListener('click', () => {
      if (i === idx) return;
      const right = ((i - idx) % N + N) % N;
      const left  = ((idx - i) % N + N) % N;
      idx = (left < right) ? (idx - left + N) % N : (idx + right) % N;
      layout();
    });
  });

  // autoplay with hover pause
  function start() { if (delay > 0 && !timer) timer = setInterval(next, delay); }
  function stop()  { if (timer) clearInterval(timer), (timer = null); }
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);

  // keyboard arrows
  root.setAttribute('tabindex', '0');
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });

  layout();
  start();
});
