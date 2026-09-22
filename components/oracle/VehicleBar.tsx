import {useState, type KeyboardEvent} from 'react'
import type {Vehicle} from '@/lib/agent/systemPrompt'
import styles from './Oracle.module.css'

type Field = 'year' | 'make' | 'model' | 'trim'
type Draft = Record<Field, string>

const FIELDS: {key: Field; label: string}[] = [
  {key: 'year', label: 'Year'},
  {key: 'make', label: 'Make'},
  {key: 'model', label: 'Model'},
  {key: 'trim', label: 'Trim'},
]

/**
 * The vehicle as editable tokens. An edit applies on Enter or when focus
 * leaves the field, not per keystroke, so typing a model name does not fire a
 * lookup for every prefix of it.
 */
export function VehicleBar({vehicle, onChange}: {vehicle: Vehicle; onChange: (next: Vehicle) => void}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(vehicle))

  function commit() {
    const next = fromDraft(draft)
    if (FIELDS.some(({key}) => next[key] !== vehicle[key])) onChange(next)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  return (
    <div className={styles.vehicle} role="group" aria-label="Vehicle">
      <span className={styles.prompt} aria-hidden="true">
        &rsaquo;
      </span>
      {FIELDS.map(({key, label}) => (
        <label key={key} className={styles.token}>
          <i>{label}</i>
          <input
            value={draft[key]}
            style={{width: `${Math.max(draft[key].length, 2) + 0.5}ch`}}
            inputMode={key === 'year' ? 'numeric' : undefined}
            onChange={(e) => setDraft({...draft, [key]: e.target.value})}
            onBlur={commit}
            onKeyDown={onKeyDown}
          />
        </label>
      ))}
    </div>
  )
}

function toDraft(v: Vehicle): Draft {
  return {year: v.year?.toString() ?? '', make: v.make ?? '', model: v.model ?? '', trim: v.trim ?? ''}
}

function fromDraft(d: Draft): Vehicle {
  const year = Number.parseInt(d.year, 10)
  return {
    year: Number.isNaN(year) ? undefined : year,
    make: d.make.trim() || undefined,
    model: d.model.trim() || undefined,
    trim: d.trim.trim() || undefined,
  }
}
