/* jshint esversion: 6, node: true, devel: true, asi: true */
/* jshint -W030, -W033 */

(function () {
  var didShow = false;

  function shouldShowModal(el) {
    if (!el) return false;
    // Accept both dataset.show and data-show, normalize and compare
    var raw =
      (el.dataset && el.dataset.show) ||
      el.getAttribute('data-show') ||
      '';
    return String(raw).toLowerCase() === 'true';
  }

  function cleanupBackdropAndBody() {
    // Remove any stray backdrops and modal-open/body padding
    var backs = document.querySelectorAll('.modal-backdrop');
    for (var i = 0; i < backs.length; i++) backs[i].remove();
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');
  }

  function showThankYouOnce() {
    if (didShow) return;

    var el = document.getElementById('thankYouModal');
    if (!shouldShowModal(el)) return;

    if (!(window.bootstrap && window.bootstrap.Modal)) {
      // Bootstrap not ready yet; the window.load listener may fire later.
      return;
    }

    // Guard against double-show from multiple lifecycle hooks
    didShow = true;

    // Ensure a clean slate in case a previous attempt left a backdrop
    cleanupBackdropAndBody();

    // Flip the flag on the element so subsequent checks are false
    if (el && el.dataset) el.dataset.show = 'false';

    var modal = new bootstrap.Modal(el);

    // On hide, make sure no zombie backdrop/body state remains
    el.addEventListener('hidden.bs.modal', function () {
      cleanupBackdropAndBody();
    }, { once: true });

    modal.show();
  }

  // Try at most once at each lifecycle stage
  document.addEventListener('DOMContentLoaded', showThankYouOnce, { once: true });
  window.addEventListener('load', showThankYouOnce, { once: true });
})();
