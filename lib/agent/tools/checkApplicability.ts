import {tool} from 'ai'
import {z} from 'zod'
import {sanityFreshClient} from '@/lib/sanity/client'
import {
  CONTRADICTIONS_FOR_SOURCES,
  SOURCES_FOR_VEHICLE,
  type ContradictionRow,
  type SourceRow,
} from '@/lib/sanity/queries'

type VinStatus = 'in-range' | 'out-of-range' | 'no-range' | 'vin-not-given' | 'invalid-vin'
type TrimStatus = 'excluded' | 'not-excluded' | 'no-exclusions' | 'trim-not-given'

/**
 * The parts of a VIN a range is defined over. Position 9 is a check digit that
 * varies freely, so comparing whole VINs as strings sorts by the check digit
 * before it ever reaches the serial and puts cars in the wrong range. A range
 * really means: same maker, model, year and plant (positions 1 to 8, 10 and
 * 11), with a serial (positions 12 to 17) between the bounds.
 */
function vinParts(vin: string): {line: string; serial: string} | null {
  const v = vin.trim().toUpperCase()
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(v)) return null
  return {line: v.slice(0, 8) + v.slice(9, 11), serial: v.slice(11)}
}

/**
 * VIN ranges annotate a source rather than filter it out. A range on a document
 * marks the cars one remedy inside it applies to, not whether the document
 * applies at all: a bulletin can give a range for one repair and cover later
 * cars with another. Dropping it for an out-of-range VIN would hide the correct
 * answer from exactly those cars.
 */
function vinStatus(vin: string | undefined, start?: string | null, end?: string | null): VinStatus {
  if (!start || !end) return 'no-range'
  if (!vin) return 'vin-not-given'

  const car = vinParts(vin)
  if (!car) return 'invalid-vin'

  const from = vinParts(start)
  const to = vinParts(end)
  if (!from || !to || car.line !== from.line) return 'out-of-range'

  return car.serial >= from.serial && car.serial <= to.serial ? 'in-range' : 'out-of-range'
}

/**
 * Service Bulletin 26-091 covers every 2017 to 2019 CR-V except the LX, so
 * model year alone would tell an LX owner they qualify. Unlike a VIN range, a
 * trim exclusion does rule the document out for that car.
 */
function trimStatus(trim: string | undefined, excluded: string[] | null): TrimStatus {
  if (!excluded || excluded.length === 0) return 'no-exclusions'
  if (!trim) return 'trim-not-given'
  const wanted = trim.trim().toLowerCase()
  return excluded.some((t) => t.toLowerCase() === wanted) ? 'excluded' : 'not-excluded'
}

export const checkApplicability = tool({
  description:
    'Look up which source documents apply to a vehicle, together with every contradiction between claims in those documents and the decision that settled it, if one has been recorded. ' +
    'Use it once you know the year, make and model, before answering, so you know whether a disagreement is already settled or still open. ' +
    'Pass the trim and VIN when you have them. A document that leaves out some trims comes back marked excluded or not-excluded for the given trim, or trim-not-given when it names exclusions and you passed no trim, which is worth asking about. ' +
    'A document with a VIN range comes back marked in-range or out-of-range, where the range covers the cars one specific remedy in that document applies to, not whether the document applies at all, so read its claims rather than discarding it. ' +
    'This returns structured records, not document text. Read the knowledge base for the full wording, using the entry paths in its outline: a sourceUrl here is a public link for the user, not a knowledge base path.',
  inputSchema: z.object({
    year: z.number().int().optional().describe('Model year, for example 2021'),
    make: z.string().optional().describe('Manufacturer, for example Honda'),
    model: z.string().optional().describe('Model name, for example CR-V'),
    trim: z.string().optional().describe('Trim level, for example LX or EX'),
    vin: z.string().optional().describe('17 character VIN, when the user has given one'),
  }),
  execute: async ({year, make, model, trim, vin}) => {
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

    return {
      vehicle: {year, make, model, trim, vin},
      sources: sources.map(({vinRangeStart, vinRangeEnd, ...source}) => ({
        ...source,
        trim: trimStatus(trim, source.excludedTrims),
        vin: vinStatus(vin, vinRangeStart, vinRangeEnd),
      })),
      contradictions,
    }
  },
})
