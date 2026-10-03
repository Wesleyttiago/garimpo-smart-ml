(() => {
  'use strict';
  const themeKey = 'garimpo-smart:theme';
  const root = document.documentElement;
  const darkPreference = window.matchMedia('(prefers-color-scheme: dark)');
  let savedTheme = null;
  try { savedTheme = localStorage.getItem(themeKey); } catch { /* Private mode may block storage. */ }
  if (!['light', 'dark'].includes(savedTheme)) savedTheme = null;

  function applyTheme(theme) {
    root.dataset.theme = theme;
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
      toggle.title = theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro';
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#17171b' : '#f7f7f2');
  }
  applyTheme(savedTheme || (darkPreference.matches ? 'dark' : 'light'));

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(root.dataset.theme);
    const toggle = document.getElementById('theme-toggle');
    toggle.addEventListener('click', () => {
      savedTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(savedTheme);
      try { localStorage.setItem(themeKey, savedTheme); } catch { /* Continue in this session. */ }
    });

    const filterButtons = [...document.querySelectorAll('[data-filter]')];
    const products = [...document.querySelectorAll('.product-card')];
    const resultCount = document.getElementById('result-count');
    filterButtons.forEach(button => button.addEventListener('click', () => {
      const category = button.dataset.filter;
      let count = 0;
      filterButtons.forEach(control => control.setAttribute('aria-pressed', String(control === button)));
      products.forEach(product => {
        const visible = category === 'todos' || product.dataset.category === category;
        product.hidden = !visible;
        if (!visible) product.querySelectorAll('details[open]').forEach(details => { details.open = false; });
        if (visible) count++;
      });
      resultCount.textContent = count === 1 ? '1 achado para explorar' : `${count} achados para explorar`;
    }));

    let vipUrl;
    try {
      vipUrl = new URL(window.GARIMPO_CONFIG?.vipGroupUrl || '');
      if (vipUrl.protocol !== 'https:' || !['chat.whatsapp.com', 't.me', 'telegram.me'].includes(vipUrl.hostname) || vipUrl.username || vipUrl.password || vipUrl.pathname === '/') return;
    } catch { return; }
    document.querySelectorAll('[data-vip-link]').forEach(link => {
      link.href = vipUrl.href;
      link.hidden = false;
    });
    document.getElementById('vip-banner').hidden = false;
    document.querySelector('.catalog-link').hidden = true;
  });
  darkPreference.addEventListener('change', event => {
    if (!savedTheme) applyTheme(event.matches ? 'dark' : 'light');
  });
})();
