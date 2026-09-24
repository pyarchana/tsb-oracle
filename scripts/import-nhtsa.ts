import {createClient} from '@sanity/client'
import {loadEnvConfig} from '@next/env'
import {contentHash} from '../lib/content-hash'

/**
 * Imports NHTSA's public record on one safety system for one vehicle line:
 * Honda's service bulletins, dealer messages and owner letters, NHTSA's
 * investigations and recalls, and a handful of owner complaints.
 *
 *   npm run import:nhtsa
 *
 * Every document it writes links back to the NHTSA record it came from, and
 * rerunning it refreshes those records in place. It only sets the fields it
 * owns, so a status or an excluded trim added by scripts/seed.ts survives the
 * next import. Titles belong to the import, which is why the seed runs after
 * it and puts its curated titles back.
 *
 * Every title starts with the NHTSA id. Knowledge Base entries label their
 * sources by title, so an id that only lived in a field never reached the
 * agent, and a complaint it cited as ODI-11561420 could not be verified.
 *
 * The API needs no key. Nothing here is fetched from anywhere else.
 */

loadEnvConfig(process.cwd())

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_TOKEN

if (!projectId || !dataset) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET')
}
if (!token) {
  throw new Error('Missing SANITY_API_TOKEN. Importing writes documents and needs a write token.')
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2026-09-01',
  useCdn: false,
})

const NHTSA = 'https://api.nhtsa.gov'

const VEHICLE = {make: 'HONDA', model: 'CR-V', years: [2017, 2018, 2019, 2020, 2021, 2022]}

/**
 * What counts as part of the story. The component filter alone misses Honda's
 * own 2020 and 2021 messages about unexpected CMBS braking, because NHTSA files
 * those under service brakes, so a text match on the system's name backs it up.
 */
const ISSUE = {
  component: /FORWARD COLLISION AVOIDANCE/,
  text: /\bCMBS\b|collision mitigation brak/i,
}

/**
 * Complaints are picked one by one. NHTSA holds over a thousand about this
 * system on these model years, and importing them all would bury the handful
 * of documents that settle anything. These are the ones the curated claims in
 * scripts/seed.ts rest on.
 */
const COMPLAINTS = [11561420, 11679500]

// ------------------------------------------------------------ NHTSA shapes

interface Component {
  name: string
}

interface Communication {
  manufacturerCommunicationNumber: string
  nhtsaIdNumber: number
  summary: string | null
  communicationDate: string
  components: Component[]
  associatedDocuments: string
}

interface Investigation {
  nhtsaActionNumber: string
  subject: string
  summary: string
  dateOpened: string
  dateClosed: string | null
  components: Component[]
  associatedDocuments: string
}

interface Recall {
  nhtsaCampaignNumber: string
  reportReceivedDate: string
  subject: string
  summary: string
  consequence: string
  correctiveAction: string
  components: Component[]
}

interface Complaint {
  nhtsaIdNumber: number
  dateFiled: string
  crash: boolean
  numberOfInjuries: number
  description: string
  components: Component[]
}

interface VehicleRecord {
  safetyIssues: {
    manufacturerCommunications: Communication[]
    investigations: Investigation[]
    recalls: Recall[]
    complaints: Complaint[]
  }
}

interface AssociatedDocument {
  fileName: string
  summary: string | null
  url: string
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} from ${url}`)
  return response.json() as Promise<T>
}

/**
 * One request per model year returns every issue type for that year, once per
 * drivetrain. The same record shows up under several trims and years, so each
 * is keyed by its NHTSA id and collects the years it was seen under.
 */
async function fetchVehicleYears() {
  const seen = {
    communications: new Map<number, {record: Communication; years: Set<number>}>(),
    investigations: new Map<string, {record: Investigation; years: Set<number>}>(),
    recalls: new Map<string, {record: Recall; years: Set<number>}>(),
    complaints: new Map<number, {record: Complaint; years: Set<number>}>(),
  }

  function collect<K, R>(map: Map<K, {record: R; years: Set<number>}>, key: K, record: R, year: number) {
    const entry = map.get(key) ?? {record, years: new Set<number>()}
    entry.years.add(year)
    map.set(key, entry)
  }

  for (const year of VEHICLE.years) {
    const params = new URLSearchParams({
      modelYear: String(year),
      make: VEHICLE.make,
      model: VEHICLE.model,
      issueType: 'm',
    })
    const {results} = await getJson<{results: VehicleRecord[]}>(`${NHTSA}/vehicles/byYmmt?${params}`)

    for (const {safetyIssues: issues} of results) {
      for (const c of issues.manufacturerCommunications) collect(seen.communications, c.nhtsaIdNumber, c, year)
      for (const i of issues.investigations) collect(seen.investigations, i.nhtsaActionNumber, i, year)
      for (const r of issues.recalls) collect(seen.recalls, r.nhtsaCampaignNumber, r, year)
      for (const c of issues.complaints) collect(seen.complaints, c.nhtsaIdNumber, c, year)
    }
  }

  return seen
}

function aboutTheIssue(components: Component[], ...text: (string | null)[]) {
  return components.some((c) => ISSUE.component.test(c.name)) || text.some((t) => t && ISSUE.text.test(t))
}

async function documentsFor(associatedDocuments: string, key: string) {
  const {results} = await getJson<{results: Record<string, {associatedDocuments: AssociatedDocument[]}[]>[]}>(
    associatedDocuments,
  )
  return results[0]?.[key]?.[0]?.associatedDocuments ?? []
}

// ------------------------------------------------------------ Sanity shapes

interface Block {
  _type: 'block'
  _key: string
  style: 'normal'
  markDefs: []
  children: {_type: 'span'; _key: string; text: string; marks: []}[]
}

type SourceType = 'tsb' | 'dealer-message' | 'owner-letter' | 'recall' | 'investigation' | 'complaint'

interface Imported {
  _id: string
  title: string
  facts: {
    tsbNumber: string
    manufacturerNumber?: string
    make: string
    model: string
    modelYears: number[]
    publishDate: string
    sourceUrl: string
    sourceType: SourceType
    status?: 'active' | 'closed'
    body: Block[]
    contentHash: string
    nhtsaIds: string[]
    retrievedAt: string
    managedBy: 'nhtsa-import'
  }
}

const retrievedAt = new Date().toISOString()

/**
 * Fingerprints the record's own words, not the paragraphs this script composes
 * around them. The line saying an investigation was still open when we fetched
 * it changes on every run, and a hash that moves every run would report a
 * revision that never happened.
 */
function fingerprint(paragraphs: (string | null | undefined)[]): string {
  return contentHash(paragraphs.filter(Boolean).join('\n'))
}

function body(id: string, paragraphs: string[]): Block[] {
  return paragraphs.map((text, i) => ({
    _type: 'block',
    _key: `${id}-b${i}`,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: `${id}-b${i}-s`, text, marks: []}],
  }))
}

function sortedYears(years: Set<number>) {
  return [...years].sort((a, b) => a - b)
}

function day(iso: string) {
  return iso.slice(0, 10)
}

/**
 * Investigation summaries arrive as HTML paragraphs. Everything else is plain
 * text hard-wrapped mid-sentence, where only a blank line is a real break.
 */
function clean(text: string) {
  const paragraphs = text.includes('</p>') ? text.split('</p>') : text.split(/\n\s*\n/)
  return paragraphs
    .map((p) =>
      p
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean)
}

function shorten(text: string, max = 90) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' '))}...`
}

/** EA24002 is written EA24-002 everywhere NHTSA displays it. */
function actionNumber(raw: string) {
  return `${raw.slice(0, 4)}-${raw.slice(4)}`
}

/** 24V064000 is written 24V-064. */
function campaignNumber(raw: string) {
  return `${raw.slice(0, 3)}-${raw.slice(3, 6)}`
}

/**
 * NHTSA prefixes each summary with the kind of document it is, and that
 * prefix is the only place the kind is recorded.
 */
function communicationKind(summary: string): {sourceType: SourceType; text: string} {
  const [, prefix = '', rest = summary] = summary.match(/^"?\s*([A-Za-z ]+?)\s+-\s+([\s\S]*)$/) ?? []
  const text = rest.replace(/"$/, '')
  if (/owner notification letter/i.test(prefix)) return {sourceType: 'owner-letter', text}
  if (/^service bulletin$/i.test(prefix)) return {sourceType: 'tsb', text}
  return {sourceType: 'dealer-message', text}
}

// ----------------------------------------------------------------- mapping

/**
 * Honda resends the same dealer message every few weeks, and NHTSA files each
 * resend as its own record. They are merged into one document per distinct
 * text, cited by the first record's id and dated from the first send, with
 * every record id kept.
 */
async function communications(seen: Awaited<ReturnType<typeof fetchVehicleYears>>['communications']) {
  const groups = new Map<string, {records: Communication[]; years: Set<number>}>()

  for (const {record, years} of seen.values()) {
    if (!record.summary || !aboutTheIssue(record.components, record.summary)) continue
    const key = record.summary.replace(/\s+/g, ' ').trim().toLowerCase()
    const group = groups.get(key) ?? {records: [], years: new Set<number>()}
    group.records.push(record)
    for (const y of years) group.years.add(y)
    groups.set(key, group)
  }

  const docs: Imported[] = []
  for (const {records, years} of groups.values()) {
    records.sort((a, b) => a.communicationDate.localeCompare(b.communicationDate))
    const first = records[0]
    const last = records[records.length - 1]
    const {sourceType, text} = communicationKind(first.summary!)

    const pdfs = await documentsFor(last.associatedDocuments, 'manufacturerCommunications')
    const paragraphs = clean(text)
    if (records.length > 1) {
      paragraphs.push(
        `Sent ${records.length} times between ${day(first.communicationDate)} and ${day(last.communicationDate)}.`,
      )
    }

    docs.push({
      _id: `nhtsa-mc-${first.nhtsaIdNumber}`,
      title: `MC-${first.nhtsaIdNumber}: ${first.manufacturerCommunicationNumber}, ${shorten(paragraphs[0])}`,
      facts: {
        tsbNumber: `MC-${first.nhtsaIdNumber}`,
        manufacturerNumber: first.manufacturerCommunicationNumber,
        make: 'Honda',
        model: 'CR-V',
        modelYears: sortedYears(years),
        publishDate: day(first.communicationDate),
        sourceUrl: pdfs[0]?.url ?? last.associatedDocuments,
        sourceType,
        body: body(`mc${first.nhtsaIdNumber}`, paragraphs),
        contentHash: fingerprint(paragraphs),
        nhtsaIds: records.map((r) => String(r.nhtsaIdNumber)),
        retrievedAt,
        managedBy: 'nhtsa-import',
      },
    })
  }
  return docs
}

async function investigations(seen: Awaited<ReturnType<typeof fetchVehicleYears>>['investigations']) {
  const docs: Imported[] = []
  for (const {record, years} of seen.values()) {
    if (!aboutTheIssue(record.components, record.subject)) continue

    // The resume is NHTSA's own write-up of the case. A closed case has a
    // closing resume that says how it ended, so that one wins.
    const files = await documentsFor(record.associatedDocuments, 'investigations')
    const resume =
      files.find((d) => /closing resume/i.test(d.summary ?? '')) ??
      files.find((d) => /opening resume/i.test(d.summary ?? ''))

    const id = actionNumber(record.nhtsaActionNumber)
    docs.push({
      _id: `nhtsa-inv-${record.nhtsaActionNumber}`,
      title: `${id}: ${record.subject}`,
      facts: {
        tsbNumber: id,
        make: 'Honda',
        model: 'CR-V',
        modelYears: sortedYears(years),
        publishDate: day(record.dateOpened),
        sourceUrl: resume?.url ?? record.associatedDocuments,
        sourceType: 'investigation',
        status: record.dateClosed ? 'closed' : 'active',
        body: body(`inv${record.nhtsaActionNumber}`, [
          ...clean(record.summary),
          record.dateClosed
            ? `Opened ${day(record.dateOpened)}, closed ${day(record.dateClosed)}.`
            : `Opened ${day(record.dateOpened)}. Still open when retrieved on ${day(retrievedAt)}.`,
        ]),
        // Closing an investigation is a change in the record. Fetching it again
        // on a Tuesday is not.
        contentHash: fingerprint([...clean(record.summary), record.dateClosed ?? 'open']),
        nhtsaIds: [record.nhtsaActionNumber],
        retrievedAt,
        managedBy: 'nhtsa-import',
      },
    })
  }
  return docs
}

function recalls(seen: Awaited<ReturnType<typeof fetchVehicleYears>>['recalls']) {
  const docs: Imported[] = []
  for (const {record, years} of seen.values()) {
    if (!aboutTheIssue(record.components, record.subject, record.summary)) continue
    const id = campaignNumber(record.nhtsaCampaignNumber)
    docs.push({
      _id: `nhtsa-rcl-${record.nhtsaCampaignNumber}`,
      title: `${id}: ${record.subject}`,
      facts: {
        tsbNumber: id,
        make: 'Honda',
        model: 'CR-V',
        modelYears: sortedYears(years),
        publishDate: day(record.reportReceivedDate),
        sourceUrl: `https://www.nhtsa.gov/recalls?nhtsaId=${id}`,
        sourceType: 'recall',
        body: body(`rcl${record.nhtsaCampaignNumber}`, [
          record.summary,
          record.consequence,
          record.correctiveAction,
        ]),
        contentHash: fingerprint([record.summary, record.consequence, record.correctiveAction]),
        nhtsaIds: [record.nhtsaCampaignNumber],
        retrievedAt,
        managedBy: 'nhtsa-import',
      },
    })
  }
  return docs
}

/**
 * Only the narrative, the date and the crash and injury flags are kept. NHTSA
 * publishes a partial VIN and the owner's town with each complaint, and
 * neither belongs in a public dataset built for something else.
 */
function complaints(seen: Awaited<ReturnType<typeof fetchVehicleYears>>['complaints']) {
  const docs: Imported[] = []
  for (const odi of COMPLAINTS) {
    const entry = seen.get(odi)
    if (!entry) throw new Error(`Complaint ${odi} is not in NHTSA's record for these model years`)
    const {record, years} = entry
    const flags = [
      record.crash ? 'The owner reports a crash.' : 'No crash reported.',
      record.numberOfInjuries > 0 ? `${record.numberOfInjuries} injuries reported.` : 'No injuries reported.',
    ].join(' ')

    docs.push({
      _id: `nhtsa-cmp-${odi}`,
      title: `ODI-${odi}: owner complaint, ${shorten(clean(record.description)[0], 70)}`,
      facts: {
        tsbNumber: `ODI-${odi}`,
        make: 'Honda',
        model: 'CR-V',
        modelYears: sortedYears(years),
        publishDate: day(record.dateFiled),
        sourceUrl: `${NHTSA}/complaints/odinumber?odinumber=${odi}`,
        sourceType: 'complaint',
        body: body(`cmp${odi}`, [...clean(record.description), flags]),
        contentHash: fingerprint([...clean(record.description), flags]),
        nhtsaIds: [String(odi)],
        retrievedAt,
        managedBy: 'nhtsa-import',
      },
    })
  }
  return docs
}

// --------------------------------------------------------------------- run

async function run() {
  const seen = await fetchVehicleYears()

  const groups = {
    communications: await communications(seen.communications),
    investigations: await investigations(seen.investigations),
    recalls: recalls(seen.recalls),
    complaints: complaints(seen.complaints),
  }

  const incoming = Object.values(groups).flat()

  // A reissued document keeps its id, so without this the new wording would
  // replace the old one with nothing said about it, and every quote taken from
  // the old text would quietly be a quote from a version nobody holds.
  const stored: {_id: string; contentHash: string | null}[] = await client.fetch(
    `*[_type == "tsb" && _id in $ids]{_id, contentHash}`,
    {ids: incoming.map((d) => d._id)},
  )
  const before = new Map(stored.map((doc) => [doc._id, doc.contentHash]))
  const revised = incoming.filter(
    ({_id, facts}) => before.get(_id) && before.get(_id) !== facts.contentHash,
  )

  // createIfNotExists sets a starting status once; the patch then overwrites
  // the fields this script owns, title included.
  const tx = client.transaction()
  for (const {_id, title, facts} of incoming) {
    tx.createIfNotExists({_id, _type: 'tsb', title, status: 'active'})
    tx.patch(_id, (patch) => patch.set({...facts, title}))
  }
  await tx.commit()

  for (const [name, docs] of Object.entries(groups)) {
    console.log(`${String(docs.length).padStart(3)} ${name}`)
  }
  const records = groups.communications.reduce((n, d) => n + d.facts.nhtsaIds.length, 0)
  console.log(`\nThe ${groups.communications.length} communications merge ${records} NHTSA records.`)

  if (revised.length > 0) {
    console.log(`\n${revised.length} document(s) changed wording since the last import:`)
    for (const {title} of revised) console.log(`  ${title}`)
    console.log('Rerun the seed so its claims record the text they were taken from.')
  }
  console.log(`Project ${projectId}, dataset ${dataset}`)
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
