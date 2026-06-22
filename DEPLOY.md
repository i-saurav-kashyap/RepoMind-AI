# Deploying RepoMind AI to Vercel

The app is a Next.js full-stack project (API routes + Prisma + Postgres + Claude).
GitHub Pages can't host it (no server). Vercel can, on the free tier. ~10 minutes.

## Step 1 — Create a free Postgres database (Neon)

1. Go to **https://neon.tech** → sign up (free) → **Create project**.
2. After it's created, open **Dashboard → Connect** (or "Connection Details").
3. Copy **two** connection strings:
   - **Pooled** connection (host contains `-pooler`) → this is your `DATABASE_URL`
   - **Direct** connection (no `-pooler`) → this is your `DIRECT_URL`
   - If you only see one, use it for both.

> Alternative: in Vercel you can add **Storage → Postgres** instead; it auto-injects the env vars and you can skip pasting them.

## Step 2 — Import the repo into Vercel

1. Go to **https://vercel.com** → sign in **with GitHub**.
2. **Add New… → Project** → import **`i-saurav-kashyap/RepoMind-AI`**.
3. Framework preset auto-detects **Next.js**. Leave build/output settings as default
   (the repo's `build` script handles `prisma generate` + `prisma db push`).

## Step 3 — Set environment variables

In the import screen (or **Project → Settings → Environment Variables**), add:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | your real key from https://console.anthropic.com |
| `DATABASE_URL` | Neon **pooled** URL |
| `DIRECT_URL` | Neon **direct** URL |
| `GITHUB_TOKEN` | *(optional)* a token with `repo` scope to analyze private repos & lift rate limits |
| `ANALYSIS_MODEL` | *(optional)* defaults to `claude-sonnet-4-6` |
| `CHAT_MODEL` | *(optional)* defaults to `claude-sonnet-4-6` |

Apply them to **Production, Preview, and Development**.

## Step 4 — Deploy

Click **Deploy**. The build runs `prisma db push` (creates the tables in Neon) then
builds Next.js. When it finishes you'll get a live URL like
`https://repo-mind-ai.vercel.app`.

Every `git push` to `main` auto-deploys.

## Notes & limits

- **Function duration:** Vercel Hobby caps serverless functions at **60s**. Analysis of
  small/medium repos finishes well within that; very large repos may time out. The
  background work uses Next's `after()` so it keeps running until the response window
  closes. On Vercel **Pro** you can raise `maxDuration` in `src/app/api/analyze/route.ts`.
- **Cost:** Vercel Hobby + Neon free tier = $0. You only pay Anthropic for tokens used.
- **Custom domain:** Project → Settings → Domains.

## Running locally against the same DB

Put the Neon URLs (and your `ANTHROPIC_API_KEY`) in `.env`, then:

```bash
npm run db:push   # one-time: create tables
npm run dev
```
