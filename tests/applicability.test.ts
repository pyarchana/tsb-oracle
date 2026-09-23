import assert from 'node:assert/strict'
import {describe, test} from 'node:test'
import {trimStatus, vinStatus} from '../lib/agent/applicability'

// Same line (maker, model, year, plant), differing only in the serial and the
// check digit at position 9.
const START = '2HKRW2H55MH600000'
const END = '2HKRW2H51MH699999'
const INSIDE = '2HKRW2H57MH612345'
const AFTER = '2HKRW2H53MH700001'
const OTHER_LINE = '5FNRL6H79NB012345'

describe('vinStatus', () => {
  test('places a car inside its range', () => {
    assert.equal(vinStatus(INSIDE, START, END), 'in-range')
  })

  test('places a later serial outside it', () => {
    assert.equal(vinStatus(AFTER, START, END), 'out-of-range')
  })

  test('ignores the check digit, which varies freely within a range', () => {
    // Position 9 differs across all three VINs above, and the serial decides.
    assert.equal(vinStatus(START, START, END), 'in-range')
    assert.equal(vinStatus(END, START, END), 'in-range')
  })

  test('puts a different vehicle line outside the range', () => {
    assert.equal(vinStatus(OTHER_LINE, START, END), 'out-of-range')
  })

  test('says a range is unreadable rather than blaming the car', () => {
    assert.equal(vinStatus(INSIDE, 'NOT-A-VIN', END), 'range-unreadable')
    assert.equal(vinStatus(INSIDE, START, OTHER_LINE), 'range-unreadable')
  })

  test('separates a missing range, a missing VIN and a malformed VIN', () => {
    assert.equal(vinStatus(INSIDE, null, null), 'no-range')
    assert.equal(vinStatus(undefined, START, END), 'vin-not-given')
    assert.equal(vinStatus('2HKRW2H57MH', START, END), 'invalid-vin')
    // I, O and Q never appear in a VIN.
    assert.equal(vinStatus('2HKRW2I57MH612345', START, END), 'invalid-vin')
  })
})

describe('trimStatus', () => {
  test('rules out a trim the document excludes, whatever the casing', () => {
    assert.equal(trimStatus('LX', ['LX']), 'excluded')
    assert.equal(trimStatus('lx', ['LX']), 'excluded')
  })

  test('keeps a trim the document does not exclude', () => {
    assert.equal(trimStatus('EX', ['LX']), 'not-excluded')
  })

  test('separates a document with no exclusions from a question with no trim', () => {
    assert.equal(trimStatus('EX', null), 'no-exclusions')
    assert.equal(trimStatus('EX', []), 'no-exclusions')
    assert.equal(trimStatus(undefined, ['LX']), 'trim-not-given')
  })
})
