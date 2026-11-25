// Serves the funnel videos, posters and captions from the private R2 bucket bound as VIDEO.
// The bucket has no public URL; this route is the only way in.
// HTTP Range is supported so the player can seek without downloading the whole file.
// Add ?probe=1 to ask "is this file there?" and always get a 200 JSON answer. The pages use
// that to keep a video slot hidden until its file is uploaded, with no 404 in the console.

const NAME = /^[a-z0-9][a-z0-9_-]{1,79}\.(mp4|webm|jpg|jpeg|png|webp|vtt)$/;

const TYPES = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  vtt: 'text/vtt; charset=utf-8',
};

// Short cache plus an ETag: a re-uploaded edit shows up within minutes, and repeat views revalidate cheaply.
const CACHE = 'public, max-age=300, must-revalidate';

const notFound = () =>
  new Response('Not found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive' },
  });

const json = (body) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive' },
  });

export function parseRange(header, size) {
  if (!header) return { status: 200, start: 0, end: size - 1 };
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === '' && m[2] === '')) return { status: 200, start: 0, end: size - 1 };
  let start;
  let end;
  if (m[1] === '') {
    const n = parseInt(m[2], 10);
    if (!(n > 0)) return { status: 416 };
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = parseInt(m[1], 10);
    end = m[2] === '' ? size - 1 : Math.min(parseInt(m[2], 10), size - 1);
  }
  if (start >= size || start > end) return { status: 416 };
  return { status: 206, start, end };
}

async function handle({ request, env, params }) {
  const key = String(params.file || '');
  const probe = new URL(request.url).searchParams.get('probe') === '1';
  const valid = NAME.test(key);

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD, OPTIONS' } });
  }
  if (!valid || !env.VIDEO) return probe ? json({ exists: false }) : notFound();

  const head = await env.VIDEO.head(key);
  if (probe) return json(head && head.size > 0 ? { exists: true, size: head.size } : { exists: false });
  if (!head || !(head.size > 0)) return notFound();

  const size = head.size;
  const ext = key.slice(key.lastIndexOf('.') + 1);
  const headers = new Headers({
    'Content-Type': TYPES[ext],
    'Accept-Ranges': 'bytes',
    'Cache-Control': CACHE,
    ETag: head.httpEtag,
    'Last-Modified': head.uploaded.toUTCString(),
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'X-Content-Type-Options': 'nosniff',
  });

  const rangeHeader = request.headers.get('range');
  const ifRange = request.headers.get('if-range');
  // A Range tied to an older copy of the file gets the whole new file instead.
  const useRange = rangeHeader && (!ifRange || ifRange === head.httpEtag);

  if (!useRange && request.headers.get('if-none-match') === head.httpEtag) {
    return new Response(null, { status: 304, headers });
  }

  const r = parseRange(useRange ? rangeHeader : null, size);
  if (r.status === 416) {
    headers.set('Content-Range', `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }

  const length = r.end - r.start + 1;
  headers.set('Content-Length', String(length));
  if (r.status === 206) headers.set('Content-Range', `bytes ${r.start}-${r.end}/${size}`);

  if (request.method === 'HEAD') return new Response(null, { status: r.status, headers });

  const obj = await env.VIDEO.get(key, r.status === 206 ? { range: { offset: r.start, length } } : undefined);
  if (!obj) return notFound();
  return new Response(obj.body, { status: r.status, headers });
}

// The files are public read-only media, and the funnel on other hosts (the AI Studio site) loads
// them from this origin, so every answer carries CORS headers. Range and Content-Range stay exposed
// so the player can seek.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
  'Cross-Origin-Resource-Policy': 'cross-origin',
};

export async function onRequest(ctx) {
  if (ctx.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...CORS,
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, If-Range, If-None-Match, If-Modified-Since, Content-Type',
        'Access-Control-Max-Age': '86400',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }
  const res = await handle(ctx);
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
