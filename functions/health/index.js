// AI Generated: GitHub Copilot - 2025-08-17
import { jsonResponse, corsHeaders } from "../_lib/common";

export async function onRequestGet(context) {
  const { env } = context;
  const hasTMDB = Boolean(
    env.TMDB_API_KEY && String(env.TMDB_API_KEY).length > 0
  );
  const hasKV = Boolean(env.MOVIES_KV);
  const hasDB = Boolean(env.MOVIES_DB);

  return jsonResponse({
    status: "ok",
    service: "pages",
    project: "boxdbuddy",
    tmdb: hasTMDB ? "configured" : "missing",
    kv: hasKV ? "bound" : "missing",
    database: hasDB ? "bound" : "missing",
    time: new Date().toISOString(),
    version: "1.1.0",
  });
}

export async function onRequestOptions() {
  return new globalThis.Response(null, { headers: corsHeaders });
}
