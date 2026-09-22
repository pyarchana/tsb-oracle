/**
 * Development fixtures shaped like a real Knowledge Base build.
 *
 * These stand in for the Knowledge Base until it is ingested, so they mirror
 * what scripts/import-nhtsa.ts and scripts/seed.ts write: the same documents
 * under the same ids, with the bulletin wording quoted from the PDFs those
 * documents link to. If the two drift apart, the agent cites whatever it can
 * find, and an entry with no id in it gets cited by its path instead.
 */

export const STUB_KB_ID = 'kbSTUBCRV0000001'

export const STUB_OUTLINE = `## Honda CR-V automatic emergency braking: the public record
Knowledge base id: ${STUB_KB_ID}
10 entries.
crv/cmbs/sb-26-091-v2 [core]
  Current bulletin: free Honda Sensing software update for 2017 to 2019 CR-V, except LX
  topics: Software update, Trim exclusion, Supersession
  related: crv/cmbs/sb-26-091-v1, crv/cmbs/owner-letter
crv/cmbs/sb-26-091-v1 [core]
  Superseded first version, which names software programming issues as the cause
  topics: Cause, Supersession
crv/cmbs/ea24-002 [core]
  Open NHTSA engineering analysis covering 2017 to 2022 CR-V
  topics: Investigation, Scope, 2020 to 2022
  related: crv/cmbs/pe22-003
crv/cmbs/pe22-003
  Closed NHTSA preliminary evaluation, upgraded to EA24-002
  topics: Investigation, Honda's position, Dealer responses
crv/cmbs/owner-letter
  Letter to owners: the update is free and takes about 20 minutes
crv/cmbs/dealer-message-2026
  July 2026 dealer message repeating the version 1 cause
crv/cmbs/dealer-search-2020
  Honda asks dealers for data on unexpected CMBS braking, 2017 to 2020 CR-V
crv/cmbs/dealer-search-2021
  The same request widened to 2017 to 2021 CR-V
crv/cmbs/complaint-2017 [peripheral]
  2017 owner: braked to a stop with nothing ahead, dealer could not replicate
crv/cmbs/complaint-2021 [peripheral]
  2021 owner: repeated freeway braking, dealer called it normal`

export const STUB_ENTRIES: Record<string, string> = {
  'crv/cmbs/sb-26-091-v2': `# MC-11035781: Honda Service Bulletin 26-091, version 2

Product update for 2017 to 2019 CR-V, all trims except LX, and 2018 to 2020
Accord and Accord Hybrid. No VIN range is published: "Do an iN VIN status
inquiry to make sure the vehicle is shown as eligible."

Background: "Honda has developed software updates to the Honda Sensing system to
enhance driver experience by modifying the circumstances when the advanced
driver assist system (ADAS) decelerates the vehicle or the extent of
deceleration." Corrective action: "Update the ACC / CMBS to the most current
software version."

Supersedes version 1, with the title, background and corrective action revised.

Source: MC-11035781, Honda Service Bulletin 26-091 version 2, 2026-07-31. Status: active.`,

  'crv/cmbs/sb-26-091-v1': `# MC-11035885: Honda Service Bulletin 26-091, version 1

Product update for 2017 to 2019 CR-V, all trims except LX. Background: "American
Honda has identified a condition that may affect Collision Mitigation Braking
System (CMBS) operation. Due to software programming issues of the Advanced
Driver Assistance System (ADAS), unexpected vehicle deceleration may occur."

Source: MC-11035885, Honda Service Bulletin 26-091 version 1, 2026-07-24. Status: superseded by version 2.`,

  'crv/cmbs/ea24-002': `# EA24-002: Inadvertent Automatic Emergency Braking

NHTSA upgraded preliminary evaluation PE22-003 to this engineering analysis and
widened it to 2020 to 2022 CR-V and Accord. ODI has received 1,294 complaints of
inadvertent CMBS activation in 2017 to 2022 CR-V and 2018 to 2022 Accord, 31
alleging a crash and 50 an injury. No recall is attached.

Source: EA24-002, NHTSA engineering analysis, opened 2024-04-15. Status: open.`,

  'crv/cmbs/pe22-003': `# PE22-003: Inadvertent Automatic Emergency Braking

Opened for 2017 to 2019 CR-V and 2018 to 2019 Accord. Honda "alleges that some
customers possibly had an inadequate understanding of the CMBS and its
limitations." Many complaints say dealers could not reproduce the condition or
called it normal CMBS operation. Upgraded to EA24-002.

Source: PE22-003, NHTSA preliminary evaluation, 2022-02-21 to 2024-04-18. Status: closed.`,

  'crv/cmbs/owner-letter': `# MC-11037300: owner letter for Service Bulletin 26-091

Owners are asked to book the software update "for FREE" at any Honda dealer.
"The total software update process may take approximately 20 minutes."

Source: MC-11037300, Honda owner notification letter, 2026-09-09.`,

  'crv/cmbs/dealer-message-2026': `# MC-11035777: dealer message on unexpected deceleration

"Due to software programming issues of the Advanced Driver Assistance System
(ADAS), unexpected vehicle deceleration may occur."

Source: MC-11035777, Honda dealer message AEBM07242026901, 2026-07-24.`,

  'crv/cmbs/dealer-search-2020': `# MC-10179866: Honda searching for CR-Vs with unexpected CMBS operation

Honda asks dealers to collect data from 2017 to 2020 CR-Vs with "a customer
complaint of an unexpected CMBS operation or a brake application" before
attempting any repair. Sent 8 times between 2020-09-10 and 2021-02-15.

Source: MC-10179866, Honda dealer message, 2020-09-10.`,

  'crv/cmbs/dealer-search-2021': `# MC-10189042: the same search, widened to 2021 CR-V

"To better understand the cause of this condition, AHM would like to collect
specific information from the vehicle prior to you attempting a repair of any
kind." Now covers 2017 to 2021 CR-V. Sent 12 times between 2021-03-10 and
2021-10-25.

Source: MC-10189042, Honda dealer message, 2021-03-10.`,

  'crv/cmbs/complaint-2017': `# ODI-11561420: 2017 CR-V owner complaint

"The car just braked and stopped for no reason. Nothing in front of me." The
dealer "could not replicate the incident." No crash or injuries reported.

Source: ODI-11561420, NHTSA owner complaint, 2023-12-22. Confidence: reported.`,

  'crv/cmbs/complaint-2021': `# ODI-11679500: 2021 CR-V owner complaint

The automatic emergency braking "has engaged 3-4 times when there was no object
in front of the vehicle", all on the freeway. The dealer "told me it is normal
and I should just be a good driver". No crash or injuries reported.

Source: ODI-11679500, NHTSA owner complaint, 2025-08-09. Confidence: reported.`,
}
