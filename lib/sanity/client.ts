import {createClient} from 'next-sanity'
import {apiVersion, dataset, projectId} from '@/sanity/env'

/**
 * Read-only client for published content. Safe anywhere, including the browser.
 *
 * The CDN is on because everything it reads is published and public. Anything
 * needing drafts or fresh-after-write reads should use the write client.
 */
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
})
