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
/** A document as the dataset holds it now, with whether it has been reissued since its claims were taken. */
export interface CitedDocument {
  text: string
  reissued: boolean
}

export type QuoteVerdict = 'holds' | 'not-in-document' | 'document-reissued'

/**
 * Checks a quote against the documents it is cited to.
 *
 * Words that are nowhere in a cited document usually mean the quote is wrong.
 * They mean something else when that document has been reissued since its
 * claims were extracted: the words may be a faithful quote of a version the
 * dataset no longer holds. Saying "those words are not in EA24-002" would then
 * be true of today's text and misleading about the answer, so the two verdicts
 * are kept apart.
 */
export function checkQuote(quote: string, cited: (CitedDocument | null)[]): QuoteVerdict {
  const documents = cited.filter((doc) => doc !== null)
  if (quoteAppearsIn(quote, documents.map((doc) => doc.text))) return 'holds'
  return documents.some((doc) => doc.reissued) ? 'document-reissued' : 'not-in-document'
}

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
