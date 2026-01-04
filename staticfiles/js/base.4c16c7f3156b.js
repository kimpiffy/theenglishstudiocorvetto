/* jshint esversion: 6, node: true, devel: true, asi: true */
/* jshint -W030, -W033 */

const burger = document.querySelector('.hamburger');
const navbar = document.getElementById('navbarNav');

burger.addEventListener('click', function () {
  this.classList.toggle('active');
});

// Remove .active when the nav collapses (e.g., on link click or outside click)
navbar.addEventListener('hidden.bs.collapse', () => {
  burger.classList.remove('active');
});

// Set current year in footer
document.addEventListener('DOMContentLoaded', () => {
  const yearSpan = document.getElementById('currentYear');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
