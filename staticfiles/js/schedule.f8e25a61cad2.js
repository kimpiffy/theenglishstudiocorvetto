/* jshint esversion: 11, browser: true, devel: true, asi: true */
/* global bootstrap */
/* jshint -W030, -W033, -W014 */

// ===== CSRF helpers =====
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function getCSRFToken() {
  return (
    getCookie('csrftoken') ||
    (document.querySelector('meta[name="csrf-token"]')?.content || '') ||
    (document.querySelector('input[name="csrfmiddlewaretoken"]')?.value || '')
  );
}

const urls = window.urls;

/* ------------------------------------------------------------------ *
 * Toasts (Bootstrap 5)
 * ------------------------------------------------------------------ */
function ensureToastContainer() {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'position-fixed top-0 end-0 p-3';
    c.style.zIndex = '1080';
    document.body.appendChild(c);
  }
  return c;
}

function showToast(message, variant = 'success') {
  const container = ensureToastContainer();
  const wrapper = document.createElement('div');
  const bg = {
    success: 'bg-success text-white',
    danger: 'bg-danger text-white',
    warning: 'bg-warning',
    info: 'bg-info'
  }[variant] || 'bg-secondary text-white';
  wrapper.className = `toast align-items-center border-0 ${bg}`;
  wrapper.setAttribute('role', 'alert');
  wrapper.setAttribute('aria-live', 'assertive');
  wrapper.setAttribute('aria-atomic', 'true');
  wrapper.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  container.appendChild(wrapper);
  const t = new bootstrap.Toast(wrapper, { delay: 2500 });
  t.show();
  wrapper.addEventListener('hidden.bs.toast', () => wrapper.remove());
}

/* ------------------------------------------------------------------ *
 * Fetch helper
 * ------------------------------------------------------------------ */
async function fetchJSON(url, options = {}) {
  const headers = {
    'X-CSRFToken': getCSRFToken(),
    ...(options.headers || {})
  };
  const res = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok || (data && data.ok === false)) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data || { ok: true, message: 'OK' };
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */
function buildEventPayloadFromForm() {
  const repeatUntilStr = document.getElementById('event-repeat-until').value;
  return {
    class_id: document.getElementById('event-class').value,
    date: document.getElementById('event-date').value,
    start_time: document.getElementById('event-start').value,
    end_time: document.getElementById('event-end').value,
    recurrence: document.getElementById('event-recurrence').value,
    days_of_week: document.getElementById('event-days').value,
    recurrence_exceptions: document.getElementById('event-exceptions').value,
    repeat_until: repeatUntilStr || null
  };
}

/* ------------------------------------------------------------------ *
 * EVENT HANDLERS
 * ------------------------------------------------------------------ */
const eventForm = document.getElementById('event-form');

eventForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const saveBtn = eventForm.querySelector('button[type="submit"]');
  if (saveBtn) saveBtn.disabled = true;

  const eventId = document.getElementById('event-id').value;
  const url = eventId ? urls.updateEvent(eventId) : urls.createEvent;
  const payload = buildEventPayloadFromForm();

  try {
    const data = await fetchJSON(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    showToast(
      data.message || (eventId ? 'Event updated.' : 'Event created.'),
      'success'
    );
    eventForm.reset();
    document.getElementById('event-id').value = '';
    bootstrap.Modal
      .getInstance(document.getElementById('eventModal'))?.hide();
    location.reload();
  } catch (err) {
    console.error('Event save failed:', err);
    showToast(
      err.message || 'Error saving event.',
      err.status === 403 ? 'warning' : 'danger'
    );
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
});

// Modal open (add)
document.querySelector('#add-event-btn')?.addEventListener('click', () => {
  document.getElementById('event-id').value = '';
  eventForm?.reset();
  new bootstrap.Modal(document.getElementById('eventModal')).show();
  setTimeout(() => document.getElementById('event-class')?.focus(), 150);
});

// Modal open (edit)
window.editEvent = function (id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (!row) return;

  // dataset keys: classId, date, start, end, recurrence, days, exceptions, repeatuntil
  const fieldMap = {
    class: 'classId',
    date: 'date',
    start: 'start',
    end: 'end',
    recurrence: 'recurrence',
    days: 'days',
    exceptions: 'exceptions',
    'repeat-until': 'repeatuntil'
  };

  Object.entries(fieldMap).forEach(([field, key]) => {
    const el = document.getElementById(`event-${field}`);
    if (!el) return;
    const val = row.dataset[key];
    if (val !== undefined) el.value = val;
  });

  document.getElementById('event-id').value = id;
  new bootstrap.Modal(document.getElementById('eventModal')).show();
};

// Delete event
window.deleteEvent = async function (id) {
  if (!confirm('Delete this event?')) return;
  try {
    const data = await fetchJSON(urls.deleteEvent(id), { method: 'POST' });
    document.querySelector(`tr[data-id='${id}']`)?.remove();
    showToast(data.message || 'Event deleted.', 'success');
  } catch (err) {
    console.error('Delete failed:', err);
    showToast(err.message || 'Failed to delete event.', 'danger');
  }
};

/* ------------------------------------------------------------------ *
 * CLASS HANDLERS
 * ------------------------------------------------------------------ */
const classForm = document.getElementById('class-form');

classForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const saveBtn = classForm.querySelector('button[type="submit"]');
  if (saveBtn) saveBtn.disabled = true;

  const payload = {
    name_en: document.getElementById('class-name-en').value,
    name_it: document.getElementById('class-name-it').value,
    emoji: document.getElementById('class-emoji').value
  };

  const id = document.getElementById('class-id').value;
  const url = id ? urls.updateClass(id) : urls.createClass;

  try {
    const res = await fetchJSON(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = res.data || res;
    showToast(
      res.message || (id ? 'Class updated.' : 'Class created.'),
      'success'
    );

    if (id) {
      const row = document.querySelector(`tr[data-id='${id}']`);
      if (row) {
        const cells = row.querySelectorAll('td');
        cells[0].textContent = (data.emoji ?? payload.emoji ?? '').trim();
        cells[1].textContent = (data.name_en ?? payload.name_en ?? '').trim();
        cells[2].textContent = (data.name_it ?? payload.name_it ?? '').trim();
      }
      classForm.reset();
      document.getElementById('class-id').value = '';
    } else {
      location.reload();
    }
  } catch (err) {
    console.error('Class save failed:', err);
    showToast(
      err.message || 'Something went wrong while saving the class.',
      err.status === 403 ? 'warning' : 'danger'
    );
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
});

window.editClass = function (id) {
  const row = document.querySelector(`tr[data-id='${id}']`);
  if (!row) return;
  const cells = row.querySelectorAll('td');
  document.getElementById('class-id').value = id;
  document.getElementById('class-name-en').value = cells[1].textContent.trim();
  document.getElementById('class-name-it').value = cells[2].textContent.trim();
  document.getElementById('class-emoji').value = cells[0].textContent.trim();
};

window.deleteClass = async function (id) {
  if (!confirm('Delete this class?')) return;
  try {
    const res = await fetchJSON(urls.deleteClass(id), { method: 'POST' });
    document.querySelector(`tr[data-id='${id}']`)?.remove();
    showToast(res.message || 'Class deleted.', 'success');
  } catch (err) {
    console.error('Delete class failed:', err);
    showToast(err.message || 'Failed to delete class.', 'danger');
  }
};
