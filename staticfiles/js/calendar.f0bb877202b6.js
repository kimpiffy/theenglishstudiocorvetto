/* jshint esversion: 11, browser: true, devel: true, asi: true */
/* global bootstrap */
/* jshint -W030, -W033, -W014 */

document.addEventListener('DOMContentLoaded', function () {
  tippy('.day[data-tippy-content]', {
    placement: 'top',
    animation: 'fade',
    arrow: false,
    delay: [100, 100],
    allowHTML: true,
    maxWidth: 240,
    appendTo: () => document.body,
    theme: 'custom',
    interactive: true,
    zIndex: 9999,
  });
});
