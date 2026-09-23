import assert from 'node:assert/strict'
import {describe, test} from 'node:test'
import {classifyCitations, extractCitationIds, quoteAppearsIn} from '../lib/agent/citations'

describe('extractCitationIds', () => {
  test('returns each id once, in the order it first appears', () => {
    const answer = 'One [EA24-002], two [MC-11035781], again [EA24-002].'
    assert.deepEqual(extractCitationIds(answer), ['EA24-002', 'MC-11035781'])
  })

  test('ignores brackets that are not ids', () => {
    const answer = 'The [CR-V] is covered [see below] and cited [PE22-003].'
    assert.deepEqual(extractCitationIds(answer), ['PE22-003'])
  })

  test('ignores a markdown link, which is a bracket followed by a parenthesis', () => {
    assert.deepEqual(extractCitationIds('[EA24-002](https://example.test)'), [])
  })
})

describe('classifyCitations', () => {
  test('marks an id the agent never retrieved as unverified', () => {
    const retrieved = ['# EA24-002: Inadvertent Automatic Emergency Braking']
    const citations = classifyCitations('Open [EA24-002], and [ODI-99999999].', retrieved)
    assert.deepEqual(citations, [
      {id: 'EA24-002', verified: true},
      {id: 'ODI-99999999', verified: false},
    ])
  })

  test('matches whole tokens, so a cited 20-04 is not verified by a retrieved 20-042', () => {
    const [citation] = classifyCitations('Covered by [TSB-20-04].', ['Service Bulletin TSB-20-042'])
    assert.equal(citation.verified, false)
  })

  test('ignores case, since ids are written the way the source prints them', () => {
    const [citation] = classifyCitations('See [EA24-002].', ['investigation ea24-002 opened'])
    assert.equal(citation.verified, true)
  })
})

describe('quoteAppearsIn', () => {
  const document = `# MC-11035885: Honda Service Bulletin 26-091, version 1

Background: "American Honda has identified a condition that may affect Collision
Mitigation Braking System (CMBS) operation. Due to **software programming
issues** of the Advanced Driver Assistance System (ADAS), unexpected vehicle
deceleration may occur."`

  test('accepts a quote whose words are in the document', () => {
    assert.equal(quoteAppearsIn('unexpected vehicle deceleration may occur', [document]), true)
  })

  test('accepts wording split across lines, since the line break is not part of the quote', () => {
    assert.equal(quoteAppearsIn('a condition that may affect Collision Mitigation', [document]), true)
  })

  test('ignores markdown emphasis in the document', () => {
    assert.equal(quoteAppearsIn('software programming issues', [document]), true)
  })

  test('ignores curly quotes and case', () => {
    assert.equal(quoteAppearsIn('“UNEXPECTED VEHICLE DECELERATION”', [document]), true)
  })

  test('checks each piece of a quote broken by an ellipsis', () => {
    assert.equal(quoteAppearsIn('American Honda has identified … may occur', [document]), true)
    assert.equal(quoteAppearsIn('American Honda has identified … issued a recall', [document]), false)
  })

  test('rejects words the document does not contain', () => {
    assert.equal(quoteAppearsIn('a defect in the brake master cylinder', [document]), false)
  })

  test('rejects a real quote checked against the wrong document', () => {
    const other = '# MC-11035781: version 2. Corrective action: update the ACC and CMBS software.'
    assert.equal(quoteAppearsIn('software programming issues', [other]), false)
  })

  test('holds when the quote has no words left to check', () => {
    assert.equal(quoteAppearsIn('...', [document]), true)
  })
})
