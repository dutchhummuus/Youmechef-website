// Shows the right store badge for the visitor's device. Until the iOS app is
// in the App Store, iPhone and iPad visitors see the coming-soon line instead
// of a dead badge.
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
      if (iosLive) { ios.hidden = false; if (soon) soon.hidden = true; }
      else {
        // no app to get on iOS yet, so the lead line above would overpromise
        var lead = b.previousElementSibling;
        if (lead && lead.classList && lead.classList.contains('badge-lead')) lead.hidden = true;
      }
    } else if (isAndroid) {
      if (ios) ios.hidden = true;
      if (soon) soon.hidden = true;
    } else {
      // desktop: everything that exists
      if (iosLive) { ios.hidden = false; if (soon) soon.hidden = true; }
    }
  });
};
window.applyStoreBadges();
