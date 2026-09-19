# TSB Oracle

Answers automotive Technical Service Bulletin, recall and repair questions with
source-linked, contradiction-aware answers.

Most repair advice for a given symptom is contradictory. A bulletin says one
thing, a revised bulletin two years later says another, and an owner on a forum
says neither worked. TSB Oracle retrieves all of it, shows the conflicts side by
side with their sources, explains why they conflict, and records the resolution
so it persists for later queries.

Demo dataset covers one vehicle: 2017 to 2022 Honda CR-V, CVT transmission
shudder.

## Stack

- Next.js 16 (App Router), TypeScript, Tailwind 4
- Sanity for structured content, Studio embedded at `/studio`
- Sanity Context MCP for knowledge retrieval
- Vercel AI SDK for the tool-calling agent loop, Anthropic model

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill in `SANITY_API_TOKEN` and `ANTHROPIC_API_KEY` in `.env.local` before
starting. The app runs at http://localhost:3000 and the Studio at
http://localhost:3000/studio.

Sanity project ID: `e72p6sym`, dataset `production` (public).

## Status

Under construction. Setup steps, Context MCP ingestion and example questions
land as the build progresses.
