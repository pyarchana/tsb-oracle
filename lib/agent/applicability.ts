/**
 * Whether a document applies to a particular car.
 *
 * These are rules about vehicles, not about storage, so they live apart from
 * the tool that fetches the documents. That keeps them free of the Sanity
 * client, which is what lets them be tested directly.
 */

export type VinStatus =
  | 'in-range'
  | 'out-of-range'
  | 'range-unreadable'
  | 'no-range'
  | 'vin-not-given'
  | 'invalid-vin'

export type TrimStatus = 'excluded' | 'not-excluded' | 'no-exclusions' | 'trim-not-given'

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
export function vinStatus(
  vin: string | undefined,
  start?: string | null,
  end?: string | null,
): VinStatus {
  if (!start || !end) return 'no-range'
  if (!vin) return 'vin-not-given'

  const car = vinParts(vin)
  if (!car) return 'invalid-vin'

  const from = vinParts(start)
  const to = vinParts(end)
  // A range with an end that will not parse, or with ends from two different
  // vehicle lines, says nothing about any car. Calling that out-of-range would
  // blame the car for a fault in the record.
  if (!from || !to || from.line !== to.line) return 'range-unreadable'

  if (car.line !== from.line) return 'out-of-range'
  return car.serial >= from.serial && car.serial <= to.serial ? 'in-range' : 'out-of-range'
}

/**
 * Service Bulletin 26-091 covers every 2017 to 2019 CR-V except the LX, so
 * model year alone would tell an LX owner they qualify. Unlike a VIN range, a
 * trim exclusion does rule the document out for that car.
 */
export function trimStatus(trim: string | undefined, excluded: string[] | null): TrimStatus {
  if (!excluded || excluded.length === 0) return 'no-exclusions'
  if (!trim) return 'trim-not-given'
  const wanted = trim.trim().toLowerCase()
  return excluded.some((t) => t.toLowerCase() === wanted) ? 'excluded' : 'not-excluded'
}
