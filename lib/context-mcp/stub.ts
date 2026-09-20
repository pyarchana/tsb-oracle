import {tool} from 'ai'
import {z} from 'zod'
import {STUB_ENTRIES, STUB_KB_ID, STUB_OUTLINE} from './fixtures'
import type {ContextProvider} from './types'

/**
 * Stands in for a live Context endpoint in Knowledge Base mode.
 *
 * Tool names, parameters and failure behavior copy the real ones, so swapping
 * in the live client changes no agent code. Notably: a read where some paths
 * miss still returns the entries that resolved, with a note about the rest,
 * and only a read where every path misses is an error.
 */
export function createStubContextClient(): ContextProvider {
  return {
    mode: 'stub',

    async tools() {
      return {
        initial_context: tool({
          description:
            'Outline of each Knowledge Base this endpoint serves. Call once to orient before reading entries.',
          inputSchema: z.object({}),
          execute: async () => STUB_OUTLINE,
        }),

        knowledge_base_read: tool({
          description:
            'Read the full content of one or more Knowledge Base entries by id and entry paths taken verbatim from the outline.',
          inputSchema: z.object({
            knowledgeBase: z
              .string()
              .describe('Knowledge Base id, the kb value from initial_context'),
            paths: z
              .array(z.string().min(1))
              .min(1)
              .max(20)
              .describe('Entry paths copied verbatim from the outline'),
          }),
          execute: async ({knowledgeBase, paths}) => {
            if (knowledgeBase !== STUB_KB_ID) {
              throw new Error(
                `Unknown Knowledge Base "${knowledgeBase}". Available: ${STUB_KB_ID}`,
              )
            }

            const found = paths.filter((p) => p in STUB_ENTRIES)
            const missed = paths.filter((p) => !(p in STUB_ENTRIES))

            if (found.length === 0) {
              throw new Error(`No entry matched any of: ${paths.join(', ')}`)
            }

            const body = found.map((p) => STUB_ENTRIES[p]).join('\n\n---\n\n')
            const note =
              missed.length > 0
                ? `\n\n---\n\nNote: no entry resolved for ${missed.join(', ')}`
                : ''

            return body + note
          },
        }),
      }
    },

    async close() {
      // Nothing to tear down.
    },
  }
}
