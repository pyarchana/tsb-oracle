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

/**
 * Same dataset, CDN bypassed. Use it for reads that must see a write made
 * moments earlier: a decision recorded in one turn has to be visible when the
 * same question is asked in the next.
 *
 * No token, so it reads published documents only, which is all the public
 * dataset exposes anyway.
 */
export const sanityFreshClient = sanityClient.withConfig({useCdn: false})
