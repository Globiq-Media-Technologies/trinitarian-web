export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/pastor' || path === '/pastor/') {
      return env.ASSETS.fetch(new Request(new URL('/pastor/index.html', request.url), request));
    }
    if (path === '/privacy' || path === '/privacy/') {
      return env.ASSETS.fetch(new Request(new URL('/privacy/index.html', request.url), request));
    }
    if (path === '/terms' || path === '/terms/') {
      return env.ASSETS.fetch(new Request(new URL('/terms/index.html', request.url), request));
    }
    return env.ASSETS.fetch(request);
  }
}
