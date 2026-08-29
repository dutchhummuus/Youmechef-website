// Auto-scrolling product strip. The tile set is cloned once so the loop wraps
// seamlessly. Pauses under the pointer or a touch, and stays manual for
// reduced-motion users.
(function () {
  var track = document.querySelector('.haveall-track');
  if (!track) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var originals = Array.prototype.slice.call(track.children);
  originals.forEach(function (node) {
    var clone = node.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });

  var half = 0;
  function measure() {
    half = track.scrollWidth / 2;
  }
  measure();
  window.addEventListener('resize', measure);

  var SPEED = 30; // pixels per second
  var paused = false;
  var pos = track.scrollLeft;
  var last = null;

  function resume() {
    pos = track.scrollLeft; // pick up wherever a manual swipe left it
    paused = false;
  }
  track.addEventListener('pointerenter', function () { paused = true; });
  track.addEventListener('pointerleave', resume);
  track.addEventListener('touchstart', function () { paused = true; }, { passive: true });
  track.addEventListener('touchend', function () { setTimeout(resume, 1500); }, { passive: true });

  function step(t) {
    if (last != null && !paused && half > 0) {
      pos += ((t - last) / 1000) * SPEED;
      if (pos >= half) pos -= half;
      track.scrollLeft = pos;
    }
    last = t;
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
})();
