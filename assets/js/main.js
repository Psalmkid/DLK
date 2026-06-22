(function () {
    'use strict';

    var HEADER_OFFSET = 100;
    var MOBILE_BREAKPOINT = 900;

    var header = document.querySelector('.site-header, header');
    var toggle = document.querySelector('.mobile-nav-toggle, .nav-trigger');
    var nav    = document.querySelector('.main-nav, .nav-wrap');

    /* Sticky header */
    function onScroll() {
      if (!header) return;
      document.body.classList.toggle('head-fix', window.scrollY > 12);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function isMobile() { return window.innerWidth <= MOBILE_BREAKPOINT; }

    /* Close all sub-menus */
    function closeAllSubs(except) {
      document.querySelectorAll('.has-sub, .has-mega').forEach(function (item) {
        if (except && item === except) return;
        item.classList.remove('open');
      });
    }

    /* Close mobile nav */
    function closeNav() {
      if (!nav) return;
      nav.classList.remove('open');
      document.body.classList.remove('nav-open');
      if (toggle) { toggle.classList.remove('closemenu'); toggle.setAttribute('aria-expanded','false'); }
      closeAllSubs();
    }

    /* Hamburger toggle */
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var opening = !nav.classList.contains('open');
        nav.classList.toggle('open', opening);
        document.body.classList.toggle('nav-open', opening);
        toggle.classList.toggle('closemenu', opening);
        toggle.setAttribute('aria-expanded', opening ? 'true' : 'false');
        if (!opening) closeAllSubs();
      });
    }

    /* Mobile sub-menu toggle – tap parent link to expand */
    document.querySelectorAll('.has-sub > a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (!isMobile()) return;
        e.preventDefault();
        var li = a.parentElement;
        var isOpen = li.classList.contains('open');
        closeAllSubs(li);
        li.classList.toggle('open', !isOpen);
      });
    });

    /* Close nav when clicking outside.
       FIX: previously this also closed open sub-menus on ANY click
       outside the nav — including clicks inside the product popup,
       the product search box, or the blog filter buttons — which
       could collapse an open sub-menu the user wasn't even
       interacting with. Now sub-menus only auto-close when the click
       is truly outside both the nav AND any other interactive widget
       (popup overlay, search, filters) on the page. */
    document.addEventListener('click', function (e) {
      if (!nav) return;
      var inNav = nav.contains(e.target);
      var inToggle = toggle && toggle.contains(e.target);
      var inOtherWidget = !!e.target.closest(
        '.product-popup-overlay, #product-search, .blog-filters'
      );

      if (nav.classList.contains('open') && !inNav && !inToggle) closeNav();
      if (!inNav && !inOtherWidget) closeAllSubs();
    });

    /* Close on resize to desktop */
    window.addEventListener('resize', function () { if (!isMobile()) closeNav(); });

    /* Escape key */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeNav(); closeAllSubs(); }
    });

    /* Active nav link */
    var page = (window.location.pathname.split('/').pop() || 'index.html');
    var navAliases = {
      'technology.html':                     'about.html',
      'organics.html':                       'products.html',
      'plant-nutrients-fertilizers.html':    'products.html',
      'where-to-buy.html':                   'blog.html',
      'farmers-guideline.html':              'blog.html',
      'blog-conference.html':                'blog.html',
      'blueberry-humic-acid.html':           'blog.html',
      'equipment-upgrade.html':              'blog.html',
      'supporting-sustainable-farming.html': 'blog.html'
    };
    var activeHref = navAliases[page] || page;
    document.querySelectorAll('.nav-wrap a[href], .main-nav a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (!h) return;
      var cleanHref = h.split('#')[0];
      if (cleanHref === page || cleanHref === activeHref) a.classList.add('active');
    });

    /* Scroll reveal */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var siblings = el.parentElement ? Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal')) : [];
          var idx = siblings.indexOf(el);
          if (idx >= 0) el.style.transitionDelay = (idx * 0.08) + 's';
          el.classList.add('visible');
          io.unobserve(el);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      document.querySelectorAll(
        '.h-pod-box,.blog-row,.resource-box,.two-col-info,.product-data,.certificate-box,.part-box,.acres-wrapper .box,.why-choose-listing li'
      ).forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
    }

    /* Product popup */
    var overlay = document.createElement('div');
    overlay.className = 'product-popup-overlay';
    overlay.innerHTML =
      '<div class="product-popup-dialog" role="dialog" aria-modal="true" aria-label="Product details">' +
      '<button type="button" class="product-popup-close" aria-label="Close">&times;</button>' +
      '<div class="product-popup-body"></div></div>';
    document.body.appendChild(overlay);
    var popupBody = overlay.querySelector('.product-popup-body');
    var closeBtn  = overlay.querySelector('.product-popup-close');
    var lastPopupTrigger = null;
    function closePopup() {
      overlay.classList.remove('open');
      popupBody.innerHTML = '';
      document.body.classList.remove('popup-open');
      if (lastPopupTrigger && typeof lastPopupTrigger.focus === 'function') {
        lastPopupTrigger.focus();
      }
      lastPopupTrigger = null;
    }
    function openPopup(id, trigger) {
      var src = document.getElementById(id);
      if (!src) return;
      lastPopupTrigger = trigger || null;
      popupBody.innerHTML = src.innerHTML;
      overlay.classList.add('open');
      document.body.classList.add('popup-open');
      closeBtn.focus();
    }
    document.querySelectorAll('a.div-popup[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        openPopup(link.getAttribute('href').slice(1), link);
      });
    });
    closeBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closePopup(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePopup(); });

    /* Smooth scroll */
    document.querySelectorAll('a.smooth[href^="#"], a[href^="#"]:not(.div-popup)').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href === '#') return;
      link.addEventListener('click', function (e) {
        var target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET - 16, behavior: 'smooth' });
        closeNav(); closeAllSubs();
      });
    });

    /* Blog filters */
    var blogFilters = document.querySelector('.blog-filters');
    var blogListing = document.querySelector('.blog-listing');
    if (blogFilters && blogListing) {
      var rows = blogListing.querySelectorAll('.blog-row');
      function applyFilter(filter, btn) {
        blogFilters.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.toggle('active', b === btn); });
        rows.forEach(function (row) {
          var cat = row.getAttribute('data-category') || '';
          var show = filter === 'all' || cat.split(/\s+/).indexOf(filter) !== -1;
          row.classList.toggle('is-hidden', !show);
          if (show) row.classList.add('reveal','visible');
        });
      }
      blogFilters.addEventListener('click', function (e) {
        var btn = e.target.closest('.filter-btn');
        if (btn) applyFilter(btn.getAttribute('data-filter'), btn);
      });
    }

    /* Product search.
       Indexes both the heading AND the full card text (not just the <h3>),
       so a search for an ingredient or keyword mentioned only in the body
       copy still finds the right product card. */
    var productListing = document.querySelector('.product-listing');
    var productSearch  = document.querySelector('#product-search');
    if (productListing && productSearch) {
      var products = productListing.querySelectorAll('.product-data');
      products.forEach(function (p) {
        var n = p.querySelector('h3');
        if (!n) return;
        var keywords = (n.textContent + ' ' + p.textContent).trim().toLowerCase();
        p.setAttribute('data-product', keywords);
      });
      productSearch.addEventListener('input', function () {
        var q = productSearch.value.trim().toLowerCase();
        products.forEach(function (p) {
          p.classList.toggle('is-hidden', !(!q || (p.getAttribute('data-product') || '').indexOf(q) !== -1));
        });
      });
    }

  })();
