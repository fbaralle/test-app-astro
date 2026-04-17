import type { APIRoute } from "astro";

interface FeatureFlags {
  [key: string]: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  dark_mode: true,
  show_favorites: true,
  show_exports: true,
  show_page_views: true,
  experimental_features: false,
};

export const GET: APIRoute = async ({ locals }) => {
  try {
    const env = locals.runtime?.env as unknown as Record<string, unknown> | undefined;
    const kv = env?.FLAGS as KVNamespace | undefined;

    if (!kv) {
      return new Response(
        JSON.stringify({ error: "FLAGS KV binding not available", flags: DEFAULT_FLAGS }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get all flags from KV
    const flags: FeatureFlags = { ...DEFAULT_FLAGS };

    for (const key of Object.keys(DEFAULT_FLAGS)) {
      const value = await kv.get(`flag:${key}`);
      if (value !== null) {
        flags[key] = value === "true";
      }
    }

    return new Response(JSON.stringify({ flags }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "KV error", flags: DEFAULT_FLAGS }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const env = locals.runtime?.env as unknown as Record<string, unknown> | undefined;
    const kv = env?.FLAGS as KVNamespace | undefined;

    if (!kv) {
      return new Response(
        JSON.stringify({ error: "FLAGS KV binding not available" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = (await request.json()) as { flag: string; value: boolean };
    const { flag, value } = body;

    if (!flag || typeof value !== "boolean") {
      return new Response(
        JSON.stringify({ error: "flag (string) and value (boolean) are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!(flag in DEFAULT_FLAGS)) {
      return new Response(
        JSON.stringify({ error: `Unknown flag: ${flag}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await kv.put(`flag:${flag}`, String(value));

    return new Response(JSON.stringify({ success: true, flag, value }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "KV error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
