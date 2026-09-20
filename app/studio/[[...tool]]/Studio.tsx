'use client'

import {NextStudio} from 'next-sanity/studio'
import config from '@/sanity.config'

/**
 * Everything Sanity touches lives behind this boundary.
 *
 * The Studio is a client application. Importing sanity.config.ts from a server
 * component drags the whole sanity package into the RSC graph, where Turbopack
 * resolves swr through its react-server condition and the build fails on a
 * missing default export.
 */
export default function Studio() {
  return <NextStudio config={config} />
}
