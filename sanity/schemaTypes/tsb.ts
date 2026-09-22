import {defineField, defineType} from 'sanity'
import {managedByField} from './managedBy'

/**
 * A source document: a service bulletin, a dealer message, an owner letter, a
 * recall, an NHTSA investigation or an owner complaint. Everything the agent
 * cites traces back to one of these, and every one of them links to the public
 * record it came from.
 */
export const tsb = defineType({
  name: 'tsb',
  title: 'Source document',
  type: 'document',
  fields: [
    defineField({
      name: 'tsbNumber',
      title: 'Document id',
      type: 'string',
      description:
        'The id the agent cites. It comes from NHTSA so it is unique: MC-11035781 for a manufacturer communication, EA24-002 for an investigation, ODI-11679500 for a complaint, 24V-064 for a recall.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'manufacturerNumber',
      title: 'Manufacturer number',
      type: 'string',
      description:
        "The manufacturer's own number, for example A26-091. Not unique: Honda reissues a number when it revises a bulletin.",
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
    defineField({
      name: 'excludedTrims',
      title: 'Excluded trims',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Trims the document explicitly leaves out, for example LX.',
    }),
    defineField({name: 'publishDate', title: 'Publish date', type: 'date'}),
    defineField({name: 'sourceUrl', title: 'Source URL', type: 'url'}),
    defineField({
      name: 'sourceType',
      title: 'Source type',
      type: 'string',
      options: {
        list: [
          {title: 'Service bulletin', value: 'tsb'},
          {title: 'Dealer message', value: 'dealer-message'},
          {title: 'Owner letter', value: 'owner-letter'},
          {title: 'Recall', value: 'recall'},
          {title: 'NHTSA investigation', value: 'investigation'},
          {title: 'Owner complaint', value: 'complaint'},
          {title: 'Owner manual', value: 'manual'},
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
          {title: 'Closed', value: 'closed'},
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
      description: 'Optional. Leave blank when the document publishes no VIN range.',
    }),
    defineField({name: 'vinRangeEnd', title: 'VIN range end', type: 'string'}),
    defineField({
      name: 'nhtsaIds',
      title: 'NHTSA record ids',
      type: 'array',
      of: [{type: 'string'}],
      readOnly: true,
      description:
        'Every NHTSA record this document was built from. Honda resends the same dealer message many times and each resend gets its own id.',
    }),
    defineField({name: 'retrievedAt', title: 'Retrieved at', type: 'datetime', readOnly: true}),
    managedByField,
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
