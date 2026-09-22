import {CITATION} from './citations'

export type Segment =
  | {kind: 'text'; text: string}
  | {kind: 'cite'; id: string}
  | {kind: 'quote'; text: string; citedIds: string[]}

/** Straight or curly double quotes around at least two characters, on one line. */
const QUOTE = /[\u201c"]([^\u201c\u201d"\n]{2,}?)[\u201d"]/

const TOKEN = new RegExp(`${CITATION.source}|${QUOTE.source}`, 'g')

/**
 * Splits an answer into paragraphs of plain text, citations and quotes.
 *
 * Each quote is tied to the citations that first follow it in its paragraph,
 * which is where the prompt asks the agent to put them, so the quote can be
 * checked against the document it is attributed to.
 */
export function parseAnswer(answer: string): Segment[][] {
  return answer
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(parseParagraph)
}

function parseParagraph(paragraph: string): Segment[] {
  const segments: Segment[] = []
  let last = 0
  for (const match of paragraph.matchAll(TOKEN)) {
    if (match.index > last) segments.push(text(paragraph.slice(last, match.index)))
    segments.push(match[1] ? {kind: 'cite', id: match[1]} : {kind: 'quote', text: match[2], citedIds: []})
    last = match.index + match[0].length
  }
  if (last < paragraph.length) segments.push(text(paragraph.slice(last)))

  segments.forEach((segment, i) => {
    if (segment.kind === 'quote') segment.citedIds = citationsAfter(segments, i)
  })
  return segments
}

/**
 * The prompt asks for no em dashes and the model still writes the odd one. A
 * comma reads the same in almost every sentence. Quotes are left alone, since
 * they are the source's words.
 */
function text(raw: string): Segment {
  return {kind: 'text', text: raw.replace(/\s*\u2014\s*/g, ', ')}
}

/** The run of citations first following a quote, like [PE22-003][EA24-002]. */
function citationsAfter(segments: Segment[], from: number): string[] {
  let i = from + 1
  while (i < segments.length && segments[i].kind !== 'cite') i++

  const ids: string[] = []
  for (; i < segments.length; i++) {
    const segment = segments[i]
    if (segment.kind === 'cite') ids.push(segment.id)
    else if (segment.kind === 'text' && segment.text.trim() === '') continue
    else break
  }
  return ids
}
