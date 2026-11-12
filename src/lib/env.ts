/**
 * True only for local development (`next dev`). Vercel production and preview
 * deployments, and `next start`, all run with NODE_ENV=production.
 * Use this to gate developer shortcuts that must never be reachable on the live site.
 */
export const isDevEnvironment = process.env.NODE_ENV !== "production";
