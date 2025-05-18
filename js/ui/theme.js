// Theme Toggler Logic & CSS variable switching

const THEME_KEY = 'authorsAtlas_theme';

function detectInitialTheme() {
  let t = localStorage.getItem(THEME_KEY);
  if (!t) {
    // Prefer system
    t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, t);
  }
  updateTheme(t);
}

function applyTheme() {
  let curr = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
  const next = curr === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  updateTheme(next);
}
function updateTheme(t) {
  document.body.classList.toggle('theme-dark', t === 'dark');
  document.body.classList.toggle('theme-light', t === 'light');
  // Update icon
  const sun = document.querySelector('.theme-icon__sun');
  const moon = document.querySelector('.theme-icon__moon');
  if (t === 'dark') {
    if (sun) sun.style.opacity = '0.4';
    if (moon) moon.style.opacity = '1';
  } else {
    if (sun) sun.style.opacity = '1';
    if (moon) moon.style.opacity = '0.2';
  }
}

export { detectInitialTheme, applyTheme };

