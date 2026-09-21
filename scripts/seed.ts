import {createClient} from '@sanity/client'
import {loadEnvConfig} from '@next/env'

/**
 * Seeds the demo dataset: one vehicle, one symptom, and the disagreements
 * between the documents that describe it.
 *
 * Every document carries seedDemoData so it can be found and cleared. Ids are
 * fixed rather than generated, and writes use createOrReplace, so running this
 * twice produces the same dataset instead of a second copy of it.
 *
 *   npm run seed
 *   npm run seed -- --clean    removes every seeded document
 *
 * This builds its own client rather than importing lib/sanity/writeClient,
 * which imports server-only and throws outside a React Server Component.
 */

loadEnvConfig(process.cwd())

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_TOKEN

if (!projectId || !dataset) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET')
}
if (!token) {
  throw new Error('Missing SANITY_API_TOKEN. Seeding writes documents and needs a write token.')
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2026-09-01',
  useCdn: false,
})

/** Portable Text needs a stable _key on every block and span. */
function body(id: string, ...paragraphs: string[]) {
  return paragraphs.map((text, i) => ({
    _type: 'block',
    _key: `${id}-b${i}`,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: `${id}-b${i}-s`, text, marks: []}],
  }))
}

const seedDemoData = true

// ---------------------------------------------------------------- sources

const sources = [
  {
    _id: 'tsb-owner-manual-cvt',
    _type: 'tsb',
    tsbNumber: 'OM-CRV-2021',
    title: 'Owner manual: continuously variable transmission operation',
    make: 'Honda',
    model: 'CR-V',
    modelYears: [2017, 2018, 2019, 2020, 2021, 2022],
    publishDate: '2021-01-04',
    sourceType: 'manual',
    status: 'active',
    seedDemoData,
    body: body(
      'om',
      'The continuously variable transmission adjusts ratio continuously rather than shifting between fixed gears. Some variation in engine note during acceleration is a normal characteristic of this design.',
      'A pronounced shudder or vibration under light throttle is not normal operation and should be inspected by a dealer.',
    ),
  },
  {
    _id: 'tsb-20-042',
    _type: 'tsb',
    tsbNumber: '20-042',
    title: 'CVT judder during light acceleration',
    make: 'Honda',
    model: 'CR-V',
    modelYears: [2017, 2018, 2019, 2020],
    publishDate: '2020-03-11',
    sourceType: 'tsb',
    status: 'superseded',
    seedDemoData,
    body: body(
      't20',
      'Customers report a shudder between 25 and 40 mph under light throttle. The cause is CVT clutch slip under low line pressure.',
      'The prescribed repair is a CVT control software update. No hardware replacement is authorized under this bulletin.',
    ),
  },
  {
    _id: 'tsb-22-018',
    _type: 'tsb',
    tsbNumber: '22-018',
    title: 'CVT judder, revised repair procedure',
    make: 'Honda',
    model: 'CR-V',
    modelYears: [2017, 2018, 2019, 2020, 2021, 2022],
    publishDate: '2022-06-02',
    sourceType: 'tsb',
    status: 'active',
    vinRangeStart: '2HKRW2H80MH000001',
    vinRangeEnd: '2HKRW2H89MH599999',
    seedDemoData,
    body: body(
      't22',
      'This bulletin supersedes TSB 20-042.',
      'The software update in TSB 20-042 did not resolve the condition on vehicles built before June 2021. For those vehicles the torque converter assembly must be replaced.',
      'Vehicles built on or after June 2021 remain on the software remedy described in the superseded bulletin.',
    ),
  },
  {
    _id: 'tsb-nhtsa-21v812',
    _type: 'tsb',
    tsbNumber: '21V-812',
    title: 'NHTSA campaign: powertrain inspection and repair',
    make: 'Honda',
    model: 'CR-V',
    modelYears: [2017, 2018, 2019, 2020, 2021],
    publishDate: '2021-11-18',
    sourceType: 'nhtsa',
    status: 'active',
    seedDemoData,
    body: body(
      'nhtsa',
      'A powertrain campaign covering certain CR-V model years is on file. The campaign covers inspection and, where the condition is confirmed, repair under warranty.',
    ),
  },
  {
    _id: 'tsb-forum-cvt-thread',
    _type: 'tsb',
    tsbNumber: 'FORUM-CVT-001',
    title: 'Owner thread: software update outcomes',
    make: 'Honda',
    model: 'CR-V',
    modelYears: [2019, 2020],
    publishDate: '2021-08-22',
    sourceType: 'forum',
    status: 'active',
    seedDemoData,
    body: body(
      'forum',
      'Multiple owners of 2019 and 2020 CR-V report that the CVT software update was applied by a dealer and the shudder returned within a few hundred miles.',
      'This is uncorroborated owner testimony rather than a manufacturer finding. It is kept because it conflicts with the remedy prescribed in TSB 20-042.',
    ),
  },
]

// ----------------------------------------------------------------- claims

function ref(_ref: string) {
  return {_type: 'reference', _ref}
}

const extractedAt = '2026-09-21T00:00:00.000Z'

const claims = [
  {
    _id: 'claim-software-resolves',
    _type: 'claim',
    statement:
      'A CVT control software update resolves the shudder on 2017 to 2020 CR-V.',
    source: ref('tsb-20-042'),
    appliesToModels: ['CR-V'],
    appliesToYears: [2017, 2018, 2019, 2020],
    confidence: 'verified',
    extractedAt,
    seedDemoData,
  },
  {
    _id: 'claim-no-hardware-authorized',
    _type: 'claim',
    statement: 'No hardware replacement is authorized for this condition.',
    source: ref('tsb-20-042'),
    appliesToModels: ['CR-V'],
    appliesToYears: [2017, 2018, 2019, 2020],
    confidence: 'verified',
    extractedAt,
    seedDemoData,
  },
  {
    _id: 'claim-hardware-required-pre-june-2021',
    _type: 'claim',
    statement:
      'Vehicles built before June 2021 require torque converter replacement. The software update alone does not resolve the condition on them.',
    source: ref('tsb-22-018'),
    appliesToModels: ['CR-V'],
    appliesToYears: [2017, 2018, 2019, 2020, 2021],
    confidence: 'verified',
    extractedAt,
    seedDemoData,
  },
  {
    _id: 'claim-software-remains-post-june-2021',
    _type: 'claim',
    statement:
      'Vehicles built on or after June 2021 remain on the software remedy.',
    source: ref('tsb-22-018'),
    appliesToModels: ['CR-V'],
    appliesToYears: [2021, 2022],
    confidence: 'verified',
    extractedAt,
    seedDemoData,
  },
  {
    _id: 'claim-owners-report-software-failed',
    _type: 'claim',
    statement:
      'The software update did not resolve the shudder. It returned within a few hundred miles.',
    source: ref('tsb-forum-cvt-thread'),
    appliesToModels: ['CR-V'],
    appliesToYears: [2019, 2020],
    confidence: 'reported',
    extractedAt,
    seedDemoData,
  },
  {
    _id: 'claim-some-vibration-normal',
    _type: 'claim',
    statement:
      'Some variation in engine note during acceleration is normal for a CVT, but a pronounced shudder under light throttle is not.',
    source: ref('tsb-owner-manual-cvt'),
    appliesToModels: ['CR-V'],
    appliesToYears: [2017, 2018, 2019, 2020, 2021, 2022],
    confidence: 'verified',
    extractedAt,
    seedDemoData,
  },
  {
    _id: 'claim-campaign-covers-repair',
    _type: 'claim',
    statement:
      'A powertrain campaign covers inspection and, where confirmed, repair under warranty.',
    source: ref('tsb-nhtsa-21v812'),
    appliesToModels: ['CR-V'],
    appliesToYears: [2017, 2018, 2019, 2020, 2021],
    confidence: 'verified',
    extractedAt,
    seedDemoData,
  },
]

// --------------------------------------------------------- contradictions

const contradictions = [
  {
    _id: 'contradiction-shudder-remedy',
    _type: 'contradiction',
    topic: 'CR-V CVT shudder remedy',
    claimA: ref('claim-software-resolves'),
    claimB: ref('claim-hardware-required-pre-june-2021'),
    explanation:
      'TSB 22-018 supersedes 20-042 and splits the remedy on a build date. Vehicles built before June 2021 move to torque converter replacement; later ones stay on the software update. A 2021 CR-V can fall on either side of that cutoff, so the model year alone does not settle it.',
    status: 'unresolved',
    seedDemoData,
  },
  {
    _id: 'contradiction-software-effectiveness',
    _type: 'contradiction',
    topic: 'Software update effectiveness',
    claimA: ref('claim-software-resolves'),
    claimB: ref('claim-owners-report-software-failed'),
    explanation:
      'The manufacturer states the software update resolves the condition. Owners of the same model years report it did not hold. One is a verified manufacturer position and the other is uncorroborated testimony, so they carry different weight, but the later bulletin 22-018 sides with the owners for pre June 2021 vehicles.',
    status: 'unresolved',
    seedDemoData,
  },
]

// ------------------------------------------------------------------- run

const documents = [...sources, ...claims, ...contradictions]

async function clean() {
  const types = ['tsb', 'claim', 'contradiction', 'decision']
  const query = `*[_type in $types && seedDemoData == true]._id`
  const ids: string[] = await client.fetch(query, {types})

  if (ids.length === 0) {
    console.log('Nothing to clean.')
    return
  }

  const tx = ids.reduce((t, id) => t.delete(id), client.transaction())
  await tx.commit()
  console.log(`Deleted ${ids.length} seeded documents.`)
}

async function seed() {
  // Sources before claims before contradictions, so references resolve in
  // order. One transaction, so a failure leaves nothing half written.
  const tx = documents.reduce((t, doc) => t.createOrReplace(doc), client.transaction())
  await tx.commit()

  console.log(`Seeded ${sources.length} source documents`)
  console.log(`Seeded ${claims.length} claims`)
  console.log(`Seeded ${contradictions.length} contradictions`)
  console.log(`\nProject ${projectId}, dataset ${dataset}`)
}

const run = process.argv.includes('--clean') ? clean : seed

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
