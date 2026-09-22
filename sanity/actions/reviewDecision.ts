import {useState} from 'react'
import {type DocumentActionComponent, type DocumentActionProps, useClient} from 'sanity'
import {apiVersion} from '../env'

interface DecisionDoc {
  status?: 'proposed' | 'approved' | 'rejected'
  contradiction?: {_ref: string}
}

/**
 * Shared by Approve and Reject. Approving also marks the contradiction
 * resolved, in the same transaction, so the two can never disagree about
 * whether a question is settled.
 *
 * Both act on the published document. A decision with unpublished edits has to
 * be published or discarded first, or the review would approve text nobody
 * has looked at.
 */
function useReview(props: DocumentActionProps, outcome: 'approved' | 'rejected') {
  const client = useClient({apiVersion})
  const [working, setWorking] = useState(false)
  const doc = props.published as DecisionDoc | null

  const blocked = !doc
    ? 'Publish the decision first'
    : props.draft
      ? 'Publish or discard your edits first'
      : doc.status !== 'proposed'
        ? `Already ${doc.status}`
        : null

  async function review() {
    if (!doc) return
    setWorking(true)
    try {
      const tx = client
        .transaction()
        .patch(props.id, (patch) => patch.set({status: outcome, reviewedAt: new Date().toISOString()}))
      if (outcome === 'approved' && doc.contradiction) {
        tx.patch(doc.contradiction._ref, (patch) => patch.set({status: 'resolved'}))
      }
      await tx.commit()
    } finally {
      setWorking(false)
    }
  }

  return {disabled: working || blocked !== null, title: blocked ?? undefined, onHandle: review}
}

export const ApproveDecisionAction: DocumentActionComponent = (props) => ({
  label: 'Approve',
  tone: 'positive',
  ...useReview(props, 'approved'),
})

export const RejectDecisionAction: DocumentActionComponent = (props) => ({
  label: 'Reject',
  tone: 'critical',
  ...useReview(props, 'rejected'),
})
