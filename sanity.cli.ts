import {defineCliConfig} from 'sanity/cli'
import {dataset, projectId} from './sanity/env'

/**
 * Used by the sanity CLI, notably `sanity schema deploy`, which Context MCP
 * needs before a dataset-backed endpoint will serve anything.
 */
export default defineCliConfig({api: {projectId, dataset}})
