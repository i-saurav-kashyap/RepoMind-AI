# RepoMind AI

> AI-powered GitHub Repository Intelligence Platform — understand any codebase in minutes, not weeks.

Paste a public GitHub repository URL and RepoMind fetches it, reads the high-signal files, and returns a complete intelligence report: architecture diagram, folder-by-folder explanations, dependency analysis, design-pattern detection, a heuristic code-quality report, a learning roadmap, an exportable onboarding guide, and a repo-aware AI chat assistant.

This is a **working vertical slice** of the full product spec — a real end-to-end flow you can run locally today, built so the heavier production pieces (NestJS services, Redis/BullMQ queue, Postgres + pgvector RAG) slot in without rearchitecting.

## Stack

| Layer | This slice | Production target (drop-in) |
|------|-----------|------------------------------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind | same |
| Backend | Next.js route handlers | NestJS microservice (logic already isolated in `src/lib`) |
| Data fetch | GitHub REST API | + git clone worker for private/deep analysis |
| AI | Anthropic Claude via `src/lib/ai` (provider-agnostic) | + OpenAI backend behind same interface |
| DB | Prisma + SQLite | Prisma + PostgreSQL |
| Queue | inline background promise | BullMQ + Redis worker calling `runAnalysis()` |
| RAG | full-context prompting | pgvector embeddings store |

## Getting started

```bash
cd repomind-ai
npm install

# configure secrets
cp .env.example .env
#  → add ANTHROPIC_API_KEY (required)
#  → add GITHUB_TOKEN (optional, lifts rate limit 60 → 5000/hr)

# create the local SQLite database
npm run db:push

# run
npm run dev
```

Open http://localhost:3000, paste a repo (try `vercel/next.js`), and watch the analysis run.

## How it works

```
URL ─▶ POST /api/analyze ─▶ create Analysis row ─▶ runAnalysis() [background]
                                                      │
              GitHub REST API ◀───── fetchRepoSnapshot (meta, languages, tree, key files)
                                                      │
              Claude (one structured call) ◀───── buildAnalysisPrompt(context)
                                                      │
                                            persist AnalysisResult JSON
client polls GET /api/analysis/[id] ─▶ status ─▶ COMPLETED ─▶ render Dashboard
chat: POST /api/chat ─▶ streamed Claude answer grounded in the stored repo context
```

### Key files

- `src/lib/github.ts` — repository ingestion via the GitHub API
- `src/lib/ai/provider.ts` — provider-agnostic LLM client (complete / completeJSON / streamChat)
- `src/lib/ai/prompts.ts` — context compression + analysis & chat prompts
- `src/lib/analyzer.ts` — orchestration (the unit a BullMQ worker would run)
- `src/components/dashboard/` — the 11-tab intelligence dashboard
- `prisma/schema.prisma` — data model (SQLite dev → Postgres prod)

## Roadmap to the full spec

- [ ] Auth (email + Google + GitHub OAuth) and per-user saved reports
- [ ] BullMQ + Redis worker so analysis survives serverless cold-starts
- [ ] Postgres + pgvector with chunk-level embeddings for true RAG over file contents
- [ ] Deep clone + AST parsing for precise complexity/coverage metrics
- [ ] Repository comparison and re-analysis diffing
- [ ] React Flow / D3 interactive dependency and class graphs

## License

MIT — portfolio/demo project.
