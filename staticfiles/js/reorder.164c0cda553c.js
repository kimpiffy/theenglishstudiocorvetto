/* jshint esversion: 11, browser: true, devel: true, asi: true */
/* global bootstrap */
/* jshint -W030, -W033, -W014 */

(function() {
  const list = document.getElementById('flyers-list');
  if (!list) return;

  const sortable = Sortable.create(list, {
    handle: '.handle',
    animation: 150,
    onEnd: updateBadges
  });

  function updateBadges() {
    document.querySelectorAll('#flyers-list .order-index').forEach((el, i) => {
      el.textContent = i + 1;
    });
  }

  const form = document.getElementById('save-order-form');
  form.addEventListener('submit', function(ev) {
    ev.preventDefault();

    const ids = Array.from(document.querySelectorAll('#flyers-list [data-id]'))
      .map(li => li.getAttribute('data-id'));
    document.getElementById('order-input').value = ids.join(',');

    const url = form.getAttribute('action');
    const csrftoken = document.querySelector('input[name=csrfmiddlewaretoken]').value;

    fetch(url, {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrftoken,
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ order: ids })
    })
    .then(r => {
      if (!r.ok) throw new Error('Bad response');
      return r.json();
    })
    .then(() => {
      const alertEl = document.getElementById('save-alert');
      alertEl.classList.remove('d-none');
      setTimeout(() => alertEl.classList.add('d-none'), 2000);
    })
    .catch(() => {
      alert('Failed to save order.');
    });
  });
})();
