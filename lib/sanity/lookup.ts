import {sanityFreshClient} from './client'
import {
  CONTRADICTIONS_FOR_SOURCES,
  SOURCE_TEXTS,
  SOURCES_BY_NUMBER,
  SOURCES_FOR_VEHICLE,
  type ContradictionRow,
  type SourceRow,
  type SourceTextRow,
} from './queries'

export interface VehicleQuery {
  year?: number
  make?: string
  model?: string
}

export interface VehicleRecords {
  sources: SourceRow[]
  contradictions: ContradictionRow[]
}

/**
 * The sources covering a vehicle and every contradiction touching them. The
 * agent's applicability check and the sources panel both read through here, so
 * the panel shows the same records the agent answered from.
 *
 * Reads bypass the CDN: a proposal or approval made moments earlier has to show
 * up on the next read, in the agent's next turn and in the panel alike.
 */
export async function lookupVehicle({year, make, model}: VehicleQuery): Promise<VehicleRecords> {
  const sources = await sanityFreshClient.fetch<SourceRow[]>(SOURCES_FOR_VEHICLE, {
    year: year ?? null,
    make: make ?? null,
    model: model ?? null,
  })

  const contradictions =
    sources.length === 0
      ? []
      : await sanityFreshClient.fetch<ContradictionRow[]>(CONTRADICTIONS_FOR_SOURCES, {
          tsbNumbers: sources.map((s) => s.tsbNumber),
        })

  return {sources, contradictions}
}

export async function lookupSources(numbers: string[]): Promise<SourceRow[]> {
  if (numbers.length === 0) return []
  return sanityFreshClient.fetch<SourceRow[]>(SOURCES_BY_NUMBER, {numbers})
}

/**
 * Each requested document's text, keyed by NHTSA id. An id the dataset does not
 * hold maps to null, so a caller can tell a document with no match from one
 * that has not been looked up yet.
 */
export async function lookupSourceTexts(numbers: string[]): Promise<Map<string, string | null>> {
  const texts = new Map<string, string | null>(numbers.map((n) => [n, null]))
  if (numbers.length === 0) return texts
  const rows = await sanityFreshClient.fetch<SourceTextRow[]>(SOURCE_TEXTS, {numbers})
  for (const row of rows) {
    texts.set(row.tsbNumber, [row.title, row.body, ...row.quotes].filter(Boolean).join('\n'))
  }
  return texts
}
