export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Serve index.html for root
    if (path === '/' || path === '') {
      return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    }

    // Reset password - preserve query string
    if (path === '/reset-password' || path.startsWith('/reset-password')) {
      const indexUrl = new URL('/index.html', request.url);
      indexUrl.search = url.search;
      return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
    }

    // Pastor portal
    if (path === '/pastor' || path === '/pastor/') {
      return env.ASSETS.fetch(new Request(new URL('/pastor/index.html', request.url), request));
    }

    // Privacy policy
    if (path === '/privacy' || path === '/privacy/') {
      return env.ASSETS.fetch(new Request(new URL('/privacy/index.html', request.url), request));
    }

    // DMCA Policy
    if (path === '/dmca' || path === '/dmca/') {
      return env.ASSETS.fetch(new Request(new URL('/dmca/index.html', url).toString()), request);
    }

    // Terms of service
    if (path === '/terms' || path === '/terms/') {
      return env.ASSETS.fetch(new Request(new URL('/terms/index.html', request.url), request));
    }

    // Static files (sitemap, robots, favicon, og-image)
    if (['/sitemap.xml','/robots.txt','/favicon.png','/og-image.png'].includes(path)) {
      return env.ASSETS.fetch(request);
    }

    // Try to serve the asset, fall back to 404
    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status === 404) {
        return env.ASSETS.fetch(new Request(new URL('/404.html', request.url), request));
      }
      return response;
    } catch(e) {
      return env.ASSETS.fetch(new Request(new URL('/404.html', request.url), request));
    }
  }
}
