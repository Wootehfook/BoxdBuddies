/// <reference lib="webworker" />
// AI Generated: GitHub Copilot - 2025-08-10
// Cloudflare Worker entrypoint for BoxdBuddies web demo
// Provides health, version, and simple demo endpoints. No sensitive data.

export interface Env {
  ENVIRONMENT?: string;
  // Future bindings (KV, D1, R2) can be declared here
}

interface VersionInfo {
  name: string;
  version: string;
  description: string;
  environment: string;
  timestamp: string;
}

function buildVersion(env: Env): VersionInfo {
  return {
    name: "BoxdBuddies Demo Worker",
    version: "1.0.0", // TODO: sync with root version.json in Next Step 3
    description: "API surface for Cloudflare-hosted demo (static placeholder).",
    environment: env.ENVIRONMENT || "development",
    timestamp: new Date().toISOString(),
  };
}

function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...init.headers,
    },
    status: init.status || 200,
  });
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '');

  // Basic routing
  switch (path) {
    case '':
    case '/':
      return new Response(
        `BoxdBuddies Demo Worker\n\nEndpoints:\n  /healthz\n  /version\n  /demo/common-movies\n`,
        { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    case '/healthz':
      return jsonResponse({ status: 'ok', service: 'boxdbuddies-worker' });
    case '/version':
      return jsonResponse(buildVersion(env));
    case '/demo/common-movies':
      // Placeholder deterministic sample payload
      return jsonResponse({
        friends: ['alice', 'bob', 'carol'],
        common_count: 3,
        movies: [
          { title: 'Inception', year: 2010 },
          { title: 'Arrival', year: 2016 },
          { title: 'Spider-Man: Into the Spider-Verse', year: 2018 }
        ],
        note: 'Static sample - real comparison only in desktop app for now.'
      });
    default:
      return jsonResponse({ error: 'Not Found', path }, { status: 404 });
  }
}

export default {
  fetch: (request: Request, env: Env) =>
    handleRequest(request, env).catch(err =>
      jsonResponse(
        { error: 'internal_error', message: err?.message || 'Unknown error' },
        { status: 500 }
      )
    ),
};
