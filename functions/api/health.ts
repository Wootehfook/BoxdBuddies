// AI Generated: GitHub Copilot - 2025-08-17
// Health check endpoint for API routing verification

export async function onRequest(context: { request: Request }) {
  const url = new URL(context.request.url);

  return new Response(
    JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
      project: "boxdbud",
      environment: "cloudflare-pages",
      path: url.pathname,
      method: context.request.method,
      functions_working: true,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
