import {useState} from 'react'
import type {ClaimRow, ContradictionRow, SourceRow} from '@/lib/sanity/queries'
import {Pill} from './Pill'
import {issuer, settlement, statusLabel} from './records'
import styles from './Conflict.module.css'

interface ConflictProps {
  contradiction: ContradictionRow
  sources: Map<string, SourceRow>
  make?: string
  disabled: boolean
  onAsk: (text: string) => void
}

/**
 * Two claims side by side, older on the left. A disagreement between sources
 * usually comes down to one having been written later, so the dates lead.
 *
 * Choosing a side asks the agent to propose that resolution rather than
 * writing it here. The agent checks the choice against the sources and writes
 * the rationale a reviewer approves or rejects in the Studio.
 */
export function Conflict({contradiction, sources, make, disabled, onAsk}: ConflictProps) {
  const [leftOpen, setLeftOpen] = useState(false)
  const state = settlement(contradiction)
  const sides = [contradiction.claimA, contradiction.claimB].sort((a, b) =>
    (a.publishDate ?? '').localeCompare(b.publishDate ?? ''),
  )
  // Two sides from the same year need the full date to show which came first.
  const sameYear = year(sides[0]) === year(sides[1])
  const settledOn = contradiction.decision?.resolvedClaimId

  return (
    <section className={styles.conflict} aria-label={`Contradiction: ${contradiction.topic}`}>
      <div className={styles.top}>
        <h3>{contradiction.topic}</h3>
        <Pill state={state} />
      </div>

      <div className={styles.sides}>
        {sides.map((claim, i) => (
          <Side
            key={claim.id}
            claim={claim}
            source={sources.get(claim.tsbNumber)}
            make={make}
            fullDate={sameYear}
            applies={settledOn === claim.id}
            seam={i > 0}
          />
        ))}
      </div>

      <div className={styles.bridge}>
        <b>Why they disagree.</b> {contradiction.explanation}
      </div>

      <div className={styles.resolve}>
        {state === 'resolved' ? (
          <span>
            <b>Settled.</b> {contradiction.decision?.rationale}
          </span>
        ) : state === 'review' ? (
          <span>
            <b>Awaiting review.</b> {contradiction.pendingProposal?.rationale}
          </span>
        ) : leftOpen ? (
          <span>Left open. Pick a side here any time.</span>
        ) : (
          <>
            <span>Which one applies to your car?</span>
            {sides.map((claim) => (
              <button
                key={claim.id}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onAsk(
                    `For my car, ${claim.tsbNumber} is the one that applies. Propose that resolution for review.`,
                  )
                }
              >
                {claim.tsbNumber}
              </button>
            ))}
            <button type="button" onClick={() => setLeftOpen(true)}>
              Leave open
            </button>
          </>
        )}
      </div>
    </section>
  )
}

interface SideProps {
  claim: ClaimRow
  source?: SourceRow
  make?: string
  fullDate: boolean
  applies: boolean
  seam: boolean
}

function Side({claim, source, make, fullDate, applies, seam}: SideProps) {
  return (
    <div className={`${styles.side} ${seam ? styles.seam : ''} ${applies ? styles.applies : ''}`}>
      <div className={styles.when}>{fullDate ? (claim.publishDate ?? 'Undated') : year(claim)}</div>
      <div className={styles.which}>
        {source ? `${issuer(source, make)} ` : ''}
        {source?.manufacturerNumber ? `${source.manufacturerNumber} \u00b7 ` : ''}
        <b>{claim.tsbNumber}</b>
        {source ? ` \u00b7 ${statusLabel(source)}` : ''}
        {applies ? ' \u00b7 applies' : ''}
      </div>
      <p>{claim.statement}</p>
    </div>
  )
}

function year(claim: ClaimRow): string {
  return claim.publishDate?.slice(0, 4) ?? 'Undated'
}
