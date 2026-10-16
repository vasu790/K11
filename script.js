(() => {
  const $ = (id) => document.getElementById(id);

  const menuToggle = $('menuToggle');
  const nav = $('nav');
  menuToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  $('year').textContent = new Date().getFullYear();

  // Contact details and social links come from site.json; blank values stay hidden.
  fetch('site.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((site) => {
      document.querySelectorAll('#contactCard [data-field]').forEach((row) => {
        const value = (site[row.dataset.field] || '').trim();
        if (!value) return;
        const link = row.querySelector('a');
        if (link) {
          link.textContent = value;
          link.href = row.dataset.field === 'email'
            ? 'mailto:' + value
            : 'tel:' + value.replace(/[^\d+]/g, '');
        } else {
          row.querySelector('p').textContent = value;
        }
        row.hidden = false;
      });
      if (![...document.querySelectorAll('#contactCard .contact-row')].some((r) => !r.hidden)) {
        $('contact').hidden = true;
        nav.querySelector('a[href="#contact"]').hidden = true;
      }
      const socials = $('socials');
      Object.entries(site.socials || {}).forEach(([name, url]) => {
        if (!url) return;
        const a = document.createElement('a');
        a.href = url; a.textContent = name; a.rel = 'noopener noreferrer'; a.target = '_blank';
        socials.appendChild(a);
      });
    });

  const form = $('verifyForm');
  const input = $('certId');
  const btn = $('verifyBtn');
  const result = $('result');

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function show(kind, html) {
    result.className = 'result ' + kind;
    result.innerHTML = html;
    result.hidden = false;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = input.value.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{3,39}$/.test(id)) {
      show('error', '<h3>Invalid ID format</h3><p>Please enter the certificate ID exactly as printed on the certificate.</p>');
      return;
    }
    btn.disabled = true; btn.textContent = 'Checking…';
    try {
      const res = await fetch('/api/verify?id=' + encodeURIComponent(id), { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (res.status === 429) {
        show('error', '<h3>Too many attempts</h3><p>Please wait a minute and try again.</p>');
      } else if (!res.ok) {
        show('error', '<h3>Something went wrong</h3><p>We could not complete the check. Please try again shortly.</p>');
      } else if (!data.found) {
        show('error', '<h3>Certificate not found</h3><p>No record matches <b>' + esc(id) + '</b>. Check the ID and try again, or contact the academy.</p>');
      } else {
        const r = data.record;
        const valid = r.status === 'Valid';
        show(valid ? 'ok' : 'warn',
          '<h3>' + (valid ? '✓ Certificate verified' : 'Certificate ' + esc(r.status)) + '</h3>' +
          '<dl>' +
          '<dt>Name</dt><dd>' + esc(r.name) + '</dd>' +
          '<dt>Certificate ID</dt><dd>' + esc(r.id) + '</dd>' +
          '<dt>Course</dt><dd>' + esc(r.course) + '</dd>' +
          (r.issued ? '<dt>Issued</dt><dd>' + esc(r.issued) + '</dd>' : '') +
          '<dt>Status</dt><dd><span class="status ' + (valid ? 'valid' : 'inactive') + '">' + esc(r.status) + '</span></dd>' +
          '</dl>');
      }
    } catch (err) {
      show('error', '<h3>Connection problem</h3><p>Please check your internet connection and try again.</p>');
    } finally {
      btn.disabled = false; btn.textContent = 'Verify';
    }
  });
})();
