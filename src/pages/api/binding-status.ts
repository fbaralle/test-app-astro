import type { APIRoute } from "astro";

interface ServiceStatus {
  status: "ok" | "error";
  latency: number;
  error?: string;
}

interface HealthcheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    d1: ServiceStatus;
    kv_sessions: ServiceStatus;
    kv_flags: ServiceStatus;
    r2: ServiceStatus;
  };
  bindings?: string[];
}

async function checkD1(db: D1Database | undefined): Promise<ServiceStatus> {
  if (!db) {
    return { status: "error", latency: 0, error: "DB binding not available" };
  }
  const start = performance.now();
  try {
    await db.prepare("SELECT 1").first();
    return { status: "ok", latency: Math.round(performance.now() - start) };
  } catch (e) {
    return {
      status: "error",
      latency: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

async function checkKV(kv: KVNamespace | undefined, name: string): Promise<ServiceStatus> {
  if (!kv) {
    return { status: "error", latency: 0, error: `${name} binding not available` };
  }
  const start = performance.now();
  try {
    await kv.get("__healthcheck__");
    return { status: "ok", latency: Math.round(performance.now() - start) };
  } catch (e) {
    return {
      status: "error",
      latency: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

async function checkR2(r2: R2Bucket | undefined): Promise<ServiceStatus> {
  if (!r2) {
    return { status: "error", latency: 0, error: "R2 binding not available" };
  }
  const start = performance.now();
  try {
    await r2.head("__healthcheck__");
    return { status: "ok", latency: Math.round(performance.now() - start) };
  } catch (e) {
    return {
      status: "error",
      latency: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export const GET: APIRoute = async ({ locals }) => {
  // Debug: inspect locals structure
  const localsKeys = Object.keys(locals);

  // Get runtime and env with null safety - try multiple paths
  const runtime = locals.runtime as { env?: Record<string, unknown> } | undefined;
  const env = runtime?.env || (locals as unknown as Record<string, unknown>) || {};

  // Debug: list available bindings
  const availableBindings = Object.keys(env);
  const debugInfo = {
    localsKeys,
    hasRuntime: !!runtime,
    runtimeKeys: runtime ? Object.keys(runtime) : [],
    envKeys: availableBindings,
  };

  const [d1, kv_sessions, kv_flags, r2] = await Promise.all([
    checkD1(env.DB as D1Database | undefined),
    checkKV(env.SESSIONS as KVNamespace | undefined, "SESSIONS"),
    checkKV(env.FLAGS as KVNamespace | undefined, "FLAGS"),
    checkR2(env.MEDIA as R2Bucket | undefined),
  ]);

  const services = { d1, kv_sessions, kv_flags, r2 };
  const errorCount = Object.values(services).filter(
    (s) => s.status === "error"
  ).length;

  const status: HealthcheckResponse["status"] =
    errorCount === 0 ? "healthy" : errorCount < 3 ? "degraded" : "unhealthy";

  const response = {
    status,
    timestamp: new Date().toISOString(),
    services,
    bindings: availableBindings,
    debug: debugInfo,
  };

  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
};
