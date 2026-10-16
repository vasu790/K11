// Serverless function: GET /api/verify?id=<CERTIFICATE_ID>
// Looks up a single certificate and returns only the fields needed for display.
// The full records file is never exposed to the browser.
const records = require('../data/certificates.json');

const index = new Map(records.map((r) => [String(r.id).trim().toUpperCase(), r]));

// Basic per-instance rate limiting (best effort; use Vercel Firewall for hard limits).
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const hits = new Map();

function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_REQUESTS;
}

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'Too many requests' });

  const id = String(req.query.id || '').trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9-]{3,39}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid certificate ID' });
  }

  const r = index.get(id);
  if (!r) return res.status(200).json({ found: false });

  return res.status(200).json({
    found: true,
    record: {
      id: r.id,
      name: r.name,
      course: r.course,
      issued: r.issued || '',
      status: r.status || 'Valid',
    },
  });
};
