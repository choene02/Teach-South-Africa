/* Teach South Africa - interactive UI helpers
   Vanilla JS (no frameworks required)
*/

(function () {
  'use strict';

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  // ------------------------------
  // Accordion
  // ------------------------------
  function initAccordions() {
    $all('[data-accordion] .acc-item').forEach((item) => {
      const btn = item.querySelector('[data-accordion-button]');
      const panel = item.querySelector('[data-accordion-panel]');
      if (!btn || !panel) return;

      // default state
      if (item.hasAttribute('data-open') || item.classList.contains('is-open')) {
        panel.style.maxHeight = panel.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
        item.classList.add('is-open');
      } else {
        btn.setAttribute('aria-expanded', 'false');
        panel.style.maxHeight = '0px';
      }

      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');

        // Close other items if desired
        const accordion = item.closest('[data-accordion]');
        const allowMultiple = accordion?.hasAttribute('data-allow-multiple');

        if (!allowMultiple) {
          $all('[data-accordion] .acc-item.is-open').forEach((openItem) => {
            if (openItem === item) return;
            openItem.classList.remove('is-open');
            const openBtn = openItem.querySelector('[data-accordion-button]');
            const openPanel = openItem.querySelector('[data-accordion-panel]');
            if (openBtn && openPanel) {
              openBtn.setAttribute('aria-expanded', 'false');
              openPanel.style.maxHeight = '0px';
            }
          });
        }

        if (isOpen) {
          item.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
          panel.style.maxHeight = '0px';
        } else {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });
  }

  // ------------------------------
  // Tabs
  // ------------------------------
  function initTabs() {
    $all('[data-tabs]').forEach((tabsRoot) => {
      const buttons = $all('[data-tab-button]', tabsRoot);
      const panels = $all('[data-tab-panel]', tabsRoot);
      if (!buttons.length || !panels.length) return;

      function activate(idx) {
        buttons.forEach((b, i) => {
          b.setAttribute('aria-selected', String(i === idx));
          b.tabIndex = i === idx ? 0 : -1;
          b.classList.toggle('is-active', i === idx);
        });
        panels.forEach((p, i) => {
          p.hidden = i !== idx;
          p.classList.toggle('is-active', i === idx);
        });
      }

      // initial
      const initialIdx = Math.max(
        0,
        buttons.findIndex(
          (b) => b.classList.contains('is-active') || b.getAttribute('aria-selected') === 'true'
        )
      );
      activate(initialIdx === -1 ? 0 : initialIdx);

      buttons.forEach((btn, idx) => {
        btn.addEventListener('click', () => activate(idx));
        btn.addEventListener('keydown', (e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          e.preventDefault();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const next = (idx + dir + buttons.length) % buttons.length;
          activate(next);
          buttons[next].focus();
        });
      });
    });
  }

  // ------------------------------
  // Modal
  // ------------------------------
  function initModals() {
    const modals = $all('[data-modal]');
    if (!modals.length) return;

    const closeAll = () => {
      modals.forEach((m) => {
        m.classList.remove('is-open');
        const dialog = m.querySelector('[data-modal-dialog]');
        if (dialog) dialog.setAttribute('aria-hidden', 'true');
      });
      document.body.classList.remove('no-scroll');
    };

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });

    modals.forEach((modalEl) => {
      const openTriggers = $all('[data-modal-open]', document);
      const dialog = modalEl.querySelector('[data-modal-dialog]');
      if (dialog) dialog.setAttribute('aria-hidden', 'true');

      openTriggers.forEach((trigger) => {
        const targetId = trigger.getAttribute('data-modal-open');
        if (targetId !== modalEl.id) return;

        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          closeAll();
          modalEl.classList.add('is-open');
          if (dialog) dialog.setAttribute('aria-hidden', 'false');
          document.body.classList.add('no-scroll');

          // focus first focusable
          const focusable = modalEl.querySelector(
            'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          focusable?.focus();
        });
      });

      modalEl.addEventListener('click', (e) => {
        const isBackdrop = e.target === modalEl;
        if (isBackdrop) closeAll();
      });

      $all('[data-modal-close]', modalEl).forEach((btn) => {
        btn.addEventListener('click', () => closeAll());
      });
    });
  }

  // ------------------------------
  // Lightbox gallery
  // ------------------------------
  function initLightbox() {
    const lightbox = $('#lightbox');
    if (!lightbox) return;

    const img = $('#lightbox-img', lightbox);
    const caption = $('#lightbox-caption', lightbox);

    function close() {
      lightbox.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
    }

    function open(src, cap) {
      if (!img) return;
      img.src = src;
      img.alt = cap || 'Gallery image';
      if (caption) caption.textContent = cap || '';
      lightbox.classList.add('is-open');
      document.body.classList.add('no-scroll');

      const closeBtn = $('#lightbox-close', lightbox);
      closeBtn?.focus();
    }

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
    });

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) close();
    });

    $all('[data-lightbox-item]').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const src = item.getAttribute('data-lightbox-src') || item.getAttribute('href');
        const cap =
          item.getAttribute('data-lightbox-caption') || item.getAttribute('data-title') || '';
        if (src) open(src, cap);
      });
    });
  }

  // ------------------------------
  // Location map (Leaflet) with graceful fallback
  // ------------------------------
  function initMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;

    const lat = parseFloat(mapEl.getAttribute('data-lat'));
    const lng = parseFloat(mapEl.getAttribute('data-lng'));
    const placeName = mapEl.getAttribute('data-place') || 'Teach South Africa';

    // Load Leaflet dynamically if possible.
    const tryLoadLeaflet = () => {
      return new Promise((resolve) => {
        if (window.L && window.L.map) return resolve(true);

        const existing = document.querySelector('link[data-leaflet-css]');
        if (!existing) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.dataset.leafletCss = 'true';
          document.head.appendChild(link);
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    (async () => {
      const leafletOk = await tryLoadLeaflet();
      if (!leafletOk || !window.L || !window.L.map) {
        // fallback: show a link
        mapEl.innerHTML =
          '<p class="map-fallback">Map unavailable offline. ' +
          'Open <a href="https://www.google.com/maps?q=' +
          encodeURIComponent((Number.isFinite(lat) ? lat : 0) + ',' + (Number.isFinite(lng) ? lng : 0)) +
          '" target="_blank" rel="noopener">Google Maps</a>.</p>';
        return;
      }

      const center = [
        Number.isFinite(lat) ? lat : -26.2041,
        Number.isFinite(lng) ? lng : 28.0473
      ];

      const map = window.L.map(mapEl, { zoomControl: true }).setView(center, 13);

      window.L
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        })
        .addTo(map);

      window.L.marker(center).addTo(map).bindPopup(placeName).openPopup();
    })();
  }

  // ------------------------------
  // Scroll reveal animations
  // ------------------------------
  function initScrollReveal() {
    const items = $all('[data-reveal]');
    if (!items.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    items.forEach((el) => {
      if (!el.classList.contains('is-revealed')) io.observe(el);
    });
  }

  // ------------------------------
  // Dynamic search/sort DOM manipulation
  // ------------------------------
  function initSearchDynamic() {
    const roots = $all('[data-search-root]');
    if (!roots.length) return;

    roots.forEach((root) => {
      const controls = root;
      const listRoot = controls.parentElement?.querySelector('[data-dynamic-list]');
      const input = controls.querySelector('[data-search-input]');
      const sort = controls.querySelector('[data-search-sort]');
      const resultsRoot = controls.closest('.interactive-block')?.querySelector('[data-search-results]');
      const emptyEl = resultsRoot?.querySelector('[data-search-empty]');

      if (!listRoot || !input || !sort || !resultsRoot || !emptyEl) return;

      const allItems = $all('[data-dynamic-list] .dyn-item', listRoot);
      if (!allItems.length) return;

      const getText = (el) => {
        const title = el.getAttribute('data-title') || el.querySelector('.title')?.textContent;
        const tags = el.getAttribute('data-tags') || '';
        return `${title || ''} ${tags}`.toLowerCase().trim();
      };

      const render = () => {
        const q = (input.value || '').toLowerCase().trim();
        const sortMode = sort.value;

        let items = allItems
          .map((el) => ({ el, text: getText(el) }))
          .filter((x) => (!q ? true : x.text.includes(q)));

        if (sortMode === 'a-z') {
          items.sort((a, b) => (a.el.getAttribute('data-title') || '').localeCompare(b.el.getAttribute('data-title') || ''));
        }

        allItems.forEach(({ style: {}, hidden: {}, dataset: {} }) => {});

        let visibleCount = 0;
        allItems.forEach((el) => {
          el.style.display = 'none';
        });

        items.forEach((x) => {
          x.el.style.display = '';
          visibleCount += 1;
        });

        emptyEl.style.display = visibleCount ? 'none' : '';
      };

      input.addEventListener('input', render);
      sort.addEventListener('change', render);

      render();
    });
  }

  // ------------------------------
  // Simple client-side forms (no backend)
  // ------------------------------
  function initForms() {
    // generic: if form has id contactForm or enquiryForm, show friendly status
    const forms = $all('form');
    forms.forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const statusId = form.querySelector('[role="status"]')?.id;
        const statusEl = statusId ? document.getElementById(statusId) : null;

        if (statusEl) {
          statusEl.textContent = 'Thanks! Your message has been received (demo).';
        }

        // reset form
        form.reset();
      });
    });
  }

  function boot() {
    initAccordions();
    initTabs();
    initModals();
    initLightbox();
    initMap();
    initScrollReveal();
    initSearchDynamic();
    initForms();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();

