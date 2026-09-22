import {useCallback, useEffect, useRef, useState} from 'react'
import type {Vehicle} from '@/lib/agent/systemPrompt'
import {lookupSources, lookupSourceTexts, lookupVehicle} from '@/lib/sanity/lookup'
import type {ContradictionRow, SourceRow} from '@/lib/sanity/queries'

export interface Records {
  /** Sources matching the vehicle, the same set the agent's check returns. */
  sources: SourceRow[]
  /**
   * Sources the conversation brings in from outside that set: the other side of
   * a contradiction, or anything the agent cited. A bulletin that stops at 2019
   * belongs in front of a 2021 owner precisely because it leaves them out.
   */
  related: SourceRow[]
  contradictions: ContradictionRow[]
  /** The text of every document cited so far, for checking quotes against. */
  texts: Map<string, string | null>
}

/**
 * Reads the vehicle's records straight from the public dataset, so the panel
 * works before anything has been asked. Refreshes on a vehicle change and,
 * through `refresh`, after each answer, which is when a proposal or a newly
 * cited document can appear, and when the cited documents' text is fetched to
 * check the answer's quotes.
 */
export function useVehicleRecords(vehicle: Vehicle) {
  const [records, setRecords] = useState<Records | null>(null)
  const [error, setError] = useState<string | null>(null)
  const latest = useRef(0)

  const refresh = useCallback(
    (cited: string[] = []) => {
      // A slow response for a vehicle the user has already moved on from must
      // not overwrite the current one.
      const request = ++latest.current
      loadRecords(vehicle, cited).then(
        (next) => {
          if (request !== latest.current) return
          setRecords(next)
          setError(null)
        },
        (e: unknown) => {
          if (request !== latest.current) return
          setError(e instanceof Error ? e.message : String(e))
        },
      )
    },
    [vehicle],
  )

  useEffect(() => refresh(), [refresh])

  return {records, error, refresh}
}

async function loadRecords(vehicle: Vehicle, cited: string[]): Promise<Records> {
  const {sources, contradictions} = await lookupVehicle(vehicle)
  const known = new Set(sources.map((s) => s.tsbNumber))
  const wanted = new Set([
    ...contradictions.flatMap((c) => [c.claimA.tsbNumber, c.claimB.tsbNumber]),
    ...cited,
  ])
  const [related, texts] = await Promise.all([
    lookupSources([...wanted].filter((n) => !known.has(n))),
    lookupSourceTexts(cited),
  ])
  return {sources, related, contradictions, texts}
}

export type Settlement = 'open' | 'review' | 'resolved'

export function settlement(c: ContradictionRow): Settlement {
  if (c.status === 'resolved') return 'resolved'
  return c.pendingProposal ? 'review' : 'open'
}

const TYPE_LABELS: Record<SourceRow['sourceType'], string> = {
  tsb: 'bulletin',
  'dealer-message': 'dealer',
  'owner-letter': 'owner letter',
  recall: 'recall',
  investigation: 'investigation',
  complaint: 'complaint',
  manual: 'manual',
}

export function typeLabel(source: SourceRow): string {
  return TYPE_LABELS[source.sourceType]
}

/** An investigation is open or closed and a complaint is a report, whatever the stored status says. */
export function statusLabel(source: SourceRow): string {
  if (source.sourceType === 'complaint') return 'reported'
  if (source.sourceType === 'investigation') return source.status === 'closed' ? 'closed' : 'open'
  return source.status
}

export function issuer(source: SourceRow, make?: string): string {
  if (source.sourceType === 'investigation') return 'NHTSA'
  if (source.sourceType === 'complaint') return 'Owner'
  return make ?? 'Manufacturer'
}

/** Titles lead with the NHTSA id for the agent's sake. The panel shows the id on its own line already. */
export function shortTitle(source: SourceRow): string {
  const prefix = `${source.tsbNumber}:`
  return source.title.startsWith(prefix) ? source.title.slice(prefix.length).trim() : source.title
}
