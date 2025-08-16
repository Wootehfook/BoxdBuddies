// AI Generated: GitHub Copilot - 2025-08-16
import { jsonResponse, corsHeaders } from "../_lib/common";

export async function onRequestGet(context) {
  const { env } = context;
  const hasTMDB = Boolean(env.TMDB_API_KEY && String(env.TMDB_API_KEY).length > 0);
  const hasKV = Boolean(env.MOVIES_KV);
  return jsonResponse({
    status: "ok",
    service: "pages",
    tmdb: hasTMDB ? "configured" : "missing",
    kv: hasKV ? "bound" : "missing",
    time: new Date().toISOString(),
  });
}

export async function onRequestOptions() {
  return new globalThis.Response(null, { headers: corsHeaders });
}
