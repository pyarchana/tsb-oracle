import {createHash} from 'node:crypto'

/**
 * A fingerprint of a document's own words, stored when it is imported and
 * again when a quote is extracted from it.
 *
 * A citation names a document. It does not name which version of that document
 * the words came from, and NHTSA reissues a summary under the same id. Without
 * a fingerprint, a refreshed import silently replaces the text a quote was
 * taken from, and the quote check can only report that the words are missing,
 * never that the document moved underneath them.
 *
 * Whitespace is collapsed first, so reflowing a paragraph is not a revision.
 * Sixteen hex characters is far more than enough to tell two versions of one
 * bulletin apart, and short enough to read in the Studio.
 *
 * Node only, since it is the import and the seed that write these. The app
 * compares the stored values and never computes one.
 */
export function contentHash(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16)
}
