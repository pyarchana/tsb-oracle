# TSB Oracle

Answers automotive Technical Service Bulletin, recall and repair questions with
source-linked, contradiction-aware answers.

Most repair advice for a given symptom is contradictory. A bulletin names a
cause and its revision a week later drops it, an investigation covers more model
years than the fix does, and owners say the dealer called it normal. TSB Oracle
retrieves all of it, shows the conflicts side by side with their sources,
explains why they conflict, and records the resolution so it persists for later
queries.

The dataset covers one vehicle and one safety system: unexpected automatic
emergency braking (Honda's CMBS) on the 2017 to 2022 Honda CR-V.

## Data

Every source document comes from NHTSA's public records.
`scripts/import-nhtsa.ts` pulls them from [api.nhtsa.gov](https://api.nhtsa.gov),
which needs no key: Honda's service bulletins, dealer messages and owner
letters, NHTSA's investigations, and two owner complaints. Each document links
to its NHTSA record in `sourceUrl`, and rerunning the import refreshes them in
place.

`scripts/seed.ts` adds the curated layer on top: which bulletin version is
current, which trim a bulletin leaves out, and the claims and contradictions the
agent reasons over. Every claim carries the exact words it rests on.

The text of each document is the summary NHTSA publishes for that record.
Honda's bulletins are Honda's copyright, so the claims quote them briefly and
the documents link to the copy NHTSA hosts instead of storing it. Owner
complaints keep the narrative and drop the partial VIN and town NHTSA publishes
with them.

This is not repair advice. The records are as of the date each document was
retrieved (`retrievedAt`), and NHTSA's investigation EA24-002 was still open at
that point. Whether a bulletin applies to a particular car is decided by a
dealer's VIN check.

## Stack

- Next.js 16 (App Router), TypeScript, Tailwind 4
- Sanity for structured content, Studio embedded at `/studio`
- Sanity Context MCP for knowledge retrieval
- Vercel AI SDK for the tool-calling agent loop, Anthropic model

## Setup

```bash
npm install
cp .env.example .env.local
npm run import:nhtsa
npm run seed
npm run dev
```

Fill in `SANITY_API_TOKEN` and `ANTHROPIC_API_KEY` in `.env.local` before
importing. The app runs at http://localhost:3000 and the Studio at
http://localhost:3000/studio.

Sanity project ID: `e72p6sym`, dataset `production` (public).

## Status

Under construction. Setup steps, Context MCP ingestion and example questions
land as the build progresses.
