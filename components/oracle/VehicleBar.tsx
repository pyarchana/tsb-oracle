import {useRef, useState, type KeyboardEvent, type RefObject} from 'react'
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

interface VehicleBarProps {
  vehicle: Vehicle
  onChange: (next: Vehicle) => void
  /** Focused by the command shortcut. */
  firstField: RefObject<HTMLInputElement | null>
  /** Called when the line is done with, so focus can move to the question. */
  onDone: () => void
}

/**
 * The vehicle as editable tokens, driven like a command line rather than a
 * form. An edit applies on Enter or when focus leaves the field, not per
 * keystroke, so typing a model name does not fire a lookup for every prefix of
 * it. Enter hands focus on to the question, and Escape abandons the edit.
 */
export function VehicleBar({vehicle, onChange, firstField, onDone}: VehicleBarProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(vehicle))
  // Escape restores the draft, but the blur it causes would otherwise commit
  // the abandoned text, because the blur runs before the restore renders.
  const abandoned = useRef(false)

  function commit() {
    if (abandoned.current) {
      abandoned.current = false
      return
    }
    const next = fromDraft(draft)
    // Show what was actually taken, so a capped year or stray spacing does not
    // sit in the token contradicting the sources below it.
    setDraft(toDraft(next))
    if (FIELDS.some(({key}) => next[key] !== vehicle[key])) onChange(next)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
      onDone()
    } else if (event.key === 'Escape') {
      abandoned.current = true
      setDraft(toDraft(vehicle))
      event.currentTarget.blur()
    }
  }

  return (
    <div
      className={styles.vehicle}
      role="group"
      aria-label="Vehicle"
      aria-keyshortcuts="Control+K Meta+K"
    >
      <span className={styles.prompt} aria-hidden="true">
        &rsaquo;
      </span>
      {FIELDS.map(({key, label}, i) => (
        <label key={key} className={styles.token}>
          <i>{label}</i>
          <input
            ref={i === 0 ? firstField : undefined}
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

/**
 * No car can have a model year past this one, and a year in the future only
 * ever returns nothing, so the token caps there rather than showing a year the
 * dataset can never answer for.
 */
const LATEST_YEAR = new Date().getFullYear()

function fromDraft(d: Draft): Vehicle {
  const year = Number.parseInt(d.year, 10)
  return {
    year: Number.isNaN(year) ? undefined : Math.min(year, LATEST_YEAR),
    make: d.make.trim() || undefined,
    model: d.model.trim() || undefined,
    trim: d.trim.trim() || undefined,
  }
}
