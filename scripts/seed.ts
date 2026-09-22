import {createClient} from '@sanity/client'
import {loadEnvConfig} from '@next/env'

/**
 * The curated layer on top of the NHTSA import: what the documents claim, and
 * where those claims pull against each other.
 *
 * scripts/import-nhtsa.ts brings in the records as NHTSA publishes them. This
 * adds what reading them takes: which bulletin version is current, which trim
 * a bulletin leaves out, and the claims and contradictions the agent reasons
 * over. Every claim quotes the words it rests on, and the quotes come from the
 * documents linked on each source, including the full bulletin PDFs where the
 * NHTSA summary stops short.
 *
 *   npm run import:nhtsa    first, so there is something to annotate
 *   npm run seed
 *   npm run seed -- --clean    removes the claims and contradictions
 *
 * Ids are fixed and writes replace, so running this twice gives the same
 * dataset rather than a second copy. It builds its own client rather than
 * importing lib/sanity/writeClient, which imports server-only and throws
 * outside a React Server Component.
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

interface Ref {
  _type: 'reference'
  _ref: string
}

function ref(_ref: string): Ref {
  return {_type: 'reference', _ref}
}

interface Overlay {
  _id: string
  set: {
    title?: string
    status?: 'active' | 'superseded' | 'revised'
    excludedTrims?: string[]
  }
}

interface ClaimDoc {
  _id: string
  _type: 'claim'
  statement: string
  quote: string
  source: Ref
  appliesToModels: string[]
  appliesToYears: number[]
  confidence: 'verified' | 'reported' | 'disputed'
  extractedAt: string
  managedBy: 'seed'
}

interface ContradictionDoc {
  _id: string
  _type: 'contradiction'
  topic: string
  claimA: Ref
  claimB: Ref
  explanation: string
  status: 'unresolved' | 'resolved'
  managedBy: 'seed'
}

const managedBy = 'seed'

// Document ids written by the import, named here once.
const V1 = 'nhtsa-mc-11035885'
const V2 = 'nhtsa-mc-11035781'
const OWNER_LETTER = 'nhtsa-mc-11037300'
const DEALER_SEARCH_2021 = 'nhtsa-mc-10189042'
const PE = 'nhtsa-inv-PE22003'
const EA = 'nhtsa-inv-EA24002'
const COMPLAINT_2017 = 'nhtsa-cmp-11561420'
const COMPLAINT_2021 = 'nhtsa-cmp-11679500'

// --------------------------------------------------------------- overlays

/**
 * NHTSA lists both versions of 26-091 as separate, equally current records.
 * Only the bulletin itself says version 2 supersedes version 1, and only its
 * applies-to table says the LX is left out, so both facts are added here.
 */
const overlays: Overlay[] = [
  {
    _id: V1,
    set: {
      title: 'MC-11035885: Service Bulletin 26-091, version 1, CMBS software update',
      status: 'superseded',
      excludedTrims: ['LX'],
    },
  },
  {
    _id: V2,
    set: {
      title: 'MC-11035781: Service Bulletin 26-091, version 2, Honda Sensing software update',
      status: 'active',
      excludedTrims: ['LX'],
    },
  },
  {
    _id: OWNER_LETTER,
    set: {
      title: 'MC-11037300: owner letter for Service Bulletin 26-091, free Honda Sensing software update',
    },
  },
  {
    _id: DEALER_SEARCH_2021,
    set: {
      title: 'MC-10189042: dealer message, Honda asks dealers to find CR-Vs with unexpected CMBS braking',
    },
  },
]

// ----------------------------------------------------------------- claims

const extractedAt = '2026-09-22T00:00:00.000Z'
const CRV = ['CR-V']
const UPDATE_YEARS = [2017, 2018, 2019]

const claims: ClaimDoc[] = [
  {
    _id: 'claim-update-scope',
    _type: 'claim',
    statement:
      'Service Bulletin 26-091 applies to 2017 to 2019 CR-V in every trim except the LX. It publishes no VIN range: a dealer confirms each car with a VIN status check.',
    quote: 'Do an iN VIN status inquiry to make sure the vehicle is shown as eligible.',
    source: ref(V2),
    appliesToModels: CRV,
    appliesToYears: UPDATE_YEARS,
    confidence: 'verified',
    extractedAt,
    managedBy,
  },
  {
    _id: 'claim-update-remedy',
    _type: 'claim',
    statement: 'The repair is a software update to the adaptive cruise control and CMBS.',
    quote: 'Update the ACC / CMBS to the most current software version.',
    source: ref(V2),
    appliesToModels: CRV,
    appliesToYears: UPDATE_YEARS,
    confidence: 'verified',
    extractedAt,
    managedBy,
  },
  {
    _id: 'claim-update-free',
    _type: 'claim',
    statement: 'Owners are told the update is free at any Honda dealer and takes about 20 minutes.',
    quote: 'the total software update process may take approximately 20 minutes',
    source: ref(OWNER_LETTER),
    appliesToModels: CRV,
    appliesToYears: UPDATE_YEARS,
    confidence: 'verified',
    extractedAt,
    managedBy,
  },
  {
    _id: 'claim-v1-software-cause',
    _type: 'claim',
    statement:
      'Version 1 of the bulletin says software programming issues in the driver assistance system can cause unexpected deceleration.',
    quote:
      'Due to software programming issues of the Advanced Driver Assistance System (ADAS), unexpected vehicle deceleration may occur.',
    source: ref(V1),
    appliesToModels: CRV,
    appliesToYears: UPDATE_YEARS,
    confidence: 'verified',
    extractedAt,
    managedBy,
  },
  {
    _id: 'claim-v2-purpose',
    _type: 'claim',
    statement:
      'Version 2 supersedes version 1 and describes the update as changing when and how hard the driver assistance system slows the car, to enhance the driver experience.',
    quote:
      'to enhance driver experience by modifying the circumstances when the advanced driver assist system (ADAS) decelerates the vehicle or the extent of deceleration',
    source: ref(V2),
    appliesToModels: CRV,
    appliesToYears: UPDATE_YEARS,
    confidence: 'verified',
    extractedAt,
    managedBy,
  },
  {
    _id: 'claim-honda-customer-understanding',
    _type: 'claim',
    statement:
      "During NHTSA's investigation, Honda's analysis suggested some customers did not fully understand the CMBS and its limits.",
    quote: 'some customers possibly had an inadequate understanding of the CMBS and its limitations',
    source: ref(PE),
    appliesToModels: CRV,
    appliesToYears: UPDATE_YEARS,
    confidence: 'verified',
    extractedAt,
    managedBy,
  },
  {
    _id: 'claim-dealers-called-it-normal',
    _type: 'claim',
    statement:
      'Many owners complain that dealers could not reproduce the braking, or told them it was normal CMBS operation.',
    quote:
      'Honda dealerships were unable to reproduce the condition or state that they were informed that this is considered normal CMBS operation',
    source: ref(PE),
    appliesToModels: CRV,
    appliesToYears: UPDATE_YEARS,
    confidence: 'reported',
    extractedAt,
    managedBy,
  },
  {
    _id: 'claim-investigation-scope',
    _type: 'claim',
    statement:
      'NHTSA upgraded its investigation to engineering analysis EA24-002 in April 2024 and widened it to 2020 to 2022 CR-V. It has not closed.',
    quote: 'The scope has been expanded to include assessment of model year 2020-2022 Honda CR-V and Accord vehicles.',
    source: ref(EA),
    appliesToModels: CRV,
    appliesToYears: [2017, 2018, 2019, 2020, 2021, 2022],
    confidence: 'verified',
    extractedAt,
    managedBy,
  },
  {
    _id: 'claim-honda-searching-for-cause',
    _type: 'claim',
    statement:
      'Through 2021 Honda was asking dealers to find 2017 to 2021 CR-Vs with unexpected CMBS braking so it could work out the cause.',
    quote: 'To better understand the cause of this condition, AHM would like to collect specific information from the vehicle',
    source: ref(DEALER_SEARCH_2021),
    appliesToModels: CRV,
    appliesToYears: [2017, 2018, 2019, 2020, 2021],
    confidence: 'verified',
    extractedAt,
    managedBy,
  },
  {
    _id: 'claim-owner-2017-not-replicated',
    _type: 'claim',
    statement:
      'The owner of a 2017 CR-V reports the car braked to a stop with nothing ahead, and the dealer could not replicate it.',
    quote: 'Took it to the dealer the following day and they could not replicate the incident.',
    source: ref(COMPLAINT_2017),
    appliesToModels: CRV,
    appliesToYears: [2017],
    confidence: 'reported',
    extractedAt,
    managedBy,
  },
  {
    _id: 'claim-owner-2021-told-normal',
    _type: 'claim',
    statement:
      'The owner of a 2021 CR-V reports the automatic emergency braking engaged three or four times on the freeway with nothing ahead, and the dealer called it normal.',
    quote: 'they told me it is normal and I should just be a good driver',
    source: ref(COMPLAINT_2021),
    appliesToModels: CRV,
    appliesToYears: [2021],
    confidence: 'reported',
    extractedAt,
    managedBy,
  },
]

// --------------------------------------------------------- contradictions

const contradictions: ContradictionDoc[] = [
  {
    _id: 'contradiction-braking-cause',
    _type: 'contradiction',
    topic: 'Cause of unexpected CMBS braking',
    claimA: ref('claim-honda-customer-understanding'),
    claimB: ref('claim-v1-software-cause'),
    explanation:
      "While NHTSA investigated, Honda pointed to customers misunderstanding the system, and owners say dealers called the braking normal. In July 2026 Honda's own bulletin named software programming issues as the cause of unexpected deceleration. For a 2017 to 2019 CR-V the practical answer is the same either way, since the update exists and is free, but anyone told the braking was normal has Honda's later words against that.",
    status: 'unresolved',
    managedBy,
  },
  {
    _id: 'contradiction-bulletin-wording',
    _type: 'contradiction',
    topic: 'How Honda describes the 26-091 update',
    claimA: ref('claim-v1-software-cause'),
    claimB: ref('claim-v2-purpose'),
    explanation:
      "One bulletin, two versions a week apart. Version 2 supersedes version 1 and is the one dealers work from, but it names no cause. Version 1 is the only Honda document in this record that does. Both remain in NHTSA's file.",
    status: 'unresolved',
    managedBy,
  },
  {
    _id: 'contradiction-fix-model-years',
    _type: 'contradiction',
    topic: 'Model years with a published fix',
    claimA: ref('claim-investigation-scope'),
    claimB: ref('claim-update-scope'),
    explanation:
      "NHTSA's open investigation covers 2017 to 2022 CR-V, but Honda's update covers 2017 to 2019 only. A 2020 to 2022 CR-V is inside the investigation with no published remedy, and nothing in the record says whether one is coming.",
    status: 'unresolved',
    managedBy,
  },
]

// ------------------------------------------------------------------- run

async function clean() {
  const ids: string[] = await client.fetch(
    `*[_type in ["claim", "contradiction"] && managedBy == "seed"]._id`,
  )
  if (ids.length === 0) {
    console.log('Nothing to clean.')
    return
  }
  const tx = ids.reduce((t, id) => t.delete(id), client.transaction())
  await tx.commit()
  console.log(`Deleted ${ids.length} curated documents. Imported sources are left alone.`)
}

async function seed() {
  const wanted = [...new Set([...overlays.map((o) => o._id), ...claims.map((c) => c.source._ref)])]
  const found: string[] = await client.fetch(`*[_id in $wanted]._id`, {wanted})
  const missing = wanted.filter((id) => !found.includes(id))
  if (missing.length > 0) {
    throw new Error(`Missing imported sources: ${missing.join(', ')}. Run npm run import:nhtsa first.`)
  }

  // Claims before contradictions, so references resolve in order. One
  // transaction, so a failure leaves nothing half written.
  //
  // Each array is walked separately rather than concatenated: createOrReplace
  // is generic over the document it is handed, and a mixed array resolves that
  // generic against the first element then rejects every other type.
  const tx = client.transaction()
  for (const {_id, set} of overlays) tx.patch(_id, (patch) => patch.set(set))
  for (const doc of claims) tx.createOrReplace(doc)
  for (const doc of contradictions) tx.createOrReplace(doc)
  await tx.commit()

  console.log(`Annotated ${overlays.length} imported sources`)
  console.log(`Seeded ${claims.length} claims`)
  console.log(`Seeded ${contradictions.length} contradictions`)
  console.log(`\nProject ${projectId}, dataset ${dataset}`)
}

const run = process.argv.includes('--clean') ? clean : seed

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
