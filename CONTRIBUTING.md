# Contributing

Thanks for looking. This started as a hackathon submission and is small on
purpose: one vehicle, one safety system, and a narrow set of guarantees it
tries to keep. Contributions are welcome, and the guardrails below exist so a
pull request does not end up arguing with the design.

## Before you start

Open an issue first for anything beyond a fix. It saves you writing code that
turns out to sit in [what is deliberately left out](#what-is-deliberately-left-out).

Setup and the data scripts are in the [README](README.md#installation). Short
version: `npm install`, fill `.env.local`, then `npm run import:nhtsa` followed
by `npm run seed`. The import must run first, because the seed reads what it
wrote.

## Running the checks

Everything a pull request needs to pass:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Tests use Node's own test runner, so there is nothing extra to install.

## Where things live

| Path | What it holds |
|---|---|
| `lib/agent/` | the agent loop, its prompt, its tools, and the checks run over an answer |
| `lib/sanity/` | queries and the clients that run them |
| `components/oracle/` | the interface, one CSS module per component |
| `sanity/` | schemas, the Studio's structure, and the review actions |
| `scripts/` | the NHTSA import and the curated seed |
| `tests/` | unit tests for the pure logic |
| `docs/` | the data, the Knowledge Base, decision review, deploying |

## What this project cares about

**Guarantees belong in code, not in the prompt.** Anything the README claims
the agent does, the citation check, the quote check, the refusal to settle a
contradiction on its own, is enforced in application code. If your change moves
one of those into prompt wording, it will be sent back. Ask the model to write
well; do not ask it to be trustworthy.

**A quote is checked against the document it names**, not against the Knowledge
Base, which is a synthesis and paraphrases freely. See
[docs/data.md](docs/data.md) for how a quote is pinned to a revision.

**Say why in a comment, not what.** The code shows what it does. Comments are
for the reason it is that way, the bug that shaped it, or the thing that looks
wrong and is not.

**Pure logic gets a test.** Anything that decides whether an answer is
trustworthy belongs in a plain function under `lib/`, with a case in `tests/`.
Network calls, React wiring and the Studio are not worth mocking here.

**Prose is plain.** Comments, commits and docs read like a person wrote them,
no em dashes, no filler.

## Commits and pull requests

- One concern per commit. A subject line in the imperative, then a body that
  says why the change was made.
- Reference the issue: `Closes #12` or `Refs #12`.
- Branch, then open a pull request against `main`. Keep it small enough to read
  in one sitting.
- Never commit `.env.local` or a token. The dataset is public, so nothing
  private belongs in it either.

## Reporting a wrong answer

That is the most useful bug report this project can get. Include:

- the vehicle in the header, year, make, model and trim
- the question, word for word
- what the answer said and which ids it cited
- whether anything was flagged amber

Screenshots help. The sources panel and the lookup trail in the answer say what
the agent actually read, which is usually where the fault is.

## What is deliberately left out

Not oversights, and a pull request adding one will likely be declined:

- **Authentication or rate limiting on the demo.** It is public by design, and
  the only write path is gated by human review.
- **Fuzzy or approximate quote matching.** Exact containment is the point. A
  looser match trades one failure mode for a quieter one.
- **Contradictions fed into the Knowledge Base.** They are left out so Context
  has to find conflicts in the sources rather than read ours back to us.
- **An agent that settles its own proposals.** A person approves every decision
  in the Studio. That is the design, not a missing feature.

## License

By contributing you agree your work is licensed under the [MIT License](LICENSE).
