
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API ROUTE: This handles the AI logic
    if (url.pathname === '/api/analyze') {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      }

      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

      try {
        const body = await request.json();
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-beta': 'web-search-2025-03-05'
          },
          body: JSON.stringify(body)
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    // STATIC ASSETS: This serves your HTML
    // If you are using Cloudflare Pages, this line tells it to look for index.html
    return env.ASSETS.fetch(request);
  }
}; // <--- MAKE SURE THIS IS CLOSED
