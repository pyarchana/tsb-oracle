import {createMCPClient} from '@ai-sdk/mcp'
import type {ContextConfig, ContextProvider} from './types'

/**
 * Live Sanity Context endpoint. Serves initial_context and knowledge_base_read
 * in Knowledge Base mode.
 *
 * A 401 means the token is missing or malformed. A 403 contextGrantRequired
 * means the token is not an organization token with Context Viewer permission,
 * which is the mistake a project-level token produces.
 */
export async function createContextClient(config: ContextConfig): Promise<ContextProvider> {
  const mcp = await createMCPClient({
    transport: {
      type: 'http',
      url: config.url,
      headers: {Authorization: `Bearer ${config.token}`},
    },
  })

  return {
    mode: 'knowledge-base',
    tools: () => mcp.tools(),
    close: () => mcp.close(),
  }
}
