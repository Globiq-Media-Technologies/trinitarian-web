export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Serve index.html for all routes that need client-side handling
    if (path === '/' || path === '' || 
        path === '/reset-password' ||
        path.startsWith('/reset-password')) {
      return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    }
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
