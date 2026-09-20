import {defineField, defineType} from 'sanity'

/**
 * Two claims that cannot both be true for the same vehicle.
 *
 * The explanation matters as much as the pair. A user asking about their own
 * car is not helped by being told two sources disagree; they need to know the
 * disagreement is a VIN cutoff, or a supersession, or a model year split, so
 * they can work out which side they fall on.
 */
export const contradiction = defineType({
  name: 'contradiction',
  title: 'Contradiction',
  type: 'document',
  fields: [
    defineField({
      name: 'topic',
      type: 'string',
      description: 'Short human label, for example "CR-V transmission shudder fix".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'claimA',
      title: 'Claim A',
      type: 'reference',
      to: [{type: 'claim'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'claimB',
      title: 'Claim B',
      type: 'reference',
      to: [{type: 'claim'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'explanation',
      type: 'text',
      rows: 4,
      description:
        'Why these conflict: supersession, VIN range, model year split. Not that they conflict, but why.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      type: 'string',
      options: {
        list: [
          {title: 'Unresolved', value: 'unresolved'},
          {title: 'Resolved', value: 'resolved'},
        ],
        layout: 'radio',
      },
      initialValue: 'unresolved',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seedDemoData',
      title: 'Seed demo data',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {topic: 'topic', status: 'status', a: 'claimA.source.tsbNumber', b: 'claimB.source.tsbNumber'},
    prepare({topic, status, a, b}) {
      const between = [a, b].filter(Boolean).join(' vs ')
      return {
        title: topic,
        subtitle: between ? `${status} / ${between}` : status,
      }
    },
  },
})
