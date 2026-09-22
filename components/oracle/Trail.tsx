import type {ToolStep} from '@/lib/agent/transcript'
import styles from './Turn.module.css'

/**
 * What the agent looked up, step by step. Open while it works, since a
 * grounded answer takes several reads and the wait needs to show progress,
 * then folded away once the answer is in.
 */
export function Trail({steps, working}: {steps: ToolStep[]; working: boolean}) {
  if (steps.length === 0 && !working) return null

  return (
    <details className={styles.trail} open={working}>
      <summary>
        {working ? 'Looking it up' : `${steps.length} ${steps.length === 1 ? 'lookup' : 'lookups'}`}
      </summary>
      <ol>
        {steps.map((step) => {
          const extra = detail(step)
          return (
            <li key={step.id} className={styles[step.state]}>
              <span>{describe(step)}</span>
              {extra && <span className={styles.stepDetail}>{extra}</span>}
            </li>
          )
        })}
      </ol>
    </details>
  )
}

function describe(step: ToolStep): string {
  const input = (step.input ?? {}) as Record<string, unknown>
  const output = (step.output ?? {}) as Record<string, unknown>

  switch (step.name) {
    case 'initial_context':
      return 'Opened the knowledge base outline'
    case 'knowledge_base_read': {
      const count = Array.isArray(input.paths) ? input.paths.length : 0
      return `Read ${count} knowledge base ${count === 1 ? 'entry' : 'entries'}`
    }
    case 'check_applicability': {
      const vehicle = [input.year, input.make, input.model, input.trim].filter(Boolean).join(' ')
      return `Checked sources and contradictions for ${vehicle || 'the vehicle'}`
    }
    case 'record_decision':
      if (step.state === 'running') return 'Proposing a resolution'
      return output.proposed ? 'Proposed a resolution for review' : 'Did not propose a resolution'
    default:
      return step.name
  }
}

function detail(step: ToolStep): string | null {
  const input = (step.input ?? {}) as Record<string, unknown>
  const output = (step.output ?? {}) as Record<string, unknown>

  if (step.name === 'knowledge_base_read' && Array.isArray(input.paths)) return input.paths.join(', ')
  if (step.name === 'record_decision' && typeof output.reason === 'string') return output.reason
  return null
}
