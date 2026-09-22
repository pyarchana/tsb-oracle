import type {Settlement} from './records'
import styles from './Pill.module.css'

const LABELS: Record<Settlement, string> = {
  open: 'Open',
  review: 'In review',
  resolved: 'Resolved',
}

export function Pill({state}: {state: Settlement}) {
  return (
    <span className={`${styles.pill} ${state === 'resolved' ? styles.settled : styles.unsettled}`}>
      {LABELS[state]}
    </span>
  )
}
