/**
 * Development fixtures shaped like a real Knowledge Base build.
 *
 * These exist so the agent loop can be built before the Knowledge Base is
 * ingested on day 7. They are deliberately thin. Once the real endpoint is
 * live the stub stops being used and these stop mattering.
 */

export const STUB_KB_ID = 'kbSTUBCRV0000001'

export const STUB_OUTLINE = `## Honda CR-V CVT shudder: what the bulletins say and where they disagree
Knowledge base id: ${STUB_KB_ID}
4 entries.
crv/cvt-shudder/tsb-20-042 [core]
  2020 bulletin prescribing a CVT software update
  topics: Software update, Shudder, 2017 to 2020
crv/cvt-shudder/tsb-22-018 [core]
  2022 revision prescribing hardware replacement below a VIN cutoff
  topics: Torque converter, VIN range, Supersession
  related: crv/cvt-shudder/tsb-20-042
crv/cvt-shudder/owner-reports
  Owner accounts of the software update failing to resolve shudder
crv/cvt-shudder/recall-notice [peripheral]
  NHTSA campaign record for the affected powertrain`

export const STUB_ENTRIES: Record<string, string> = {
  'crv/cvt-shudder/tsb-20-042': `# Honda TSB 20-042: CVT judder during light acceleration

Applies to 2017 to 2020 CR-V. Customers report a shudder between 25 and 40 mph
under light throttle. The cause is CVT clutch slip under low line pressure.

The prescribed repair is a CVT control software update. No hardware replacement
is authorized under this bulletin.

Source: Honda TSB 20-042, published 2020-03-11. Status: superseded.`,

  'crv/cvt-shudder/tsb-22-018': `# Honda TSB 22-018: CVT judder, revised repair

Supersedes TSB 20-042. Applies to 2017 to 2022 CR-V.

The software update in TSB 20-042 did not resolve the condition on vehicles
built before June 2021. For those VINs the torque converter assembly must be
replaced. Vehicles built on or after June 2021 remain on the software remedy.

Source: Honda TSB 22-018, published 2022-06-02. Status: active.`,

  'crv/cvt-shudder/owner-reports': `# Owner reports: software update outcomes

Multiple owners of 2019 and 2020 CR-V report that the CVT software update was
applied by a dealer and the shudder returned within a few hundred miles.

This is uncorroborated owner testimony, not a manufacturer finding. It is
included because it conflicts with the remedy in TSB 20-042.

Source: curated owner forum thread summary. Confidence: reported.`,

  'crv/cvt-shudder/recall-notice': `# NHTSA campaign record

A powertrain campaign covering certain CR-V model years is on file. The campaign
covers inspection and, where the condition is confirmed, repair under warranty.

Source: NHTSA recall notice.`,
}
