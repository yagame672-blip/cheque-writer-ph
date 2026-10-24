// Vercel Routing Middleware – pinoprotektahan ang admin dashboard gamit ang HTTP Basic Auth.
// Ang credentials ay nasa Vercel environment variables (hindi nakikita sa browser):
//   ADMIN_USER     – username (default: "admin")
//   ADMIN_PASSWORD – password (required; kapag wala, naka-lock ang dashboard)

export const config = {
  matcher: ['/admin', '/admin.html'],
};

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function unauthorized() {
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Cheque Writer PH Admin", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
}

export default function middleware(request) {
  const expectedUser = process.env.ADMIN_USER || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedPass) return unauthorized();

  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) return unauthorized();

  let decoded;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }
  const sep = decoded.indexOf(':');
  if (sep === -1) return unauthorized();

  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);
  const userOk = safeEqual(user, expectedUser);
  const passOk = safeEqual(pass, expectedPass);
  if (!(userOk && passOk)) return unauthorized();

  // Walang ibinalik = ituloy sa static na admin.html
}
