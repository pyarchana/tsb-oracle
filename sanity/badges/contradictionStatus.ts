import type {DocumentBadgeComponent} from 'sanity'

/**
 * Shows whether a contradiction has been settled, without opening it.
 *
 * Editors scanning the contradiction list care about one thing: which ones are
 * still open. Reading the draft before the published value means a resolution
 * shows as soon as it is made, not once it is published.
 */
export const contradictionStatusBadge: DocumentBadgeComponent = (props) => {
  const doc = (props.draft ?? props.published) as {status?: string} | null
  const status = doc?.status

  if (!status) {
    return null
  }

  const resolved = status === 'resolved'

  return {
    label: resolved ? 'Resolved' : 'Unresolved',
    title: resolved
      ? 'A decision record exists for this contradiction'
      : 'No decision has been recorded yet',
    color: resolved ? 'success' : 'warning',
  }
}
