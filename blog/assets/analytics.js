(() => {
  'use strict';
  const config = window.GARIMPO_ANALYTICS;
  const id = config?.measurementId;
  if (!config?.enabled || !/^G-[A-Z0-9]{6,20}$/.test(id || '') ||
      location.hostname !== config.allowedHost ||
      !location.pathname.startsWith(config.pathPrefix)) return;

  const preferenceKey = 'garimpo_analytics_consent_v1';
  const banner = document.getElementById('measurement-consent');
  const preferences = document.querySelector('[data-measurement-preferences]');
  const allowedDays = Math.min(180, Math.max(1, Number(config.consentDays) || 180));
  let consent = readPreference();
  let booted = false;
  let observer;
  let returnFocus;
  const seen = new Set();

  function readPreference() {
    try {
      const value = JSON.parse(localStorage.getItem(preferenceKey));
      if (value?.version === 1 && value.expires > Date.now() &&
          ['granted', 'denied'].includes(value.choice)) return value.choice;
    } catch { /* A recusa ou a aceitação também funciona sem armazenamento. */ }
    return 'unknown';
  }

  function remember(choice) {
    try {
      localStorage.setItem(preferenceKey, JSON.stringify({
        version: 1, choice, expires: Date.now() + allowedDays * 86400000
      }));
    } catch { /* A preferência permanece válida nesta página. */ }
  }

  function safeLocation() {
    const clean = new URL(location.origin + location.pathname);
    const query = new URLSearchParams(location.search);
    const approved = {
      utm_source: config.sources, utm_medium: config.media,
      utm_campaign: config.campaigns || [config.experimentId],
      utm_content: config.contents || config.pilotProducts
    };
    for (const [key, values] of Object.entries(approved)) {
      const value = query.get(key);
      if (values.includes(value)) clean.searchParams.set(key, value);
    }
    return clean.href;
  }

  function safeReferrer() {
    try { return document.referrer ? new URL(document.referrer).origin + '/' : ''; }
    catch { return ''; }
  }

  function context() {
    return {
      page_location: safeLocation(), page_referrer: safeReferrer(),
      page_title: document.title, experiment_id: config.experimentId
    };
  }

  function emit(name, fields) {
    if (consent !== 'granted' || !booted || window['ga-disable-' + id]) return;
    window.gtag('event', name, { ...context(), ...fields });
  }

  function productContext(card) {
    const productId = card.dataset.measureProduct;
    return {
      product_id: productId,
      product_name: card.querySelector('h3')?.textContent || productId,
      placement: card.dataset.measurePlacement,
      cohort: config.pilotProducts.includes(productId) ? 'initial' : 'other'
    };
  }

  function observeProducts() {
    if (!('IntersectionObserver' in window)) return;
    observer?.disconnect();
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const card = entry.target;
        const key = card.dataset.measureProduct + ':' + card.dataset.measurePlacement;
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5 ||
            card.closest('[hidden]') || seen.has(key)) continue;
        seen.add(key);
        emit('product_impression', productContext(card));
        observer.unobserve(card);
      }
    }, { threshold: [0.5] });
    document.querySelectorAll('[data-measure-product]').forEach(card => observer.observe(card));
  }

  function start() {
    window['ga-disable-' + id] = false;
    if (!booted) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', {
        analytics_storage: 'denied', ad_storage: 'denied',
        ad_user_data: 'denied', ad_personalization: 'denied'
      });
      window.gtag('js', new Date());
    }
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    if (!booted) {
      window.gtag('config', id, {
        ...context(), send_page_view: false,
        allow_google_signals: false, allow_ad_personalization_signals: false,
        cookie_domain: location.hostname, cookie_path: config.pathPrefix,
        cookie_expires: allowedDays * 86400, cookie_update: false
      });
      booted = true;
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
      script.dataset.garimpoAnalytics = '';
      document.head.appendChild(script);
      emit('page_view', {});
    }
    observeProducts();
  }

  function clearAnalyticsCookies() {
    for (const part of document.cookie.split(';')) {
      const name = part.trim().split('=')[0];
      if (name !== '_ga' && name !== '_ga_' + id.slice(2)) continue;
      for (const domain of ['', location.hostname, '.' + location.hostname]) {
        document.cookie = name + '=; Max-Age=0; path=' + config.pathPrefix +
          (domain ? '; domain=' + domain : '') + '; SameSite=Lax';
      }
    }
  }

  function setConsent(choice) {
    consent = choice;
    remember(choice);
    if (choice === 'granted') start();
    else {
      window['ga-disable-' + id] = true;
      observer?.disconnect();
      if (booted) window.gtag('consent', 'update', { analytics_storage: 'denied' });
      clearAnalyticsCookies();
    }
    if (banner) banner.hidden = true;
    returnFocus?.focus();
    returnFocus = null;
  }

  document.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest('a[data-measure-affiliate]') : null;
    if (!link || link.getAttribute('aria-disabled') === 'true') return;
    const card = link.closest('[data-measure-product]');
    if (!card) return;
    try {
      const destination = new URL(link.href);
      if (destination.protocol !== 'https:' ||
          !['meli.la', 'www.mercadolivre.com.br', 'produto.mercadolivre.com.br'].includes(destination.hostname)) return;
      emit('affiliate_click', {
        ...productContext(card), offer_variant: link.dataset.measureAffiliate,
        destination_host: destination.hostname, transport_type: 'beacon'
      });
    } catch { /* Falhas de medição nunca interrompem o link de compra. */ }
  });

  banner?.querySelector('[data-measurement-accept]')?.addEventListener('click', () => setConsent('granted'));
  banner?.querySelector('[data-measurement-reject]')?.addEventListener('click', () => setConsent('denied'));
  preferences?.addEventListener('click', () => {
    if (!banner) return;
    returnFocus = preferences;
    banner.hidden = false;
    banner.querySelector('[data-measurement-reject]')?.focus();
  });
  if (preferences) preferences.hidden = false;
  if (consent === 'granted') start();
  else if (consent === 'unknown' && banner) banner.hidden = false;
})();
