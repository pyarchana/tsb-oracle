import {defineField, defineType} from 'sanity'
import {managedByField} from './managedBy'

/**
 * Two claims about the same vehicle that lead a reader to different answers.
 *
 * The explanation matters as much as the pair. A user asking about their own
 * car is not helped by being told two sources disagree; they need to know why.
 * A later bulletin revised an earlier one, a remedy stops at a model year or a
 * trim, or the manufacturer's account changed over time. Knowing which, they
 * can work out which side they fall on.
 */
export const contradiction = defineType({
  name: 'contradiction',
  title: 'Contradiction',
  type: 'document',
  fields: [
    defineField({
      name: 'topic',
      type: 'string',
      description: 'Short human label, for example "Cause of unexpected CMBS braking".',
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
        'Why these conflict: a revision, a model year or trim cutoff, a changed account. Not that they conflict, but why.',
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
    managedByField,
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
