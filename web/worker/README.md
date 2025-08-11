# BoxdBuddies Cloudflare Worker

Minimal Worker powering the public demo endpoints.

Endpoints:

- `/` index + help
- `/healthz` liveness probe
- `/version` runtime + build info (placeholder version sync TBD)
- `/demo/common-movies` static illustrative payload

## Local Development

```bash
npm run worker:dev
```

## Deployment

```bash
npm run worker:deploy
```

(Requires CLOUDFLARE_API_TOKEN + account config via Wrangler auth.)

## Next Planned Enhancements

- Version sync with desktop app (shared version.json)
- Optional KV cache for static assets
- Real comparison proxy once backend API exposed
