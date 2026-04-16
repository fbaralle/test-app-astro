import type { APIRoute } from "astro";

interface Favorite {
  id: number;
  user_id: string;
  coin_id: string;
  coin_name: string | null;
  coin_symbol: string | null;
  coin_image: string | null;
  created_at: number;
}

export const GET: APIRoute = async ({ locals, url }) => {
  const env = locals.runtime.env as unknown as Record<string, unknown>;
  const db = env.DB as { prepare: (sql: string) => { bind: (...args: unknown[]) => { all: <T>() => Promise<{ results: T[] }> } } };
  const userId = url.searchParams.get("user_id") || "public";

  try {
    const { results } = await db.prepare(
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
  const env = locals.runtime.env as unknown as Record<string, unknown>;
  const db = env.DB as { prepare: (sql: string) => { bind: (...args: unknown[]) => { run: () => Promise<void> } } };

  try {
    const body = (await request.json()) as {
      user_id?: string;
      coin_id?: string;
      coin_name?: string;
      coin_symbol?: string;
      coin_image?: string;
    };
    const { user_id = "public", coin_id, coin_name, coin_symbol, coin_image } = body;

    if (!coin_id) {
      return new Response(JSON.stringify({ error: "coin_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db.prepare(
      "INSERT OR IGNORE INTO favorites (user_id, coin_id, coin_name, coin_symbol, coin_image, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(user_id, coin_id, coin_name || null, coin_symbol || null, coin_image || null, Date.now())
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
  const env = locals.runtime.env as unknown as Record<string, unknown>;
  const db = env.DB as { prepare: (sql: string) => { bind: (...args: unknown[]) => { run: () => Promise<void> } } };
  const userId = url.searchParams.get("user_id") || "public";
  const coinId = url.searchParams.get("coin_id");

  if (!coinId) {
    return new Response(JSON.stringify({ error: "coin_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await db.prepare(
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
