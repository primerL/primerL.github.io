const toggle = document.querySelector('.menu-toggle');
const navigation = document.getElementById('navigation');
function closeMenu() { navigation.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }
toggle.addEventListener('click', () => { const open = navigation.classList.toggle('is-open'); toggle.setAttribute('aria-expanded', String(open)); });
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && navigation.classList.contains('is-open')) { closeMenu(); toggle.focus(); } });
const sections = [...document.querySelectorAll('main > section[id]')];
const navAnchors = [...navigation.querySelectorAll('a')];
function updateNavigation() {
  const current = sections.filter(section => section.getBoundingClientRect().top <= 145).pop() || sections[0];
  navAnchors.forEach(link => { if (link.hash === '#' + current.id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
}
window.addEventListener('scroll', updateNavigation, { passive: true });
updateNavigation();
