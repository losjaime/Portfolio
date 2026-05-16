/* ─── Active Nav Link ────────────────────────────────────────────────────── */
(function () {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('nav__link--active');
    }
  });
})();

/* ─── Nav Scroll Shadow ──────────────────────────────────────────────────── */
(function () {
  var nav = document.querySelector('.nav');
  if (!nav) return;
  window.addEventListener('scroll', function () {
    nav.classList.toggle('nav--scrolled', window.scrollY > 20);
  }, { passive: true });
})();

/* ─── Mobile Nav Toggle ──────────────────────────────────────────────────── */
(function () {
  var toggle   = document.querySelector('.nav__toggle');
  var navLinks = document.querySelector('.nav__links');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', function () {
    var open = navLinks.classList.toggle('nav__links--open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  navLinks.querySelectorAll('.nav__link').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('nav__links--open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* ─── Contact Form Validation + Submission ───────────────────────────────── */
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;

  var rules = {
    name:    { required: true, minLength: 2,  label: 'Name' },
    email:   { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, label: 'Email' },
    message: { required: true, minLength: 10, label: 'Message' }
  };

  function validateField(id) {
    var field = document.getElementById(id);
    var error = document.getElementById(id + '-error');
    var rule  = rules[id];
    var val   = field.value.trim();
    var msg   = '';

    if (rule.required && !val) {
      msg = rule.label + ' is required.';
    } else if (rule.minLength && val.length < rule.minLength) {
      msg = rule.label + ' must be at least ' + rule.minLength + ' characters.';
    } else if (rule.pattern && !rule.pattern.test(val)) {
      msg = 'Please enter a valid ' + rule.label.toLowerCase() + '.';
    }

    error.textContent = msg;
    field.classList.toggle('form-input--error', !!msg);
    return !msg;
  }

  Object.keys(rules).forEach(function (id) {
    var field = document.getElementById(id);
    if (field) {
      field.addEventListener('blur', function () { validateField(id); });
      field.addEventListener('input', function () {
        if (field.classList.contains('form-input--error')) validateField(id);
      });
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var allValid = Object.keys(rules).map(validateField).every(Boolean);
    if (!allValid) return;

    var submitBtn = form.querySelector('button[type="submit"]');
    var formError = document.getElementById('formSuccess');

    // Loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    var payload = {
      name:    document.getElementById('name').value.trim(),
      email:   document.getElementById('email').value.trim(),
      message: document.getElementById('message').value.trim(),
      website: document.getElementById('website') ? document.getElementById('website').value : ''
    };

    fetch('contact.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.success) {
        form.reset();
        Object.keys(rules).forEach(function (id) {
          var f = document.getElementById(id);
          if (f) f.classList.remove('form-input--error');
          var err = document.getElementById(id + '-error');
          if (err) err.textContent = '';
        });
        if (formError) formError.hidden = false;
      } else {
        alert(data.error || 'Something went wrong. Please try again.');
      }
    })
    .catch(function () {
      alert('Could not send your message. Please check your connection and try again.');
    })
    .finally(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    });
  });
})();

/* ─── Scroll Reveal ──────────────────────────────────────────────────────── */
(function () {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.glass-card, .skill-chip').forEach(function (el) {
      el.classList.add('visible');
    });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.glass-card, .skill-chip').forEach(function (el) {
    observer.observe(el);
  });
})();
