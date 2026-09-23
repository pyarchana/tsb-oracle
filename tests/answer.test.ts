import assert from 'node:assert/strict'
import {describe, test} from 'node:test'
import {parseAnswer, type Segment} from '../lib/agent/answer'

const DASH = '—'
const OPEN = '“'
const CLOSE = '”'

function kinds(segments: Segment[]): string[] {
  return segments.map((segment) => segment.kind)
}

describe('parseAnswer', () => {
  test('splits on blank lines and drops empty paragraphs', () => {
    const paragraphs = parseAnswer('First.\n\n\n  \n\nSecond.')
    assert.equal(paragraphs.length, 2)
    assert.deepEqual(paragraphs[1], [{kind: 'text', text: 'Second.'}])
  })

  test('pulls citations out of the prose around them', () => {
    const [paragraph] = parseAnswer('The fix stops at 2019 [MC-11035781], so ask.')
    assert.deepEqual(kinds(paragraph), ['text', 'cite', 'text'])
    assert.deepEqual(paragraph[1], {kind: 'cite', id: 'MC-11035781'})
  })

  test('attaches a quote to the citations that follow it', () => {
    const answer = `Honda called it ${OPEN}normal operation${CLOSE} [PE22-003][EA24-002].`
    const [paragraph] = parseAnswer(answer)
    const quote = paragraph.find((segment) => segment.kind === 'quote')
    assert.deepEqual(quote, {
      kind: 'quote',
      text: 'normal operation',
      citedIds: ['PE22-003', 'EA24-002'],
    })
  })

  test('leaves a quote uncited when no citation follows it', () => {
    const [paragraph] = parseAnswer(`The dealer said ${OPEN}that is normal${CLOSE} to the owner.`)
    const quote = paragraph.find((segment) => segment.kind === 'quote')
    assert.deepEqual(quote, {kind: 'quote', text: 'that is normal', citedIds: []})
  })

  test('does not reach past a later quote for a citation', () => {
    const answer = `First ${OPEN}one${CLOSE} then ${OPEN}two${CLOSE} [EA24-002].`
    const [paragraph] = parseAnswer(answer)
    const quotes = paragraph.filter((segment) => segment.kind === 'quote')
    assert.deepEqual(
      quotes.map((quote) => quote.citedIds),
      [['EA24-002'], ['EA24-002']],
    )
  })

  test('replaces a stray em dash in prose with a comma', () => {
    const [paragraph] = parseAnswer(`Not yet for a 2021 ${DASH} the fix stops at 2019.`)
    assert.deepEqual(paragraph, [
      {kind: 'text', text: 'Not yet for a 2021, the fix stops at 2019.'},
    ])
  })

  test('leaves an em dash inside a quote alone, since those are the source words', () => {
    const answer = `NHTSA wrote ${OPEN}the system ${DASH} as fitted ${DASH} decelerates${CLOSE} [EA24-002].`
    const [paragraph] = parseAnswer(answer)
    const quote = paragraph.find((segment) => segment.kind === 'quote')
    assert.equal(quote?.kind === 'quote' && quote.text.includes(DASH), true)
  })
})
