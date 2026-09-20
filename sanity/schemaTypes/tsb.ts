import {defineField, defineType} from 'sanity'

/**
 * A source document: a manufacturer bulletin, a recall notice, a manual
 * excerpt, or a curated forum thread. Everything the agent cites traces back
 * to one of these.
 */
export const tsb = defineType({
  name: 'tsb',
  title: 'Source document',
  type: 'document',
  fields: [
    defineField({
      name: 'tsbNumber',
      title: 'TSB number',
      type: 'string',
      description: 'Manufacturer bulletin number, for example 20-042.',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'make', type: 'string'}),
    defineField({name: 'model', type: 'string'}),
    defineField({
      name: 'modelYears',
      title: 'Model years',
      type: 'array',
      of: [{type: 'number'}],
      options: {sortable: false},
    }),
    defineField({name: 'publishDate', title: 'Publish date', type: 'date'}),
    defineField({name: 'sourceUrl', title: 'Source URL', type: 'url'}),
    defineField({
      name: 'sourceType',
      title: 'Source type',
      type: 'string',
      options: {
        list: [
          {title: 'Technical service bulletin', value: 'tsb'},
          {title: 'Recall', value: 'recall'},
          {title: 'Owner manual', value: 'manual'},
          {title: 'Forum', value: 'forum'},
          {title: 'NHTSA', value: 'nhtsa'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      type: 'string',
      options: {
        list: [
          {title: 'Active', value: 'active'},
          {title: 'Superseded', value: 'superseded'},
          {title: 'Revised', value: 'revised'},
        ],
        layout: 'radio',
      },
      initialValue: 'active',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'body', type: 'array', of: [{type: 'block'}]}),
    defineField({
      name: 'vinRangeStart',
      title: 'VIN range start',
      type: 'string',
      description: 'Optional. Leave blank when the document applies regardless of VIN.',
    }),
    defineField({name: 'vinRangeEnd', title: 'VIN range end', type: 'string'}),
    defineField({
      name: 'seedDemoData',
      title: 'Seed demo data',
      type: 'boolean',
      description: 'Marks documents created by scripts/seed.ts so they can be found and cleared.',
      initialValue: false,
    }),
  ],
  preview: {
    select: {title: 'title', tsbNumber: 'tsbNumber', status: 'status', sourceType: 'sourceType'},
    prepare({title, tsbNumber, status, sourceType}) {
      return {
        title: tsbNumber ? `${tsbNumber} ${title}` : title,
        subtitle: [sourceType, status].filter(Boolean).join(' / '),
      }
    },
  },
})
