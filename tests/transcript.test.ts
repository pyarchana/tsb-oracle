import assert from 'node:assert/strict'
import type {UIMessage} from 'ai'
import {describe, test} from 'node:test'
import {answerText, retrievedText, toolSteps} from '../lib/agent/transcript'

/** The parts of an assistant message, in the shapes the AI SDK streams them. */
function message(parts: unknown[]): UIMessage {
  return {id: 'm1', role: 'assistant', parts} as unknown as UIMessage
}

const text = (value: string) => ({type: 'text', text: value})

const toolCall = (name: string, output: unknown, state = 'output-available') => ({
  type: `tool-${name}`,
  toolCallId: `call-${name}`,
  state,
  input: {paths: ['crv/cmbs/ea24-002']},
  output,
})

describe('answerText', () => {
  test('keeps the text written after the last tool call', () => {
    const reply = message([
      text('Let me look that up.'),
      toolCall('check_applicability', {sources: []}),
      text('Not yet for a 2021.'),
    ])
    assert.equal(answerText(reply), 'Not yet for a 2021.')
  })

  test('falls back to everything when the turn ends on a tool call', () => {
    const reply = message([
      text('Version 1 names the cause.'),
      toolCall('record_decision', {proposed: true}),
    ])
    assert.equal(answerText(reply), 'Version 1 names the cause.')
  })

  test('is empty while the agent is still working', () => {
    assert.equal(answerText(message([toolCall('initial_context', {})])), '')
  })
})

describe('toolSteps', () => {
  test('reports each call with the state the UI needs', () => {
    const reply = message([
      toolCall('initial_context', {}),
      toolCall('knowledge_base_read', undefined, 'input-available'),
      toolCall('record_decision', undefined, 'output-error'),
    ])
    assert.deepEqual(
      toolSteps(reply).map((step) => [step.name, step.state]),
      [
        ['initial_context', 'done'],
        ['knowledge_base_read', 'running'],
        ['record_decision', 'failed'],
      ],
    )
  })

  test('holds the output only once it has arrived', () => {
    const [done, running] = toolSteps(
      message([toolCall('a', {ok: true}), toolCall('b', {ok: true}, 'input-streaming')]),
    )
    assert.deepEqual(done.output, {ok: true})
    assert.equal(running.output, undefined)
  })
})

describe('retrievedText', () => {
  test('collects the strings out of a Knowledge Base result', () => {
    const reply = message([
      toolCall('knowledge_base_read', {
        content: [{type: 'text', text: 'EA24-002 widened the investigation.'}],
      }),
    ])
    assert.match(retrievedText(reply), /EA24-002 widened the investigation\./)
  })

  test('reaches into nested records, so a claim quote counts as retrieved', () => {
    const reply = message([
      toolCall('check_applicability', {
        contradictions: [{claimA: {tsbNumber: 'PE22-003', quote: 'inadequate understanding'}}],
      }),
    ])
    const retrieved = retrievedText(reply)
    assert.match(retrieved, /inadequate understanding/)
    assert.match(retrieved, /PE22-003/)
  })

  test('leaves out a call that has not returned', () => {
    const reply = message([toolCall('knowledge_base_read', undefined, 'input-available')])
    assert.equal(retrievedText(reply), '')
  })
})
