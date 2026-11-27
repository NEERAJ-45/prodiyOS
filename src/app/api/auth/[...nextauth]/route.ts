import { NextRequest } from 'next/server';
import { handlers } from '@/auth';

// Behind a proxy (e.g. GitHub Codespaces port forwarding) Next builds req.url from
// the local host, so Auth.js would emit localhost callback URLs. Use the forwarded
// origin when present so redirects and callback cookies point at the public URL.
function withForwardedOrigin(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  if (!host) return req;
  const origin = `${proto.split(',')[0].trim()}://${host.split(',')[0].trim()}`;
  const url = new URL(req.url);
  if (url.origin === origin) return req;
  return new NextRequest(req.url.replace(url.origin, origin), req);
}

export const GET = (req: NextRequest) => handlers.GET(withForwardedOrigin(req));
export const POST = (req: NextRequest) => handlers.POST(withForwardedOrigin(req));
