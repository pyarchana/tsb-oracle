/**
 * Enforces in code what the system prompt can only ask for: that every bulletin
 * number the agent cites came from something it actually retrieved.
 *
 * A citation is verified only when its id appears as a whole token in the tool
 * output from the same turn. Anything else is unverified, whether the model
 * invented it or recalled a real bulletin it never looked up this time. Both are
 * worth flagging to someone about to ask a dealer for that exact repair.
 */

/**
 * A source id in square brackets: uppercase segments joined by hyphens, with at
 * least one digit. The digit is what keeps [CR-V] from reading as a citation.
 * A bracket followed by an opening parenthesis is a markdown link, not a cite.
 */
const CITATION = /\[(?=[A-Z-]*\d)([A-Z0-9]+(?:-[A-Z0-9]+)+)\](?!\()/g

export interface Citation {
  id: string
  verified: boolean
}

/** Unique bulletin ids in the order they first appear. */
export function extractCitationIds(text: string): string[] {
  const seen = new Set<string>()
  for (const match of text.matchAll(CITATION)) {
    seen.add(match[1])
  }
  return [...seen]
}

export function classifyCitations(answer: string, retrieved: string[]): Citation[] {
  const corpus = retrieved.join('\n')
  return extractCitationIds(answer).map((id) => ({
    id,
    verified: appearsAsToken(corpus, id),
  }))
}

/**
 * Whole-token match, so a cited "20-04" is not verified by the "20-042" in a
 * retrieved document.
 */
function appearsAsToken(corpus: string, id: string): boolean {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^A-Z0-9-])${escaped}(?=[^A-Z0-9-]|$)`, 'i').test(corpus)
}
