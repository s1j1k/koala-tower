/* About page: show the optional feedback / tip links from js/config.js. */
(function () {
  'use strict';
  const c = window.ATC_CONFIG || {}, box = document.getElementById('links');
  const ok = x => typeof x === 'string' && /^https:\/\/[^\s"'<>]+$/.test(x);
  const add = (url, label) => {
    const a = document.createElement('a');
    a.className = 'btn ghost small'; a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.style.textAlign = 'center'; a.style.textDecoration = 'none'; a.textContent = label;
    box.appendChild(a);
  };
  if (ok(c.feedbackUrl)) add(c.feedbackUrl, '💬 Send feedback or report a bug');
  if (ok(c.tipUrl)) add(c.tipUrl, '☕ Enjoying it? Buy me a coffee');
})();
