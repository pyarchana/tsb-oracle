import type {UIMessage} from 'ai'
import {parseAnswer} from '@/lib/agent/answer'
import {classifyCitations} from '@/lib/agent/citations'
import {answerText, retrievedText, toolSteps} from '@/lib/agent/transcript'
import type {SourceRow} from '@/lib/sanity/queries'
import {Answer} from './Answer'
import {Conflict} from './Conflict'
import type {Records} from './records'
import {Trail} from './Trail'
import styles from './Turn.module.css'

interface TurnProps {
  question: string
  reply?: UIMessage
  /** This turn is the one the agent is still working on. */
  working: boolean
  /** The agent is working on some turn, so nothing new can be asked yet. */
  busy: boolean
  records: Records | null
  sources: Map<string, SourceRow>
  make?: string
  onAsk: (text: string) => void
}

/**
 * One question and its answer. A contradiction gets its block under the answer
 * when the answer cites both of its sides, which is when the answer has
 * actually raised it. The block reads the latest records rather than what the
 * agent saw, so a proposal made in a later turn shows up here too.
 */
export function Turn({question, reply, working, busy, records, sources, make, onAsk}: TurnProps) {
  const steps = reply ? toolSteps(reply) : []
  const answer = reply ? answerText(reply) : ''
  const retrieved = reply ? retrievedText(reply) : ''
  const citations = classifyCitations(answer, [retrieved])
  const cited = new Set(citations.map((c) => c.id))
  const verified = new Set(citations.filter((c) => c.verified).map((c) => c.id))

  const conflicts = working
    ? []
    : (records?.contradictions ?? []).filter(
        (c) => cited.has(c.claimA.tsbNumber) && cited.has(c.claimB.tsbNumber),
      )

  return (
    <article className={styles.turn}>
      <p className={styles.question}>{question}</p>
      <Trail steps={steps} working={working && answer === ''} />
      {answer && (
        <Answer
          paragraphs={parseAnswer(answer)}
          verified={verified}
          retrieved={retrieved}
          question={question}
          texts={working ? undefined : records?.texts}
          sources={sources}
        />
      )}
      {conflicts.map((c) => (
        <Conflict
          key={c.id}
          contradiction={c}
          sources={sources}
          make={make}
          disabled={busy}
          onAsk={onAsk}
        />
      ))}
    </article>
  )
}
