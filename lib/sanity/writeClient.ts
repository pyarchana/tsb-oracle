import 'server-only'

import {createClient} from 'next-sanity'
import {apiVersion, dataset, projectId} from '@/sanity/env'

/**
 * Authenticated client for the one thing the agent writes: decision records.
 *
 * Sanity Context MCP is read-only, so resolutions cannot go back through it and
 * have to come through here instead.
 *
 * The `server-only` import above is a build-time guard. Importing this from a
 * client component fails the build rather than shipping the token to a browser.
 * The CDN is off because a write followed by a read must not see stale content.
 */
export const sanityWriteClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})
