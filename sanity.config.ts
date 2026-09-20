import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {apiVersion, dataset, projectId} from './sanity/env'
import {schemaTypes} from './sanity/schemaTypes'

/**
 * Studio config. basePath must match the route the Studio is mounted at,
 * app/studio/[[...tool]], or its internal routing fights Next's.
 */
export default defineConfig({
  name: 'tsb-oracle',
  title: 'TSB Oracle',
  basePath: '/studio',
  projectId,
  dataset,
  schema: {types: schemaTypes},
  plugins: [structureTool(), visionTool({defaultApiVersion: apiVersion})],
})
