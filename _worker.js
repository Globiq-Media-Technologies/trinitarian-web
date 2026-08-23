export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Serve index.html for root
      if (path === '/' || path === '') {
        return env.ASSETS.fetch(new URL('/index.html', request.url).toString());
      }

      // Reset password - preserve query string
      if (path === '/reset-password' || path.startsWith('/reset-password')) {
        const indexUrl = new URL('/index.html', request.url);
        indexUrl.search = url.search;
        return env.ASSETS.fetch(indexUrl.toString());
      }

      // Verify email - preserve query string (same pattern as reset-password
      // above). This case was simply never added when this worker script was
      // first written - it predates the verify-email feature entirely - so
      // every request to this path fell through to the generic catch-all at
      // the bottom of this file instead, which does not preserve the path.
      if (path === '/verify-email' || path.startsWith('/verify-email')) {
        const indexUrl = new URL('/index.html', request.url);
        indexUrl.search = url.search;
        return env.ASSETS.fetch(indexUrl.toString());
      }

      // Direct sermon links (shared from the app) - same missing-route pattern
      // as verify-email above. The client-side JS already has full logic to
      // read /sermon/:id and open the right sermon once index.html loads; this
      // route was simply never added, so every shared link 404'd before ever
      // reaching that code.
      if (path.startsWith('/sermon/')) {
        return env.ASSETS.fetch(new URL('/index.html', request.url).toString());
      }

      // Pastor portal
      if (path === '/pastor' || path === '/pastor/') {
        return env.ASSETS.fetch(new URL('/pastor/index.html', request.url).toString());
      }

      // Privacy policy
      if (path === '/privacy' || path === '/privacy/') {
        return env.ASSETS.fetch(new URL('/privacy/index.html', request.url).toString());
      }

      // DMCA Policy
      if (path === '/dmca' || path === '/dmca/') {
        return env.ASSETS.fetch(new URL('/dmca/index.html', request.url).toString());
      }

      // Terms of service
      if (path === '/terms' || path === '/terms/') {
        return env.ASSETS.fetch(new URL('/terms/index.html', request.url).toString());
      }

      // Static files (sitemap, robots, favicon, og-image)
      if (['/sitemap.xml','/robots.txt','/favicon.png','/og-image.png'].includes(path)) {
        return env.ASSETS.fetch(request);
      }

      // Try to serve the asset, fall back to 404
      const response = await env.ASSETS.fetch(request);
      if (response.status === 404) {
        return env.ASSETS.fetch(new URL('/404.html', request.url).toString());
      }
      return response;
    } catch (e) {
      // Previously a thrown exception here produced Cloudflare's raw,
      // generic Error 1101 page with no useful detail at all. Logging the
      // actual error means any future issue shows up in Workers Logs with
      // enough detail to fix directly, instead of another opaque 500.
      console.error('Worker error:', e && e.stack ? e.stack : e);
      try {
        return env.ASSETS.fetch(new URL('/404.html', request.url).toString());
      } catch (e2) {
        return new Response('Something went wrong. Please try again.', { status: 500 });
      }
    }
  }
}
