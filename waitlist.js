// Waitlist signup: posts straight to the Supabase REST API. The publishable key
// is public by design. Row-level security on WaitlistSignup allows insert only,
// so this key cannot read, change, or delete anything.
(function () {
  var SUPABASE_URL = 'https://zendompobuoihmfxrfzc.supabase.co';
  var SUPABASE_KEY = 'sb_publishable__sc02lAfmuJH_ngb0w9uQQ_pN3Lid7h';

  var form = document.getElementById('signup');
  if (!form) return;

  var status = document.getElementById('signup-status');
  var button = form.querySelector('button[type="submit"]');
  var idleLabel = button.textContent;
  var msg = form.dataset;

  function show(text, isError) {
    status.textContent = text;
    status.classList.toggle('is-error', !!isError);
    status.hidden = false;
  }

  function done(text) {
    form.querySelector('.signup-fields').hidden = true;
    show(text, false);
  }

  function fail() {
    button.disabled = false;
    button.textContent = idleLabel;
    show(msg.msgError, true);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    // Honeypot: real people never see this field, bots fill everything.
    if (form.elements.website && form.elements.website.value) {
      done(msg.msgOk);
      return;
    }

    var email = form.elements.email.value.trim().toLowerCase();
    if (!email) return;

    button.disabled = true;
    button.textContent = msg.msgBusy;
    status.hidden = true;

    fetch(SUPABASE_URL + '/rest/v1/WaitlistSignup', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        email: email,
        locale: document.documentElement.lang || 'nl',
        source: 'website',
      }),
    })
      .then(function (res) {
        if (res.status === 201) return done(msg.msgOk);
        if (res.status === 409) return done(msg.msgDuplicate);
        fail();
      })
      .catch(fail);
  });
})();
