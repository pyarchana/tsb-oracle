import type {Segment} from '@/lib/agent/answer'
import {quoteAppearsIn} from '@/lib/agent/citations'
import type {SourceRow} from '@/lib/sanity/queries'
import styles from './Turn.module.css'

interface AnswerProps {
  paragraphs: Segment[][]
  /** Citation ids found in what the agent retrieved for this answer. */
  verified: Set<string>
  /** Everything the agent retrieved for this answer. */
  retrieved: string
  /** The question this answers. */
  question: string
  /** Cited documents' text from the dataset, absent until it has loaded. */
  texts?: Map<string, string | null>
  sources: Map<string, SourceRow>
}

export function Answer({paragraphs, verified, retrieved, question, texts, sources}: AnswerProps) {
  return (
    <div className={styles.answer}>
      {paragraphs.map((segments, i) => (
        <p key={i} className={i === 0 ? styles.lead : undefined}>
          {segments.map((segment, j) => {
            if (segment.kind === 'text') return segment.text
            if (segment.kind === 'cite') {
              return (
                <Citation
                  key={j}
                  id={segment.id}
                  verified={verified.has(segment.id)}
                  source={sources.get(segment.id)}
                />
              )
            }
            return (
              <Quote
                key={j}
                text={segment.text}
                citedIds={segment.citedIds}
                verified={quoteHolds(segment.text, segment.citedIds, retrieved, question, texts)}
              />
            )
          })}
        </p>
      ))}
    </div>
  )
}

/**
 * A chip links to the public NHTSA record when the dataset has it. One the
 * agent never retrieved is flagged rather than hidden, since the user may
 * already be about to repeat it to a dealer.
 */
function Citation({id, verified, source}: {id: string; verified: boolean; source?: SourceRow}) {
  const className = `${styles.cite} ${verified ? '' : styles.unverified}`
  const title = verified
    ? (source?.title ?? id)
    : `${id} is not in anything the agent retrieved for this answer`

  if (verified && source?.sourceUrl) {
    return (
      <a className={className} href={source.sourceUrl} target="_blank" rel="noreferrer" title={title}>
        {id}
      </a>
    )
  }
  return (
    <span className={className} title={title}>
      {id}
    </span>
  )
}

/**
 * A cited quote is checked against the cited documents themselves. Until their
 * text has loaded it gets the benefit of the doubt, so a correct quote does not
 * flash as flagged while the answer finishes.
 *
 * An uncited quote may be echoing the user, as in the dealer said "that's
 * normal", so the question counts alongside what was retrieved.
 */
function quoteHolds(
  quote: string,
  citedIds: string[],
  retrieved: string,
  question: string,
  texts?: Map<string, string | null>,
): boolean {
  if (citedIds.length === 0) return quoteAppearsIn(quote, [retrieved, question])
  if (!texts || !citedIds.every((id) => texts.has(id))) return true
  return quoteAppearsIn(
    quote,
    citedIds.flatMap((id) => texts.get(id) ?? []),
  )
}

function Quote({text, citedIds, verified}: {text: string; citedIds: string[]; verified: boolean}) {
  if (verified) return <>{`\u201c${text}\u201d`}</>
  const where = citedIds.length > 0 ? citedIds.join(' or ') : 'anything the agent retrieved'
  return (
    <span className={styles.unverifiedQuote} title={`These words are not in ${where}`}>
      {`\u201c${text}\u201d`}
    </span>
  )
}
