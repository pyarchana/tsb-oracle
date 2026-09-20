import type {ToolSet} from 'ai'

/**
 * Knowledge Base mode is what we serve in production. The stub mirrors the same
 * tool surface so the agent loop cannot tell the difference.
 */
export type ContextMode = 'knowledge-base' | 'stub'

/**
 * Sanity Context is read-only in both of its modes. Writes (decision records)
 * go through the Sanity write client instead, never through here.
 */
export interface ContextProvider {
  readonly mode: ContextMode
  tools(): Promise<ToolSet>
  close(): Promise<void>
}

export interface ContextConfig {
  /** https://api.sanity.io/v1/context/organizations/{orgId}/mcp/{endpointName} */
  url: string
  /** Organization-level token with Context Viewer. Not the project token. */
  token: string
}
