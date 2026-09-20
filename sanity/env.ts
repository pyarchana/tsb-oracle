/**
 * Shared Sanity coordinates. Read from env so the Studio, the read client and
 * the seed script cannot drift apart.
 */

export const apiVersion = '2026-09-01'

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'Missing NEXT_PUBLIC_SANITY_DATASET',
)

export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'Missing NEXT_PUBLIC_SANITY_PROJECT_ID',
)

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }
  return v
}
