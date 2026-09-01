/* =========================================================================
   Elec Training, City and Guilds approved electrical training centre
   main.js  —  mobile nav, scroll reveals, FAQ accordion, wizard form
   ========================================================================= */

// Paste the Apps Script URL here after running Skill 03 (Form Backend Setup)
const ENDPOINT = '';

(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     Mobile navigation
     --------------------------------------------------------------------- */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobile-menu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      const open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      burger.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      mobileMenu.classList.toggle('is-open', !open);
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Open menu');
        mobileMenu.classList.remove('is-open');
      });
    });
  }

  /* ---------------------------------------------------------------------
     Scroll reveals
     Uses a plain scroll check rather than IntersectionObserver so it also
     works inside preview panes and embedded browsers where IO can misreport.
     --------------------------------------------------------------------- */
  const revealItems = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  let revealTicking = false;

  function checkReveals() {
    revealTicking = false;
    const limit = window.innerHeight - 60;
    for (let i = revealItems.length - 1; i >= 0; i--) {
      const el = revealItems[i];
      const rect = el.getBoundingClientRect();
      if (rect.top < limit && rect.bottom > 0) {
        el.classList.add('is-in');
        revealItems.splice(i, 1);
      }
    }
  }

  function queueReveals() {
    if (revealTicking) { return; }
    revealTicking = true;
    window.requestAnimationFrame(checkReveals);
  }

  window.addEventListener('scroll', queueReveals, { passive: true });
  window.addEventListener('resize', queueReveals);
  window.addEventListener('load', checkReveals);
  checkReveals();
  window.setTimeout(checkReveals, 300);

  /* ---------------------------------------------------------------------
     FAQ accordion
     --------------------------------------------------------------------- */
  // The panel animates on an explicit height, so JS owns the measurement.
  // Collapsed panels sit at height 0; an open one is pinned to its content
  // height for the transition, then released to auto so it can reflow if the
  // window is resized or the text wraps differently.
  function closeFaq(faq) {
    const panel = faq.querySelector('.faq__a');
    panel.style.height = panel.scrollHeight + 'px';
    void panel.offsetHeight;                    // force a reflow before collapsing
    faq.classList.remove('is-open');
    faq.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
    panel.style.height = '0px';
  }

  function openFaq(faq) {
    const panel = faq.querySelector('.faq__a');
    faq.classList.add('is-open');
    faq.querySelector('.faq__q').setAttribute('aria-expanded', 'true');
    panel.style.height = panel.firstElementChild.offsetHeight + 'px';
    panel.addEventListener('transitionend', function release(e) {
      if (e.propertyName !== 'height') { return; }
      panel.removeEventListener('transitionend', release);
      if (faq.classList.contains('is-open')) { panel.style.height = 'auto'; }
    });
  }

  document.querySelectorAll('.faq__q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const faq = btn.closest('.faq');
      const wasOpen = faq.classList.contains('is-open');

      faq.parentElement.querySelectorAll('.faq.is-open').forEach(closeFaq);

      if (!wasOpen) { openFaq(faq); }
    });
  });

  /* ---------------------------------------------------------------------
     Shared submit helper
     --------------------------------------------------------------------- */
  function post(payload) {
    if (!ENDPOINT) {
      // No backend wired up yet. Log the payload so the form can still be tested.
      console.warn('ENDPOINT is empty. Run Skill 03 and paste the Apps Script URL into main.js.');
      console.info('Form payload:', payload);
      return Promise.resolve();
    }
    return fetch(ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  /* ---------------------------------------------------------------------
     Home page quick enquiry form
     --------------------------------------------------------------------- */
  const quickForm = document.getElementById('quickForm');

  if (quickForm) {
    const quickSubmit = document.getElementById('quickSubmit');
    const quickError = document.getElementById('quickError');
    const quickDone = document.getElementById('quickDone');

    quickForm.addEventListener('submit', function (e) {
      e.preventDefault();
      quickError.classList.remove('is-active');

      const data = Object.fromEntries(new FormData(quickForm).entries());

      if (data.website) { return; } // honeypot

      if (!data.firstName || !data.phone || !isEmail(data.email || '')) {
        quickError.textContent = 'Please add your name, phone number and a valid email address.';
        quickError.classList.add('is-active');
        return;
      }

      quickSubmit.setAttribute('disabled', 'disabled');
      quickSubmit.querySelector('.btn__inner').textContent = 'Sending...';

      post({
        form: 'Home quick enquiry',
        page: window.location.href,
        submittedAt: new Date().toISOString(),
        firstName: data.firstName,
        email: data.email,
        phone: data.phone,
        course: data.course || 'Not specified'
      }).then(function () {
        quickForm.querySelector('.quote__grid').style.display = 'none';
        quickSubmit.parentElement.style.display = 'none';
        quickDone.style.display = 'block';
      }).catch(function () {
        quickSubmit.removeAttribute('disabled');
        quickSubmit.querySelector('.btn__inner').textContent = 'Send my enquiry';
        quickError.textContent = 'Something went wrong sending that. Please call us on 0330 822 5337.';
        quickError.classList.add('is-active');
      });
    });
  }

  /* ---------------------------------------------------------------------
     Contact page wizard
     --------------------------------------------------------------------- */
  const wizard = document.getElementById('wizard');

  if (wizard) {
    const panels = Array.prototype.slice.call(wizard.querySelectorAll('.step-panel'));
    const dots = document.querySelectorAll('.wizard__dots span');
    const count = document.getElementById('wizCount');
    const backBtn = document.getElementById('wizBack');
    const nextBtn = document.getElementById('wizNext');
    const submitBtn = document.getElementById('wizSubmit');
    const doneBox = document.getElementById('wizDone');
    const wizError = document.getElementById('wizError');
    const answers = {};
    let current = 0;

    function render() {
      panels.forEach(function (panel, i) {
        panel.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-done', i <= current);
      });
      count.textContent = 'Step ' + (current + 1) + ' of ' + panels.length;

      backBtn.hidden = current === 0;
      const last = current === panels.length - 1;
      nextBtn.hidden = last;
      submitBtn.hidden = !last;

      const heading = panels[current].querySelector('h3');
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    }

    function go(delta) {
      const target = current + delta;
      if (target < 0 || target >= panels.length) { return; }
      current = target;
      render();
      document.getElementById('enquire').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Choice cards: select, store, auto-advance
    wizard.querySelectorAll('.choice').forEach(function (choice) {
      choice.addEventListener('click', function () {
        const field = choice.dataset.field;
        const group = choice.closest('.choices');

        group.querySelectorAll('.choice').forEach(function (c) { c.classList.remove('is-selected'); });
        choice.classList.add('is-selected');
        answers[field] = choice.dataset.value;

        window.setTimeout(function () { go(1); }, 220);
      });
    });

    nextBtn.addEventListener('click', function () { go(1); });
    backBtn.addEventListener('click', function () { go(-1); });

    wizard.addEventListener('submit', function (e) {
      e.preventDefault();
      wizError.classList.remove('is-active');

      const data = Object.fromEntries(new FormData(wizard).entries());

      if (data.website) { return; } // honeypot

      if (!data.name || !data.phone || !isEmail(data.email || '')) {
        wizError.textContent = 'Please add your name, phone number and a valid email address.';
        wizError.classList.add('is-active');
        return;
      }

      submitBtn.setAttribute('disabled', 'disabled');
      submitBtn.querySelector('.btn__inner').textContent = 'Sending...';

      post({
        form: 'Contact wizard',
        page: window.location.href,
        submittedAt: new Date().toISOString(),
        course: answers.course || 'Not specified',
        experience: answers.experience || 'Not specified',
        timing: answers.timing || 'Not specified',
        location: data.location || '',
        name: data.name,
        phone: data.phone,
        email: data.email,
        message: data.message || ''
      }).then(function () {
        wizard.style.display = 'none';
        document.querySelector('.wizard__dots').style.display = 'none';
        count.style.display = 'none';
        doneBox.classList.add('is-active');
        doneBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }).catch(function () {
        submitBtn.removeAttribute('disabled');
        submitBtn.querySelector('.btn__inner').textContent = 'Send my enquiry';
        wizError.textContent = 'Something went wrong sending that. Please call us on 0330 822 5337.';
        wizError.classList.add('is-active');
      });
    });

    render();
  }

})();
