# Decision review

When sources disagree, the agent can propose how the disagreement resolves, but
it cannot settle it. Its `record_decision` tool writes a proposal, and a person
reviews it in the Studio under **Decisions → Awaiting review**.

![A proposal in the Studio, approved](screenshots/studio-approve-toast.png)

- **Approve** marks the decision approved and its contradiction resolved in one
  transaction, so the two can never disagree about whether a question is
  settled. From then on `check_applicability` returns it as settled and the
  agent leads with that answer instead of reopening the question.
- **Reject** leaves the contradiction open.
- While a proposal waits, the agent sees it and does not propose the same thing
  again. The tool also refuses a claim that is not one of the contradiction's
  two, and a contradiction that is already settled. Every refusal comes back as
  a result with a reason rather than an error, so the agent can say what
  happened.

Both actions work on the published document, so a decision with unpublished
edits has to be published or discarded first. Otherwise a review would approve
text nobody has looked at.

The review step exists because the app is public. Without it, anyone chatting
with the agent could settle a question for everyone who asks after them.

## In the app

An unsettled contradiction appears under the answer with a button per side.
Pressing one asks the agent to propose that resolution, which it does only
after checking the choice against the sources and writing a rationale a
reviewer can check. The block then reads "In review" until someone approves it,
and "Resolved" after, with the rationale in place of the buttons.
