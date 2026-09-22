import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {ApproveDecisionAction, RejectDecisionAction} from './sanity/actions/reviewDecision'
import {contradictionStatusBadge} from './sanity/badges/contradictionStatus'
import {apiVersion, dataset, projectId} from './sanity/env'
import {schemaTypes} from './sanity/schemaTypes'
import {structure} from './sanity/structure'

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
  plugins: [structureTool({structure}), visionTool({defaultApiVersion: apiVersion})],
  document: {
    badges: (prev, context) =>
      context.schemaType === 'contradiction' ? [...prev, contradictionStatusBadge] : prev,
    actions: (prev, context) =>
      context.schemaType === 'decision'
        ? [ApproveDecisionAction, RejectDecisionAction, ...prev]
        : prev,
  },
})
