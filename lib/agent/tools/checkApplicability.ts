import {tool} from 'ai'
import {z} from 'zod'
import {trimStatus, vinStatus} from '@/lib/agent/applicability'
import {lookupVehicle} from '@/lib/sanity/lookup'

export const checkApplicability = tool({
  description:
    'Look up which source documents apply to a vehicle, together with every contradiction between claims in those documents, the approved decision that settled it if there is one, and any proposal still awaiting review. ' +
    'Use it once you know the year, make and model, before answering, so you know whether a disagreement is already settled or still open. ' +
    'Pass the trim and VIN when you have them. A document that leaves out some trims comes back marked excluded or not-excluded for the given trim, or trim-not-given when it names exclusions and you passed no trim, which is worth asking about. ' +
    'A document with a VIN range comes back marked in-range or out-of-range, where the range covers the cars one specific remedy in that document applies to, not whether the document applies at all, so read its claims rather than discarding it. ' +
    'A range that cannot be read comes back as range-unreadable, which is a fact about the record and not about the car, so do not tell the user their vehicle falls outside it. ' +
    'This returns structured records, not document text. Read the knowledge base for the full wording, using the entry paths in its outline: a sourceUrl here is a public link for the user, not a knowledge base path.',
  inputSchema: z.object({
    year: z.number().int().optional().describe('Model year, for example 2021'),
    make: z.string().optional().describe('Manufacturer, for example Honda'),
    model: z.string().optional().describe('Model name, for example CR-V'),
    trim: z.string().optional().describe('Trim level, for example LX or EX'),
    vin: z.string().optional().describe('17 character VIN, when the user has given one'),
  }),
  execute: async ({year, make, model, trim, vin}) => {
    const {sources, contradictions} = await lookupVehicle({year, make, model})

    return {
      vehicle: {year, make, model, trim, vin},
      sources: sources.map(({vinRangeStart, vinRangeEnd, ...source}) => ({
        ...source,
        trim: trimStatus(trim, source.excludedTrims),
        vin: vinStatus(vin, vinRangeStart, vinRangeEnd),
      })),
      contradictions,
    }
  },
})
