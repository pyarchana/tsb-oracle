import {createContextClient} from './client'
import {createStubContextClient} from './stub'
import type {ContextProvider} from './types'

export type {ContextConfig, ContextMode, ContextProvider} from './types'

/**
 * Returns the live Sanity Context client when it is configured, and the stub
 * otherwise.
 *
 * The live endpoint needs three things that are set up outside this repo:
 * Context enabled on the organization, an organization token with Context
 * Viewer permission, and a built Knowledge Base. Until those exist the stub
 * keeps the agent buildable. See README for the exact steps.
 */
export async function resolveContextProvider(): Promise<ContextProvider> {
  const url = process.env.SANITY_CONTEXT_MCP_URL
  const token = process.env.SANITY_ORGANIZATION_TOKEN

  if (!url || !token) {
    console.warn(
      '[context-mcp] SANITY_CONTEXT_MCP_URL or SANITY_ORGANIZATION_TOKEN is unset. ' +
        'Falling back to the stub. Answers come from local fixtures, not your Knowledge Base.',
    )
    return createStubContextClient()
  }

  return createContextClient({url, token})
}
