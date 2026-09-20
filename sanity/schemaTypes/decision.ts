import {defineField, defineType} from 'sanity'

/**
 * The record of a contradiction being settled.
 *
 * This is what makes a resolution outlive the conversation it happened in. The
 * agent reads these back on later queries, so the same question asked next week
 * leads with the answer rather than re-opening the same conflict.
 */
export const decision = defineType({
  name: 'decision',
  title: 'Decision',
  type: 'document',
  fields: [
    defineField({
      name: 'contradiction',
      type: 'reference',
      to: [{type: 'contradiction'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'resolvedClaim',
      title: 'Resolved claim',
      type: 'reference',
      to: [{type: 'claim'}],
      description: 'Which of the two claims was determined to apply.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'rationale',
      type: 'text',
      rows: 4,
      description: 'Why this claim won. Cited back to the user on later queries.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'resolvedBy',
      title: 'Resolved by',
      type: 'string',
      options: {
        list: [
          {title: 'Agent', value: 'agent'},
          {title: 'Human', value: 'human'},
        ],
        layout: 'radio',
      },
      initialValue: 'agent',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'resolvedAt',
      title: 'Resolved at',
      type: 'datetime',
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
    select: {topic: 'contradiction.topic', by: 'resolvedBy', at: 'resolvedAt'},
    prepare({topic, by, at}) {
      return {
        title: topic ? `Resolved: ${topic}` : 'Resolved',
        subtitle: [by, at ? new Date(at).toLocaleDateString() : null].filter(Boolean).join(' / '),
      }
    },
  },
})
