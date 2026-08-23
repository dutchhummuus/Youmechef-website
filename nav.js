// Mobile hamburger for the top bar. The language pill stays outside the panel
// so it is always one tap away.
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  var openLabel = toggle.getAttribute('aria-label');
  var closeLabel = toggle.dataset.closeLabel || openLabel;

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? closeLabel : openLabel);
    document.body.classList.toggle('nav-open', open);
  }

  toggle.addEventListener('click', function () {
    setOpen(!nav.classList.contains('is-open'));
  });

  // Picking a link closes the panel so the page can scroll to the section.
  nav.addEventListener('click', function (event) {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Tap outside the bar closes it too.
  document.addEventListener('click', function (event) {
    if (!nav.classList.contains('is-open')) return;
    if (event.target.closest('.nav')) return;
    setOpen(false);
  });

  // Back on a wide screen, forget the open state.
  window.matchMedia('(min-width: 861px)').addEventListener('change', function (mq) {
    if (mq.matches) setOpen(false);
  });
})();
