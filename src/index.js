const ALLOWED_ORIGINS = [
  "https://sba-schulbank.lukas-lalli.workers.dev"
];

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowed = ALLOWED_ORIGINS.includes(origin);
    const headers = allowed ? corsHeaders(origin) : {};

    if (request.method === "OPTIONS") {
      if (!allowed) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers });
    }

    if (origin && !allowed) {
      return Response.json({ error: "Origin not allowed" }, {
        status: 403
      });
    }

    if (url.pathname === "/api/status" && request.method === "GET") {
      try {
        const result = await env.DB.prepare("SELECT 1 AS connection").first();

        return Response.json({
          system: "SBA DEV",
          status: "online",
          database: result?.connection === 1 ? "connected" : "error"
        }, { headers });
      } catch {
        return Response.json({
          system: "SBA DEV",
          status: "error",
          database: "disconnected"
        }, { status: 500, headers });
      }
    }

    if (url.pathname === "/api/tenants" && request.method === "GET") {
      try {
        const result = await env.DB.prepare(`
          SELECT id, name, bank_code, status
          FROM tenants
          ORDER BY name
        `).all();

        return Response.json({
          system: "SBA DEV",
          count: result.results.length,
          tenants: result.results
        }, { headers });
      } catch {
        return Response.json({
          error: "Schulbanken konnten nicht geladen werden."
        }, { status: 500, headers });
      }
    }

    return Response.json({
      error: "API route not found",
      system: "SBA DEV"
    }, { status: 404, headers });
  }
};
