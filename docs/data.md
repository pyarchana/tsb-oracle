# The data

Every source document comes from NHTSA's public records.
`scripts/import-nhtsa.ts` pulls them from [api.nhtsa.gov](https://api.nhtsa.gov),
which needs no key: Honda's service bulletins, dealer messages and owner
letters, NHTSA's investigations, and two owner complaints. Each document links
to its NHTSA record in `sourceUrl`, and rerunning the import refreshes them in
place.

`scripts/seed.ts` adds the curated layer on top: which bulletin version is
current, which trim a bulletin leaves out, and the claims and contradictions the
agent reasons over. Every claim carries the exact words it rests on. Rerunning
it is safe, and it keeps the status a review gave a contradiction.

Run the import before the seed.

## What is in a document

The text of each document is the summary NHTSA publishes for that record.
Honda's bulletins are Honda's copyright, so the claims quote them briefly and
the documents link to the copy NHTSA hosts instead of storing it. Owner
complaints keep the narrative and drop the partial VIN and town NHTSA publishes
with them.

Every title starts with the NHTSA id, which is what makes a citation checkable:
`MC-11035781`, `EA24-002`, `ODI-11679500`. The agent cites those ids and never
Sanity's internal ones, because the id has to survive being read out to a
dealer.

## Caveats

This is not repair advice. The records are as of the date each document was
retrieved (`retrievedAt`), and NHTSA's investigation EA24-002 was still open at
that point. Whether a bulletin applies to a particular car is decided by a
dealer's VIN check, not by this app.
