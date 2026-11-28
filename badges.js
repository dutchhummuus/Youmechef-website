// Shows the right store badge for the visitor's device. Until the iOS app is
// in the App Store, iPhone and iPad visitors see the coming-soon line instead
// of a dead badge. The coming-soon line starts hidden and only iOS reveals
// it: every other device sees a working badge, so the line is just noise.
window.applyStoreBadges = function () {
  var blocks = document.querySelectorAll('[data-store-badges]');
  if (!blocks.length) return;
  var ua = navigator.userAgent;
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/.test(ua);
  Array.prototype.forEach.call(blocks, function (b) {
    var play = b.querySelector('.badge-play');
    var ios = b.querySelector('.badge-ios');
    var soon = b.querySelector('.badge-soon');
    var iosLive = ios && ios.getAttribute('href');
    if (isIOS) {
      if (play) play.hidden = true;
      if (iosLive) { ios.hidden = false; }
      else {
        if (soon) soon.hidden = false;
        // no app to get on iOS yet, so the lead line above would overpromise
        var lead = b.previousElementSibling;
        if (lead && lead.classList && lead.classList.contains('badge-lead')) lead.hidden = true;
      }
    } else if (isAndroid) {
      if (ios) ios.hidden = true;
    } else {
      // desktop: every working badge
      if (iosLive) { ios.hidden = false; }
    }
  });
};
window.applyStoreBadges();
