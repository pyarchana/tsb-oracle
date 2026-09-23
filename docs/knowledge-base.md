# The Knowledge Base

The agent reads the dataset two ways. `check_applicability` queries it directly
with GROQ for the structured part: which documents cover a model year and trim,
and which contradictions touch them. Sanity Context distills the same documents
into a Knowledge Base the agent reads over MCP for the wording.

Setting it up happens in Sanity, not in code.

1. In [sanity.io/manage](https://www.sanity.io/manage), open the organization,
   go to **Labs**, and turn on Context and then Knowledge Bases.
2. In the dashboard, open **Context**, create a Knowledge Base, and give it this
   purpose:

   ```
   Answer questions from Honda CR-V owners and technicians about unexpected automatic emergency braking (Honda's Collision Mitigation Braking System, CMBS) on 2017 to 2022 models: whether a fix exists for their car, which bulletin version is current, and what NHTSA's investigation covers.
   Lead with: Honda service bulletins and how their versions differ, NHTSA investigations and their scope by model year, which model years and trims each remedy covers, and where sources disagree about the cause.
   Leave out: warning lights and radar faults that are not unexpected braking, such as cold-weather radar blockage, other vehicle systems, and anything beyond what an owner complaint itself reports.
   Report what each source states and who said it. Do not infer why NHTSA or Honda took an action unless a source says so.
   ```

   The last line was added after a build stated a reason NHTSA opened its
   investigation that no source gives.
3. Add the dataset as a source with the types `tsb` and `claim`, and unfold the
   claim's `source` reference so each claim carries its document's id.
   `contradiction` is left out on purpose, so the Knowledge Base has to find
   conflicts in the sources on its own instead of reading ours.
4. Build the entries, then work through **Issues**. Resolutions are kept and
   applied to every later build.
5. Create an MCP endpoint that serves the Knowledge Base, and put its URL in
   `.env.local` as `SANITY_CONTEXT_MCP_URL`.
6. In the organization's **API** settings, create a token with the Context
   Viewer role only, and put it in `.env.local` as `SANITY_ORGANIZATION_TOKEN`.
   A project token is refused with `contextGrantRequired`.

## What the build found

The first builds raised four issues, all real. NHTSA's summary of bulletin
A18-006 writes "OTC" and "MIO" where the codes and display are a DTC and the
MID, and two entries merged NHTSA's complaint counts with its per-vehicle
totals (31 crashes alleged in complaints against 47 across all reports, 50
injuries against 93). Each was resolved in favor of the reading the source
supports.

None of the curated claims conflicted, because each one says who made the
statement it records. A claim that says "version 1 of the bulletin says X" does
not flatly contradict "version 2 says Y". Staging a conflict to make the
feature fire would have proved nothing.

## Why quotes are checked against the dataset, not the entries

Knowledge Base entries are syntheses. The builder merges several documents into
one topic entry, paraphrases them, and attaches footnotes. That is useful for
retrieval and wrong for quotation: a phrase can sit in an entry that no source
ever used. So quoted words in an answer are checked against the dataset's own
copy of the cited document, which is verbatim.
