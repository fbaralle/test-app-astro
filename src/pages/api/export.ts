import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals, url }) => {
  const { env } = locals.runtime;
  const exportId = url.searchParams.get("id");

  if (!exportId) {
    // List recent exports
    try {
      const list = await env.WEBFLOW_CLOUD_MEDIA.list({ prefix: "exports/", limit: 10 });
      const exports = list.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded.toISOString(),
      }));
      return new Response(JSON.stringify({ exports }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e instanceof Error ? e.message : "R2 error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Get specific export
  try {
    const object = await env.WEBFLOW_CLOUD_MEDIA.get(`exports/${exportId}`);
    if (!object) {
      return new Response(JSON.stringify({ error: "Export not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await object.text();
    return new Response(
      JSON.stringify({
        id: exportId,
        data: JSON.parse(data),
        metadata: {
          size: object.size,
          uploaded: object.uploaded.toISOString(),
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "R2 error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  const { env } = locals.runtime;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const exportId = `export-${Date.now()}`;
    const exportData = {
      id: exportId,
      createdAt: new Date().toISOString(),
      data: body,
    };

    await env.WEBFLOW_CLOUD_MEDIA.put(
      `exports/${exportId}`,
      JSON.stringify(exportData),
      {
        httpMetadata: {
          contentType: "application/json",
        },
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        id: exportId,
        url: `/api/export?id=${exportId}`,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "R2 error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
