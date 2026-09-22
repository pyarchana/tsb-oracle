import {tool} from 'ai'
import {z} from 'zod'
import {sanityWriteClient} from '@/lib/sanity/writeClient'

interface ContradictionState {
  status: 'unresolved' | 'resolved'
  claimIds: string[]
  pending: {id: string; rationale: string; resolvedClaimId: string} | null
}

const CONTRADICTION_STATE = `*[_type == "contradiction" && _id == $id][0] {
  status,
  "claimIds": [claimA._ref, claimB._ref],
  "pending": *[_type == "decision" && contradiction._ref == ^._id && status == "proposed"][0] {
    "id": _id,
    rationale,
    "resolvedClaimId": resolvedClaim._ref
  }
}`

/**
 * Writes a proposal, never a settled decision. A person approves it in the
 * Studio before it counts, so a conversation with the public demo can only ask
 * for a question to be settled, not settle it for everyone after.
 *
 * Every refusal comes back as a result rather than an error, with the reason,
 * so the agent can tell the user what happened instead of failing the turn.
 * The pending check and the write are not atomic: two proposals racing each
 * other both land, and the reviewer approves one and rejects the other.
 */
export const recordDecision = tool({
  description:
    "Propose how an unsettled contradiction resolves, once the sources or the user's answer decide which of its two claims applies. " +
    'Use the contradiction and claim ids exactly as check_applicability returned them. ' +
    'The proposal waits for a person to review it and settles nothing until approved, so tell the user it is awaiting review. ' +
    'If a proposal is already waiting on that contradiction, this returns it instead of adding another.',
  inputSchema: z.object({
    contradictionId: z.string().describe('The id of the contradiction, for example contradiction-fix-model-years'),
    resolvedClaimId: z.string().describe("The id of the claim that applies, one of the contradiction's two claims"),
    rationale: z
      .string()
      .min(40)
      .max(600)
      .describe('Why this claim applies, in terms a reviewer can check against the cited sources'),
  }),
  execute: async ({contradictionId, resolvedClaimId, rationale}) => {
    const state = await sanityWriteClient.fetch<ContradictionState | null>(CONTRADICTION_STATE, {
      id: contradictionId,
    })

    if (!state) {
      return {proposed: false, reason: `There is no contradiction with the id ${contradictionId}.`}
    }
    if (state.status === 'resolved') {
      return {proposed: false, reason: 'This contradiction is already settled by an approved decision.'}
    }
    if (!state.claimIds.includes(resolvedClaimId)) {
      return {
        proposed: false,
        reason: `${resolvedClaimId} is not one of this contradiction's claims.`,
        claimIds: state.claimIds,
      }
    }
    if (state.pending) {
      return {proposed: false, reason: 'A proposal is already awaiting review.', pending: state.pending}
    }

    const created = await sanityWriteClient.create({
      _type: 'decision',
      contradiction: {_type: 'reference', _ref: contradictionId},
      resolvedClaim: {_type: 'reference', _ref: resolvedClaimId},
      rationale,
      status: 'proposed',
      resolvedBy: 'agent',
      resolvedAt: new Date().toISOString(),
    })

    return {proposed: true, id: created._id, status: 'proposed'}
  },
})
