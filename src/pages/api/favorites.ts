import type { APIRoute } from "astro";

interface Favorite {
  id: number;
  user_id: string;
  coin_id: string;
  created_at: number;
}

export const GET: APIRoute = async ({ locals, url }) => {
  const { env } = locals.runtime;
  const userId = url.searchParams.get("user_id") || "anonymous";

  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC"
    )
      .bind(userId)
      .all<Favorite>();

    return new Response(JSON.stringify({ favorites: results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Database error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  const { env } = locals.runtime;

  try {
    const body = (await request.json()) as { user_id?: string; coin_id?: string };
    const { user_id = "anonymous", coin_id } = body;

    if (!coin_id) {
      return new Response(JSON.stringify({ error: "coin_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await env.DB.prepare(
      "INSERT OR IGNORE INTO favorites (user_id, coin_id, created_at) VALUES (?, ?, ?)"
    )
      .bind(user_id, coin_id, Date.now())
      .run();

    return new Response(JSON.stringify({ success: true, coin_id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Database error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const DELETE: APIRoute = async ({ locals, url }) => {
  const { env } = locals.runtime;
  const userId = url.searchParams.get("user_id") || "anonymous";
  const coinId = url.searchParams.get("coin_id");

  if (!coinId) {
    return new Response(JSON.stringify({ error: "coin_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await env.DB.prepare(
      "DELETE FROM favorites WHERE user_id = ? AND coin_id = ?"
    )
      .bind(userId, coinId)
      .run();

    return new Response(JSON.stringify({ success: true, coin_id: coinId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Database error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
