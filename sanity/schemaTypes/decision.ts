import {defineField, defineType} from 'sanity'

/**
 * The record of a contradiction being settled.
 *
 * This is what makes a resolution outlive the conversation it happened in. The
 * agent reads these back on later queries, so the same question asked next week
 * leads with the answer rather than re-opening the same conflict.
 *
 * The agent can only propose one. A proposal counts once a person approves it
 * in the Studio, which is what stops anyone chatting with a public demo from
 * settling a question for everyone who asks after them.
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
      name: 'status',
      type: 'string',
      options: {
        list: [
          {title: 'Proposed', value: 'proposed'},
          {title: 'Approved', value: 'approved'},
          {title: 'Rejected', value: 'rejected'},
        ],
        layout: 'radio',
      },
      description: 'Set by the Approve and Reject actions. Only an approved decision settles anything.',
      initialValue: 'proposed',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'resolvedBy',
      title: 'Proposed by',
      type: 'string',
      options: {
        list: [
          {title: 'Agent', value: 'agent'},
          {title: 'Human', value: 'human'},
        ],
        layout: 'radio',
      },
      initialValue: 'human',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'resolvedAt',
      title: 'Proposed at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'reviewedAt', title: 'Reviewed at', type: 'datetime', readOnly: true}),
  ],
  preview: {
    select: {topic: 'contradiction.topic', status: 'status', by: 'resolvedBy', at: 'resolvedAt'},
    prepare({topic, status, by, at}) {
      return {
        title: topic ?? 'Decision',
        subtitle: [status, by, at ? new Date(at).toLocaleDateString() : null].filter(Boolean).join(' / '),
      }
    },
  },
})
