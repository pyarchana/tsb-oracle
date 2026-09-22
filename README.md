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
http://localhost:3000/studio. Until the two Context variables below are set,
the agent reads local fixtures in `lib/context-mcp/fixtures.ts` instead of the
Knowledge Base, and logs a warning saying so.

Sanity project ID: `e72p6sym`, dataset `production` (public).

## Knowledge Base

The agent reads the dataset two ways. `check_applicability` queries it
directly with GROQ for the structured part: which documents cover a model year
and trim, and which contradictions touch them. Sanity Context distills the same
documents into a Knowledge Base the agent reads over MCP for the wording.
Setting it up is done in Sanity, not in code.

1. In [sanity.io/manage](https://www.sanity.io/manage), open the
   organization, go to **Labs**, and turn on Context and then Knowledge Bases.
2. In the dashboard, open **Context**, create a Knowledge Base, and give it
   this purpose:

   ```
   Answer questions from Honda CR-V owners and technicians about unexpected automatic emergency braking (Honda's Collision Mitigation Braking System, CMBS) on 2017 to 2022 models: whether a fix exists for their car, which bulletin version is current, and what NHTSA's investigation covers.
   Lead with: Honda service bulletins and how their versions differ, NHTSA investigations and their scope by model year, which model years and trims each remedy covers, and where sources disagree about the cause.
   Leave out: warning lights and radar faults that are not unexpected braking, such as cold-weather radar blockage, other vehicle systems, and anything beyond what an owner complaint itself reports.
   Report what each source states and who said it. Do not infer why NHTSA or Honda took an action unless a source says so.
   ```

   The last line was added after a build stated a reason NHTSA opened its
   investigation that no source gives.
3. Add the dataset as a source with the types `tsb` and `claim`, and unfold
   the claim's `source` reference so each claim carries its document's id.
   `contradiction` is left out on purpose, so the Knowledge Base has to find
   conflicts in the sources on its own instead of reading ours.
4. Build the entries, then work through **Issues**. Resolutions are kept and
   applied to every later build.
5. Create an MCP endpoint that serves the Knowledge Base, and put its URL in
   `.env.local` as `SANITY_CONTEXT_MCP_URL`.
6. In the organization's **API** settings, create a token with the Context
   Viewer role only, and put it in `.env.local` as
   `SANITY_ORGANIZATION_TOKEN`. A project token is refused with
   `contextGrantRequired`.

The first builds raised four issues, all real. NHTSA's summary of bulletin
A18-006 writes "OTC" and "MIO" where the codes and display are a DTC and the
MID, and two entries merged NHTSA's complaint counts with its per-vehicle
totals (31 crashes alleged in complaints against 47 across all reports, 50
injuries against 93). Each was resolved in favor of the reading the source
supports. None of our curated claims conflicted, since each one says who made
the statement it records.

## Decisions

When sources disagree, the agent can propose how the disagreement resolves,
but it cannot settle it. Its `record_decision` tool writes a proposal, and a
person reviews it in the Studio under **Decisions → Awaiting review**.

- **Approve** marks the decision approved and its contradiction resolved in one
  transaction. From then on `check_applicability` returns it as settled, and
  the agent leads with that answer instead of reopening the question.
- **Reject** leaves the contradiction open.
- While a proposal waits, the agent sees it and does not propose the same thing
  again. The tool also refuses a claim that is not one of the contradiction's
  two, and a contradiction that is already settled.

The review step exists because the app may be public. Without it, anyone
chatting with the agent could settle a question for everyone who asks after
them. Rerunning `npm run seed` updates contradictions but keeps the status a
review gave them.

## Status

Under construction. The UI and example questions land as the build progresses.
