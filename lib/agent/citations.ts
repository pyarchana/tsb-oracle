/**
 * Enforces in code what the system prompt can only ask for: that every bulletin
 * number the agent cites came from something it actually retrieved, and that
 * every quote is in the document it is cited to.
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
export const CITATION = /\[(?=[A-Z-]*\d)([A-Z0-9]+(?:-[A-Z0-9]+)+)\](?!\()/g

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
 * A quote holds when its words appear in one of `texts`, which the caller picks:
 * the dataset's copy of the documents the quote is cited to, or, for a quote
 * with no citation, everything the agent retrieved.
 *
 * Knowledge Base entries are no substitute for the cited document. The builder
 * writes each entry as a synthesis of several documents, partly in its own
 * words, so a phrase can sit in an entry that no source ever used, and a real
 * phrase from one document can sit beside another document's id.
 *
 * An ellipsis marks words left out, so each piece is looked for on its own.
 */
export function quoteAppearsIn(quote: string, texts: string[]): boolean {
  const pieces = normalize(quote)
    .split(/\.\.\.|\u2026/)
    .map((piece) => piece.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ''))
    .filter((piece) => piece.length > 1)
  if (pieces.length === 0) return true

  return texts.some((text) => {
    const haystack = normalize(text)
    return pieces.every((piece) => haystack.includes(piece))
  })
}

/**
 * Case, curly quotes, line breaks and markdown emphasis all differ between the
 * answer and the text it quotes without changing the words.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[*_\\]/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Whole-token match, so a cited "20-04" is not verified by the "20-042" in a
 * retrieved document.
 */
function appearsAsToken(corpus: string, id: string): boolean {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^A-Z0-9-])${escaped}(?=[^A-Z0-9-]|$)`, 'i').test(corpus)
}
