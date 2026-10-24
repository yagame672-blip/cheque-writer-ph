// Vercel Routing Middleware – gates the admin dashboard behind a signed
// session cookie set by /api/login. Visitors without a valid cookie are sent
// to the branded /login.html page. The password lives only in env vars.
import crypto from 'node:crypto';

export const config = {
  matcher: ['/admin', '/admin.html'],
  runtime: 'nodejs',
};

function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

function isValidSession(token, secret) {
  if (!token) return false;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const exp = parseInt(payload, 10);
  return Number.isFinite(exp) && Date.now() < exp;
}

export default function middleware(request) {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
  const token = readCookie(request.headers.get('cookie'), 'cw_session');

  if (secret && isValidSession(token, secret)) {
    return; // authenticated – serve the dashboard
  }

  const url = new URL(request.url);
  const next = url.pathname;
  url.pathname = '/login.html';
  url.search = `?next=${encodeURIComponent(next)}`;
  return Response.redirect(url, 307);
}
