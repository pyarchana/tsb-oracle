import {defineQuery} from 'next-sanity'

/**
 * Every query names its _type. The dataset also holds Sanity's own
 * system.group and system.retention documents, and an untyped filter would
 * pull them into retrieval.
 *
 * Vehicle fields are optional, so each is passed as a parameter that may be
 * null, and a null parameter matches everything rather than nothing.
 */
export const SOURCES_FOR_VEHICLE = defineQuery(`
  *[_type == "tsb"
    && ($make == null || lower(make) == lower($make))
    && ($model == null || lower(model) == lower($model))
    && ($year == null || $year in modelYears)
  ] | order(publishDate asc) {
    "id": _id,
    tsbNumber,
    title,
    sourceType,
    status,
    publishDate,
    vinRangeStart,
    vinRangeEnd
  }
`)

const CLAIM_PROJECTION = `{
  "id": _id,
  statement,
  confidence,
  "tsbNumber": source->tsbNumber,
  "publishDate": source->publishDate,
  "sourceStatus": source->status
}`

/**
 * Contradictions touching any of the given sources, each with both of its
 * claims and the most recent decision that settled it, if there is one.
 */
export const CONTRADICTIONS_FOR_SOURCES = defineQuery(`
  *[_type == "contradiction"
    && (claimA->source._ref in $sourceIds || claimB->source._ref in $sourceIds)
  ] | order(topic asc) {
    "id": _id,
    topic,
    explanation,
    status,
    "claimA": claimA->${CLAIM_PROJECTION},
    "claimB": claimB->${CLAIM_PROJECTION},
    "decision": *[_type == "decision" && contradiction._ref == ^._id]
      | order(resolvedAt desc)[0] {
        "id": _id,
        rationale,
        resolvedBy,
        resolvedAt,
        "resolvedClaimId": resolvedClaim._ref
      }
  }
`)

/*
 * Result shapes, written by hand. Sanity TypeGen could generate these, but for
 * two queries a generated file and the build step to keep it current cost more
 * than they save. Each mirrors the projection above it exactly.
 */

export interface SourceRow {
  id: string
  tsbNumber: string
  title: string
  sourceType: 'tsb' | 'recall' | 'manual' | 'forum' | 'nhtsa'
  status: 'active' | 'superseded' | 'revised'
  publishDate: string | null
  vinRangeStart: string | null
  vinRangeEnd: string | null
}

export interface ClaimRow {
  id: string
  statement: string
  confidence: 'verified' | 'reported' | 'disputed'
  tsbNumber: string
  publishDate: string | null
  sourceStatus: SourceRow['status']
}

export interface DecisionRow {
  id: string
  rationale: string
  resolvedBy: 'agent' | 'human'
  resolvedAt: string
  resolvedClaimId: string
}

export interface ContradictionRow {
  id: string
  topic: string
  explanation: string
  status: 'unresolved' | 'resolved'
  claimA: ClaimRow
  claimB: ClaimRow
  decision: DecisionRow | null
}
