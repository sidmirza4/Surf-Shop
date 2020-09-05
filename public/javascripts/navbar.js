const navbar = document.querySelector('.navbar');
const hamburger = document.querySelector('.navbar__hamburger');
const mobile_div = document.querySelector('.navbar__mobile');
const nav_links = document.querySelectorAll('.navbar__mobile-link');

hamburger.addEventListener('click', () => {
  navbar.classList.toggle('navbar--active');
  hamburger.classList.toggle('navbar__hamburger--active');
  mobile_div.classList.toggle('navbar__mobile--active');
});

nav_links.forEach(link => {
  link.addEventListener('click', () => {
    navbar.classList.toggle('navbar--active');
    hamburger.classList.toggle('navbar__hamburge--active');
    mobile_div.classList.toggle('navbar__mobile--active');
  });
});