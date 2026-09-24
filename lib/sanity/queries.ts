import {defineQuery} from 'next-sanity'

/**
 * Every query names its _type. The dataset also holds Sanity's own
 * system.group and system.retention documents, and an untyped filter would
 * pull them into retrieval.
 *
 * Vehicle fields are optional, so each is passed as a parameter that may be
 * null, and a null parameter matches everything rather than nothing.
 */
const SOURCE_PROJECTION = `{
  tsbNumber,
  manufacturerNumber,
  title,
  sourceType,
  status,
  publishDate,
  sourceUrl,
  excludedTrims,
  vinRangeStart,
  vinRangeEnd
}`

export const SOURCES_FOR_VEHICLE = defineQuery(`
  *[_type == "tsb"
    && ($make == null || lower(make) == lower($make))
    && ($model == null || lower(model) == lower($model))
    && ($year == null || $year in modelYears)
  ] | order(publishDate asc) ${SOURCE_PROJECTION}
`)

/**
 * Sources by NHTSA id, whatever vehicle they cover. The sources panel needs
 * these for documents the vehicle query leaves out but the conversation still
 * brings up: the other side of a contradiction, or a bulletin the agent cited
 * because it stops short of the user's model year.
 */
export const SOURCES_BY_NUMBER = defineQuery(`
  *[_type == "tsb" && tsbNumber in $numbers] | order(publishDate asc) ${SOURCE_PROJECTION}
`)

/**
 * What each document says, as the dataset holds it: its body, plus the
 * verbatim quotes its claims were extracted with. Quotes in an answer are
 * checked against this, the document itself, rather than against the
 * Knowledge Base's synthesis of it.
 */
export const SOURCE_TEXTS = defineQuery(`
  *[_type == "tsb" && tsbNumber in $numbers] {
    tsbNumber,
    title,
    "body": pt::text(body),
    "quotes": *[_type == "claim" && source._ref == ^._id && defined(quote)].quote,
    contentHash,
    "claimHashes": *[_type == "claim" && source._ref == ^._id && defined(sourceHash)].sourceHash
  }
`)

const CLAIM_PROJECTION = `{
  "id": _id,
  statement,
  quote,
  confidence,
  "tsbNumber": source->tsbNumber,
  "publishDate": source->publishDate,
  "sourceStatus": source->status
}`

/**
 * Contradictions touching any of the given sources, each with both of its
 * claims, the most recent approved decision that settled it, and any proposal
 * still waiting for a person to review. A proposal is returned apart from the
 * decision because it settles nothing yet, but the agent needs to see it so it
 * does not propose the same resolution twice.
 *
 * Sources are matched on the NHTSA id rather than the Sanity _id. The NHTSA id
 * is unique too, and it is the only id the model sees: handed both, it
 * sometimes cites the internal one, which no dealer can look up.
 */
export const CONTRADICTIONS_FOR_SOURCES = defineQuery(`
  *[_type == "contradiction"
    && (claimA->source->tsbNumber in $tsbNumbers || claimB->source->tsbNumber in $tsbNumbers)
  ] | order(topic asc) {
    "id": _id,
    topic,
    explanation,
    status,
    "claimA": claimA->${CLAIM_PROJECTION},
    "claimB": claimB->${CLAIM_PROJECTION},
    "decision": *[_type == "decision" && contradiction._ref == ^._id && status == "approved"]
      | order(reviewedAt desc)[0] {
        "id": _id,
        rationale,
        resolvedBy,
        resolvedAt,
        reviewedAt,
        "resolvedClaimId": resolvedClaim._ref
      },
    "pendingProposal": *[_type == "decision" && contradiction._ref == ^._id && status == "proposed"]
      | order(resolvedAt desc)[0] {
        "id": _id,
        rationale,
        resolvedAt,
        "resolvedClaimId": resolvedClaim._ref
      }
  }
`)

/*
 * Result shapes, written by hand. Sanity TypeGen could generate these, but for
 * four queries a generated file and the build step to keep it current cost more
 * than they save. Each mirrors the projection above it exactly.
 */

export interface SourceRow {
  tsbNumber: string
  manufacturerNumber: string | null
  title: string
  sourceType:
    | 'tsb'
    | 'dealer-message'
    | 'owner-letter'
    | 'recall'
    | 'investigation'
    | 'complaint'
    | 'manual'
  status: 'active' | 'superseded' | 'revised' | 'closed'
  publishDate: string | null
  sourceUrl: string | null
  excludedTrims: string[] | null
  vinRangeStart: string | null
  vinRangeEnd: string | null
}

export interface SourceTextRow {
  tsbNumber: string
  title: string
  body: string | null
  quotes: string[]
  contentHash: string | null
  claimHashes: string[]
}

export interface ClaimRow {
  id: string
  statement: string
  quote: string | null
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
  reviewedAt: string
  resolvedClaimId: string
}

export interface ProposalRow {
  id: string
  rationale: string
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
  pendingProposal: ProposalRow | null
}
