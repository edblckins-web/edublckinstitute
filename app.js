/* ============================================================
   EDUBLCK INSTITUTE / SHARED INTERACTIONS
   Guarded per-page: each block only runs if its elements exist.
   ============================================================ */
(function () {
  'use strict';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if ('IntersectionObserver' in window && !reducedMotion) {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('visible'); ro.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el, i) {
        el.style.transitionDelay = (i % 4) * 120 + 'ms';
        ro.observe(el);
      });
    } else {
      revealEls.forEach(function (el) { el.classList.add('visible'); });
    }
  }

  /* ---------- Mobile drawer ---------- */
  var hamburger = document.getElementById('hamburger');
  var drawer = document.getElementById('mobileDrawer');
  var overlay = document.getElementById('drawerOverlay');
  if (hamburger && drawer && overlay) {
    var toggleDrawer = function (force) {
      var open = typeof force === 'boolean' ? force : !drawer.classList.contains('open');
      drawer.classList.toggle('open', open);
      drawer.querySelectorAll('a').forEach(function (a) {
        if (open) { a.removeAttribute('tabindex'); } else { a.setAttribute('tabindex', '-1'); }
      });
      overlay.classList.toggle('open', open);
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    hamburger.addEventListener('click', function () { toggleDrawer(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        toggleDrawer(false);
        hamburger.focus();
      }
    });
    overlay.addEventListener('click', function () { toggleDrawer(false); });
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { toggleDrawer(false); });
    });
  }

  /* ---------- Accordion (AI Projects): one open at a time ---------- */
  var accCards = document.querySelectorAll('.acc-card');
  if (accCards.length) {
    accCards.forEach(function (card) {
      var head = card.querySelector('.acc-head');
      var body = card.querySelector('.acc-body');
      head.setAttribute('aria-expanded', 'false');
      head.addEventListener('click', function () {
        var isOpen = card.classList.contains('open');
        accCards.forEach(function (c) {
          c.classList.remove('open');
          c.querySelector('.acc-body').style.maxHeight = null;
          c.querySelector('.acc-head').setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          card.classList.add('open');
          body.style.maxHeight = body.scrollHeight + 'px';
          head.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ---------- Theme tiles (Research): expand below grid ---------- */
  var themeTiles = document.querySelectorAll('.theme-tile');
  var themeDetails = document.querySelectorAll('.theme-detail');
  if (themeTiles.length) {
    themeTiles.forEach(function (tile) {
      tile.addEventListener('click', function () {
        var target = tile.getAttribute('data-theme');
        var already = tile.classList.contains('active');
        themeTiles.forEach(function (t) { t.classList.remove('active'); t.setAttribute('aria-expanded', 'false'); });
        themeDetails.forEach(function (d) { d.classList.remove('show'); });
        if (!already) {
          tile.classList.add('active');
          tile.setAttribute('aria-expanded', 'true');
          var detail = document.getElementById('theme-' + target);
          if (detail) detail.classList.add('show');
        }
      });
    });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll('.counter');
  if (counters.length) {
    var animate = function (el) {
      var target = parseInt(el.getAttribute('data-target'), 10);
      if (reducedMotion) { el.textContent = target; return; }
      var start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / 1600, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { animate(e.target); co.unobserve(e.target); }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { co.observe(el); });
    } else {
      counters.forEach(function (el) { el.textContent = el.getAttribute('data-target'); });
    }
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    /* Preselect interest from URL, e.g. contact.html?interest=research */
    var params = new URLSearchParams(window.location.search);
    var interest = params.get('interest');
    if (interest) {
      var map = {
        embed: 'AI embedment / integration',
        marketing: 'AI marketing & client analysis',
        ux: 'UX / product build',
        training: 'AI team training',
        institute: 'EduBlck Institute services',
        research: 'Research participation',
        general: 'General inquiry'
      };
      var value = map[interest];
      if (value) {
        var box = form.querySelector('input[name="workWith"][value="' + value + '"]');
        if (box) box.checked = true;
      }
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var msg = document.getElementById('formMessage');
      msg.className = 'form-msg';
      msg.textContent = '';
      form.querySelectorAll('.err').forEach(function (el) { el.classList.remove('show'); });

      var checked = form.querySelectorAll('input[name="workWith"]:checked');
      var consent = document.getElementById('marketingConsent').checked;
      var valid = true;

      /* One Name field in the UI; split for the existing backend so
         EduBlck_ContactForm.gs needs zero changes. The backend requires
         a non-empty lastName, so we validate for a full name here. */
      var fullName = document.getElementById('name').value.trim();
      var spaceIdx = fullName.indexOf(' ');

      if (checked.length === 0) {
        var wErr = document.getElementById('workWithError');
        wErr.textContent = 'Please select at least one option.';
        wErr.classList.add('show');
        valid = false;
      }
      if (!valid) return;

      var btn = form.querySelector('.btn-primary');
      btn.disabled = true;
      btn.textContent = 'Sending...';

      var firstName = spaceIdx === -1 ? fullName : fullName.slice(0, spaceIdx);
      var lastName = spaceIdx === -1 ? '-' : fullName.slice(spaceIdx + 1);

      var selected = Array.from(checked).map(function (cb) { return cb.value; }).join(', ');
      var fd = new FormData();
      fd.append('firstName', firstName);
      fd.append('lastName', lastName);
      fd.append('email', document.getElementById('email').value);
      fd.append('workWith', selected);
      fd.append('message', document.getElementById('message').value);
      fd.append('marketingConsent', consent ? 'on' : 'off');

      try {
        var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxVA7rJT_SXyOhM0GXCeDFb_uCbHLrrIveVqxvtZgH0TLxwrAs_ZkFOhCP_jH736Czv-A/exec';
        var res = await fetch(SCRIPT_URL, { method: 'POST', body: fd });
        var result = await res.json();
        if (result.status === 'success') {
          msg.className = 'form-msg success';
          msg.textContent = result.message || "Message sent. I'll reply within 2 to 3 business days.";
          form.reset();
          msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          msg.className = 'form-msg error';
          msg.textContent = result.message || 'Something went wrong. Please try again.';
        }
      } catch (err) {
        msg.className = 'form-msg error';
        msg.textContent = 'Something went wrong sending your message. Please try again, or email edblckins@gmail.com directly.';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send Message';
      }
    });
  }
})();
