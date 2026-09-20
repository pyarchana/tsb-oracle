import type {Metadata, Viewport} from 'next'
import Studio from './Studio'

/**
 * These mirror the values next-sanity exports from 'next-sanity/studio'. They
 * are inlined rather than re-exported because that module reaches the sanity
 * package, and importing it here would put it back in the server graph.
 *
 * There is deliberately no `export const dynamic`. Next 16 dropped it from the
 * route segment config, so the version in most next-sanity guides is stale.
 */
export const metadata: Metadata = {
  referrer: 'same-origin',
  robots: 'noindex',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function StudioPage() {
  return <Studio />
}
