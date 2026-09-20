import {defineField, defineType} from 'sanity'

/**
 * One atomic statement pulled out of a source document.
 *
 * Claims exist so contradictions can point at something smaller than a whole
 * bulletin. Two claims conflicting is a fact the agent can show side by side;
 * two documents conflicting is not.
 */
export const claim = defineType({
  name: 'claim',
  title: 'Claim',
  type: 'document',
  fields: [
    defineField({
      name: 'statement',
      type: 'text',
      rows: 3,
      description: 'A single assertion, in one sentence where possible.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'source',
      type: 'reference',
      to: [{type: 'tsb'}],
      description: 'The document this statement was extracted from.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'appliesToModels',
      title: 'Applies to models',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'appliesToYears',
      title: 'Applies to years',
      type: 'array',
      of: [{type: 'number'}],
    }),
    defineField({
      name: 'confidence',
      type: 'string',
      options: {
        list: [
          {title: 'Verified', value: 'verified'},
          {title: 'Reported', value: 'reported'},
          {title: 'Disputed', value: 'disputed'},
        ],
        layout: 'radio',
      },
      description:
        'Verified is a manufacturer statement. Reported is owner testimony. Disputed is contradicted elsewhere.',
      initialValue: 'verified',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'extractedAt', title: 'Extracted at', type: 'datetime'}),
    defineField({
      name: 'seedDemoData',
      title: 'Seed demo data',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {statement: 'statement', confidence: 'confidence', source: 'source.tsbNumber'},
    prepare({statement, confidence, source}) {
      return {
        title: statement,
        subtitle: [source, confidence].filter(Boolean).join(' / '),
      }
    },
  },
})
