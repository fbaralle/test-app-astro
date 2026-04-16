import type { APIRoute } from "astro";

const CACHE_TTL = 60; // 1 minute cache

export const GET: APIRoute = async ({ locals, url }) => {
  const { env } = locals.runtime;
  const key = url.searchParams.get("key") || "default";
  const cacheKey = `cache:${key}`;

  try {
    // Try to get from KV cache
    const cached = await env.SESSIONS.get(cacheKey);
    if (cached) {
      return new Response(
        JSON.stringify({
          data: JSON.parse(cached),
          cached: true,
          key,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate fresh data (simulated)
    const freshData = {
      timestamp: new Date().toISOString(),
      key,
      value: `Data for ${key} generated at ${Date.now()}`,
    };

    // Store in KV with TTL
    await env.SESSIONS.put(cacheKey, JSON.stringify(freshData), {
      expirationTtl: CACHE_TTL,
    });

    return new Response(
      JSON.stringify({
        data: freshData,
        cached: false,
        key,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Cache error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
