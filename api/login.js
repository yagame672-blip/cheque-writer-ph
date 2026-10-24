// POST /api/login  { username, password }
// Checks credentials against env vars and, on success, sets a signed,
// HttpOnly session cookie. The password never reaches the browser.
import crypto from 'node:crypto';

const SESSION_HOURS = 12;

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function constantEquals(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const expectedUser = process.env.ADMIN_USER || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
  if (!expectedPass || !secret) {
    res.status(500).json({ ok: false, error: 'not_configured' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const username = (body && body.username) || 'admin';
  const password = (body && body.password) || '';

  const userOk = constantEquals(username, expectedUser);
  const passOk = constantEquals(password, expectedPass);
  if (!(userOk && passOk)) {
    res.status(401).json({ ok: false });
    return;
  }

  const exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = String(exp);
  const token = `${payload}.${sign(payload, secret)}`;
  res.setHeader(
    'Set-Cookie',
    `cw_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_HOURS * 3600}`
  );
  res.status(200).json({ ok: true });
}
