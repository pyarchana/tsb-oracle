/**
 * Development fixtures shaped like a real Knowledge Base build.
 *
 * These stand in for the Knowledge Base until it is ingested, so they mirror the
 * documents in scripts/seed.ts: the same five sources under the same bulletin
 * numbers. If the two drift apart, the agent cites whatever it can find, and an
 * entry with no bulletin number in it gets cited by its path instead.
 */

export const STUB_KB_ID = 'kbSTUBCRV0000001'

export const STUB_OUTLINE = `## Honda CR-V CVT shudder: what the sources say and where they disagree
Knowledge base id: ${STUB_KB_ID}
5 entries.
crv/cvt-shudder/tsb-20-042 [core]
  2020 bulletin prescribing a CVT software update
  topics: Software update, Shudder, 2017 to 2020
crv/cvt-shudder/tsb-22-018 [core]
  2022 revision prescribing hardware replacement below a build date cutoff
  topics: Torque converter, VIN range, Supersession
  related: crv/cvt-shudder/tsb-20-042
crv/cvt-shudder/owner-reports
  Owner accounts of the software update failing to resolve shudder
crv/cvt-shudder/recall-21v812 [peripheral]
  NHTSA campaign record for the affected powertrain
crv/cvt-shudder/owner-manual [peripheral]
  What the owner manual calls normal CVT behaviour`

export const STUB_ENTRIES: Record<string, string> = {
  'crv/cvt-shudder/tsb-20-042': `# TSB 20-042: CVT judder during light acceleration

Applies to 2017 to 2020 CR-V. Customers report a shudder between 25 and 40 mph
under light throttle. The cause is CVT clutch slip under low line pressure.

The prescribed repair is a CVT control software update. No hardware replacement
is authorized under this bulletin.

Source: Honda TSB 20-042, published 2020-03-11. Status: superseded.`,

  'crv/cvt-shudder/tsb-22-018': `# TSB 22-018: CVT judder, revised repair procedure

Supersedes TSB 20-042. Applies to 2017 to 2022 CR-V.

The software update in TSB 20-042 did not resolve the condition on vehicles
built before June 2021. For those vehicles the torque converter assembly must be
replaced. Vehicles built on or after June 2021 remain on the software remedy.

Source: Honda TSB 22-018, published 2022-06-02. Status: active.`,

  'crv/cvt-shudder/owner-reports': `# FORUM-CVT-001: owner thread on software update outcomes

Multiple owners of 2019 and 2020 CR-V report that the CVT software update was
applied by a dealer and the shudder returned within a few hundred miles.

This is uncorroborated owner testimony, not a manufacturer finding. It is kept
because it conflicts with the remedy in TSB 20-042.

Source: FORUM-CVT-001, curated owner forum thread, 2021-08-22. Confidence: reported.`,

  'crv/cvt-shudder/recall-21v812': `# 21V-812: NHTSA campaign, powertrain inspection and repair

A powertrain campaign covering certain 2017 to 2021 CR-V model years is on file.
The campaign covers inspection and, where the condition is confirmed, repair
under warranty.

Source: NHTSA campaign 21V-812, 2021-11-18.`,

  'crv/cvt-shudder/owner-manual': `# OM-CRV-2021: continuously variable transmission operation

Some variation in engine note during acceleration is a normal characteristic of
a CVT. A pronounced shudder or vibration under light throttle is not normal
operation and should be inspected by a dealer.

Source: owner manual OM-CRV-2021.`,
}
