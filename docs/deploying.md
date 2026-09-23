# Deploying

The app runs on Vercel's free tier, built from `main` on every push. The
default Next.js settings work, with no `vercel.json`.

## Environment variables

All six, in the Production environment:

| Name | What breaks without it |
|---|---|
| `ANTHROPIC_API_KEY` | no answers at all |
| `SANITY_CONTEXT_MCP_URL` | falls back to local fixtures, silently |
| `SANITY_ORGANIZATION_TOKEN` | same |
| `SANITY_API_TOKEN` | proposals cannot be written |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | nothing loads |
| `NEXT_PUBLIC_SANITY_DATASET` | nothing loads |

Paste each value into an empty field. Pasting into the middle of an existing
value left the Context URL nested inside itself, and the only sign was a 404
from the Knowledge Base endpoint in the function log, with a URL that read
`.../m` followed by the whole URL again followed by `cp/tsb-oracle`.

## CORS

The sources panel reads Sanity from the browser, so the deployed address has to
be added under the project's API settings at sanity.io/manage. Until it is, the
panel shows an error and the rest of the app works.

Leave **Allow credentials** off. The panel makes unauthenticated reads and
proposals are written server side with the API token, so nothing needs a
session. Credentials would let any script on that origin act as a signed-in
Studio user. The cost is that the Studio at `/studio` on the deployed domain
cannot sign in, which is fine: review happens in the local Studio.

## Function duration

The chat route declares `maxDuration = 300`. An answer takes several retrieval
steps and around a minute, and a host default measured in seconds would cut
every answer short mid-stream.

## Spend

Every question is a live model call. Keep auto-reload off on the API key, so
the prepaid balance is the ceiling and a public link cannot run up a bill.
