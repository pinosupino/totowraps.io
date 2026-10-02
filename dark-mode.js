(() => {
  const KEY = 'totowrap-theme';
  const root = document.documentElement;
  const applyTheme = (dark) => {
    root.classList.toggle('dark-mode', dark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#202124' : '#FFFDD0');
    const button = document.querySelector('[data-theme-toggle]');
    if (button) {
      button.textContent = dark ? '☀' : '☾';
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      button.setAttribute('title', dark ? 'Light mode' : 'Dark mode');
      button.setAttribute('aria-pressed', String(dark));
    }
  };
  let dark = false;
  try { dark = localStorage.getItem(KEY) === 'dark'; } catch (_) {}
  applyTheme(dark);

  function ensureToggle() {
    const header = document.querySelector('#app .hdr');
    const right = header?.querySelector('.hdr-right');
    if (!right || right.querySelector('[data-theme-toggle]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.themeToggle = '';
    button.className = 'theme-toggle';
    button.textContent = dark ? '☀' : '☾';
    button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    button.setAttribute('title', dark ? 'Light mode' : 'Dark mode');
    button.setAttribute('aria-pressed', String(dark));
    right.appendChild(button);
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-theme-toggle]');
    if (!button) return;
    dark = !root.classList.contains('dark-mode');
    try { localStorage.setItem(KEY, dark ? 'dark' : 'light'); } catch (_) {}
    applyTheme(dark);
  });

  const observer = new MutationObserver(ensureToggle);
  const start = () => {
    const app = document.getElementById('app');
    if (app) observer.observe(app, { childList: true, subtree: true });
    ensureToggle();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
