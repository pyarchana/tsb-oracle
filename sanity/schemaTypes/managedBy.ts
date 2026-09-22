import {defineField} from 'sanity'

/**
 * Marks a document as owned by a script, so a rerun can find and replace what
 * it wrote last time without touching anything a person or the agent added.
 */
export const managedByField = defineField({
  name: 'managedBy',
  title: 'Managed by',
  type: 'string',
  readOnly: true,
  options: {
    list: [
      {title: 'NHTSA import (scripts/import-nhtsa.ts)', value: 'nhtsa-import'},
      {title: 'Curated seed (scripts/seed.ts)', value: 'seed'},
    ],
  },
  description: 'Blank for anything written by hand or by the agent.',
})
