'use client'

import {useChat} from '@ai-sdk/react'
import {DefaultChatTransport, isTextUIPart, type UIMessage} from 'ai'
import {useEffect, useRef, useState, type FormEvent, type RefObject} from 'react'
import {extractCitationIds} from '@/lib/agent/citations'
import type {Vehicle} from '@/lib/agent/systemPrompt'
import {answerText} from '@/lib/agent/transcript'
import type {SourceRow} from '@/lib/sanity/queries'
import {useVehicleRecords} from './records'
import {SourceRail} from './SourceRail'
import {Turn} from './Turn'
import {VehicleBar} from './VehicleBar'
import styles from './Oracle.module.css'

const DEFAULT_VEHICLE: Vehicle = {year: 2021, make: 'Honda', model: 'CR-V', trim: 'EX'}

const EXAMPLES = [
  "My CR-V brakes hard on its own with nothing ahead. The dealer says that's normal. Is there a fix?",
  'Does Service Bulletin 26-091 apply to my car?',
  'What has NHTSA found about unexpected braking in the CR-V?',
]

const transport = new DefaultChatTransport({api: '/api/chat'})

export function Oracle() {
  const [vehicle, setVehicle] = useState<Vehicle>(DEFAULT_VEHICLE)
  const {records, error: recordsError, refresh} = useVehicleRecords(vehicle)

  // The chat keeps the callbacks it was created with, so it reaches the
  // current vehicle's refresh through a ref.
  const refreshRef = useRef(refresh)
  useEffect(() => {
    refreshRef.current = refresh
  }, [refresh])

  const {messages, sendMessage, regenerate, setMessages, status, stop, error} = useChat({
    transport,
    onFinish: ({messages}) => refreshRef.current(citedIn(messages)),
  })
  const busy = status === 'submitted' || status === 'streaming'

  /**
   * Keyboard first: slash goes to the question, the command shortcut goes to
   * the vehicle, and Escape backs out of whatever is happening, which while the
   * agent is working means stopping it.
   */
  const question = useRef<HTMLInputElement>(null)
  const firstVehicleField = useRef<HTMLInputElement>(null)
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement

      if (event.key === 'Escape') {
        if (busy) void stop()
        if (typing) target.blur()
        return
      }
      if (typing || event.altKey) return

      if (event.key === '/') {
        event.preventDefault()
        question.current?.focus()
      } else if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        firstVehicleField.current?.select()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [busy, stop])

  // Follow the answer as it streams, unless the reader has scrolled up.
  const thread = useRef<HTMLElement>(null)
  const stick = useRef(true)
  useEffect(() => {
    const el = thread.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [messages])

  function ask(text: string) {
    if (busy || text.trim() === '') return
    stick.current = true
    void sendMessage({text: text.trim()}, {body: {vehicle}})
  }

  /** A different car makes the earlier answers about someone else's, so it starts over. */
  function changeVehicle(next: Vehicle) {
    if (busy) void stop()
    setMessages([])
    setVehicle(next)
  }

  const cited = new Set(citedIn(messages))
  const sources = new Map<string, SourceRow>(
    [...(records?.sources ?? []), ...(records?.related ?? [])].map((s) => [s.tsbNumber, s]),
  )
  const turns = pairTurns(messages)

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.wordmark}>
          TSB <span>Oracle</span>
        </div>
        <VehicleBar
          vehicle={vehicle}
          onChange={changeVehicle}
          firstField={firstVehicleField}
          onDone={() => question.current?.focus()}
        />
        <span className={styles.kbd} suppressHydrationWarning>
          {commandKey()}K
        </span>
      </header>

      <main
        ref={thread}
        className={styles.thread}
        onScroll={(e) => {
          const el = e.currentTarget
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
        }}
      >
        {turns.length === 0 && (
          <div className={styles.examples}>
            <h1>Ask what the record says about this car.</h1>
            <p>
              Answers come only from Honda bulletins, NHTSA investigations and owner complaints, each
              cited, with any disagreement between them laid out.
            </p>
            {EXAMPLES.map((example) => (
              <button key={example} type="button" onClick={() => ask(example)}>
                {example}
              </button>
            ))}
          </div>
        )}

        {turns.map(({question, reply}, i) => (
          <Turn
            key={question.id}
            question={question.parts.filter(isTextUIPart).map((p) => p.text).join('')}
            reply={reply}
            working={busy && i === turns.length - 1}
            busy={busy}
            records={records}
            sources={sources}
            make={vehicle.make}
            onAsk={ask}
          />
        ))}

        {error && (
          <p className={styles.error}>
            The agent stopped: {error.message}{' '}
            <button type="button" onClick={() => void regenerate({body: {vehicle}})}>
              Try again
            </button>
          </p>
        )}

        <Composer busy={busy} onAsk={ask} onStop={() => void stop()} inputRef={question} />
      </main>

      <SourceRail records={records} error={recordsError} cited={cited} vehicle={vehicle} />
    </div>
  )
}

interface ComposerProps {
  busy: boolean
  onAsk: (text: string) => void
  onStop: () => void
  inputRef: RefObject<HTMLInputElement | null>
}

function Composer({busy, onAsk, onStop, inputRef}: ComposerProps) {
  const [text, setText] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || text.trim() === '') return
    onAsk(text)
    setText('')
  }

  return (
    <form className={styles.composer} onSubmit={submit}>
      <div className={styles.line}>
        <span className={styles.prompt} aria-hidden="true">
          &rsaquo;
        </span>
        <input
          ref={inputRef}
          className={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask about this vehicle"
          aria-label="Ask about this vehicle"
          aria-keyshortcuts="/"
        />
        {busy ? (
          <button type="button" className={styles.stop} onClick={onStop}>
            Stop <span className={styles.kbd}>esc</span>
          </button>
        ) : (
          <span className={styles.kbd}>/</span>
        )}
      </div>
    </form>
  )
}

/** The symbol on the key people actually press, which differs by platform. */
function commandKey(): string {
  if (typeof navigator === 'undefined') return 'Ctrl '
  return /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl '
}

function pairTurns(messages: UIMessage[]) {
  return messages.flatMap((message, i) => {
    if (message.role !== 'user') return []
    const next = messages[i + 1]
    return [{question: message, reply: next?.role === 'assistant' ? next : undefined}]
  })
}

function citedIn(messages: UIMessage[]): string[] {
  const ids = messages
    .filter((m) => m.role === 'assistant')
    .flatMap((m) => extractCitationIds(answerText(m)))
  return [...new Set(ids)]
}
